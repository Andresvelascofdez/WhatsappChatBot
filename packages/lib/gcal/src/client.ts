import { google, calendar_v3 } from 'googleapis';
import { z } from 'zod';

export interface GoogleCalendarConfig {
  clientEmail: string;
  privateKey: string;
  calendarId: string;
  timeZone?: string;
}

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  attendees?: string[];
}

export const CalendarEventSchema = z.object({
  id: z.string().optional(),
  summary: z.string().min(1),
  description: z.string().optional(),
  start: z.date(),
  end: z.date(),
  attendees: z.array(z.string()).optional(),
});

export class GoogleCalendarClient {
  private calendar: calendar_v3.Calendar;
  private config: GoogleCalendarConfig;

  constructor(config: GoogleCalendarConfig) {
    this.config = config;
    
    // Create JWT auth client
    const auth = new google.auth.JWT(
      config.clientEmail,
      undefined,
      config.privateKey.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/calendar']
    );

    this.calendar = google.calendar({ version: 'v3', auth });
  }

  /**
   * Create a new calendar event
   */
  async createEvent(event: CalendarEvent): Promise<string> {
    const validatedEvent = CalendarEventSchema.parse(event);

    try {
      const calendarEvent: calendar_v3.Schema$Event = {
        summary: validatedEvent.summary,
        description: validatedEvent.description,
        start: {
          dateTime: validatedEvent.start.toISOString(),
          timeZone: this.config.timeZone || 'UTC',
        },
        end: {
          dateTime: validatedEvent.end.toISOString(),
          timeZone: this.config.timeZone || 'UTC',
        },
        attendees: validatedEvent.attendees?.map(email => ({ email })),
      };

      const response = await this.calendar.events.insert({
        calendarId: this.config.calendarId,
        requestBody: calendarEvent,
      });

      const eventId = response.data.id;
      if (!eventId) {
        throw new Error('No event ID returned from Google Calendar');
      }

      return eventId;
    } catch (error) {
      throw new CalendarError(
        `Failed to create calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CREATE_FAILED'
      );
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<void> {
    try {
      const updateData: calendar_v3.Schema$Event = {};

      if (event.summary) updateData.summary = event.summary;
      if (event.description !== undefined) updateData.description = event.description;
      if (event.start) {
        updateData.start = {
          dateTime: event.start.toISOString(),
          timeZone: this.config.timeZone || 'UTC',
        };
      }
      if (event.end) {
        updateData.end = {
          dateTime: event.end.toISOString(),
          timeZone: this.config.timeZone || 'UTC',
        };
      }
      if (event.attendees) {
        updateData.attendees = event.attendees.map(email => ({ email }));
      }

      await this.calendar.events.patch({
        calendarId: this.config.calendarId,
        eventId,
        requestBody: updateData,
      });
    } catch (error) {
      throw new CalendarError(
        `Failed to update calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UPDATE_FAILED'
      );
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId: this.config.calendarId,
        eventId,
      });
    } catch (error) {
      // Don't throw if event doesn't exist (already deleted)
      if (error instanceof Error && error.message.includes('404')) {
        console.warn(`Calendar event ${eventId} not found, may already be deleted`);
        return;
      }
      
      throw new CalendarError(
        `Failed to delete calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DELETE_FAILED'
      );
    }
  }

  /**
   * Get a calendar event by ID
   */
  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    try {
      const response = await this.calendar.events.get({
        calendarId: this.config.calendarId,
        eventId,
      });

      const event = response.data;
      if (!event.start?.dateTime || !event.end?.dateTime) {
        return null;
      }

      return {
        id: event.id ?? undefined,
        summary: event.summary || '',
        description: event.description ?? undefined,
        start: new Date(event.start.dateTime),
        end: new Date(event.end.dateTime),
        attendees: event.attendees?.map(a => a.email || '').filter(Boolean),
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      
      throw new CalendarError(
        `Failed to get calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_FAILED'
      );
    }
  }

  /**
   * Check if calendar is accessible
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.calendar.calendars.get({
        calendarId: this.config.calendarId,
      });
      return true;
    } catch {
      return false;
    }
  }
}

export class CalendarError extends Error {
  public readonly type: string;

  constructor(message: string, type: string) {
    super(message);
    this.name = 'CalendarError';
    this.type = type;
  }

  toJSON(): object {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
    };
  }
}

// Utility function to create Google Calendar client from environment
export function createGoogleCalendarClientFromEnv(calendarId?: string): GoogleCalendarClient {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const defaultCalendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!clientEmail || !privateKey) {
    throw new Error('Missing required Google Calendar environment variables: GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY');
  }

  const finalCalendarId = calendarId || defaultCalendarId;
  if (!finalCalendarId) {
    throw new Error('Calendar ID must be provided either as parameter or GOOGLE_CALENDAR_ID environment variable');
  }

  return new GoogleCalendarClient({
    clientEmail,
    privateKey,
    calendarId: finalCalendarId,
    timeZone: process.env.TZ_DEFAULT || 'UTC',
  });
}

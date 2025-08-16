import type { GoogleCalendarClient } from './client';
import { z } from 'zod';

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export interface WorkingHours {
  start: string; // HH:mm format (e.g., "09:00")
  end: string;   // HH:mm format (e.g., "17:00")
}

export interface DaySchedule {
  [dayOfWeek: number]: WorkingHours | null; // 0 = Sunday, 1 = Monday, etc.
}

export interface AvailabilityOptions {
  date: Date;
  slotDuration: number; // minutes
  slotGranularity: number; // minutes (e.g., 30 for 30-min slots)
  bufferTime: number; // minutes
  workingHours: DaySchedule;
  timeZone: string;
}

export const AvailabilityOptionsSchema = z.object({
  date: z.date(),
  slotDuration: z.number().int().positive(),
  slotGranularity: z.number().int().positive(),
  bufferTime: z.number().int().nonnegative(),
  workingHours: z.record(z.union([
    z.object({
      start: z.string().regex(/^\d{2}:\d{2}$/),
      end: z.string().regex(/^\d{2}:\d{2}$/),
    }),
    z.null(),
  ])),
  timeZone: z.string(),
});

export class AvailabilityChecker {
  private calendarClient: GoogleCalendarClient;

  constructor(calendarClient: GoogleCalendarClient) {
    this.calendarClient = calendarClient;
  }

  /**
   * Get available time slots for a specific date
   */
  async getAvailableSlots(options: AvailabilityOptions): Promise<TimeSlot[]> {
    const validatedOptions = AvailabilityOptionsSchema.parse(options);
    
    // Get working hours for the day
    const dayOfWeek = validatedOptions.date.getDay();
    const workingHours = validatedOptions.workingHours[dayOfWeek];
    
    if (!workingHours) {
      // Business is closed on this day
      return [];
    }

    // Generate potential time slots
    const potentialSlots = this.generatePotentialSlots(validatedOptions, workingHours);
    
    // Get busy periods from Google Calendar
    const busyPeriods = await this.getBusyPeriods(validatedOptions.date, validatedOptions.timeZone);
    
    // Mark slots as available or busy
    const slotsWithAvailability = potentialSlots.map(slot => ({
      ...slot,
      available: !this.isSlotConflicting(slot, busyPeriods, validatedOptions.bufferTime),
    }));

    return slotsWithAvailability;
  }

  /**
   * Get only available slots (convenience method)
   */
  async getAvailableSlotsOnly(options: AvailabilityOptions): Promise<TimeSlot[]> {
    const allSlots = await this.getAvailableSlots(options);
    return allSlots.filter(slot => slot.available);
  }

  /**
   * Check if a specific time slot is available
   */
  async isSlotAvailable(
    start: Date, 
    end: Date, 
    bufferTime: number = 0, 
    timeZone: string = 'UTC'
  ): Promise<boolean> {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const busyPeriods = await this.getBusyPeriods(date, timeZone);
    
    const slot: TimeSlot = { start, end, available: true };
    return !this.isSlotConflicting(slot, busyPeriods, bufferTime);
  }

  private generatePotentialSlots(options: AvailabilityOptions, workingHours: WorkingHours): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const { date, slotDuration, slotGranularity } = options;
    
    // Parse working hours
    const [startHour, startMinute] = workingHours.start.split(':').map(Number);
    const [endHour, endMinute] = workingHours.end.split(':').map(Number);
    
    // Create start and end times for the day
    const dayStart = new Date(date);
    dayStart.setHours(startHour, startMinute, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(endHour, endMinute, 0, 0);
    
    // Generate slots
    let currentTime = new Date(dayStart);
    
    while (currentTime < dayEnd) {
      const slotEnd = new Date(currentTime);
      slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);
      
      // Check if slot fits within working hours
      if (slotEnd <= dayEnd) {
        slots.push({
          start: new Date(currentTime),
          end: slotEnd,
          available: true, // Will be determined later
        });
      }
      
      // Move to next slot start time
      currentTime.setMinutes(currentTime.getMinutes() + slotGranularity);
    }
    
    return slots;
  }

  private async getBusyPeriods(date: Date, timeZone: string): Promise<Array<{ start: Date; end: Date }>> {
    try {
      // Get events for the entire day
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const response = await (this.calendarClient as any).calendar.events.list({
        calendarId: (this.calendarClient as any).config.calendarId,
        timeMin: dayStart.toISOString(),
        timeMax: dayEnd.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];
      const busyPeriods: Array<{ start: Date; end: Date }> = [];

      for (const event of events) {
        if (event.start?.dateTime && event.end?.dateTime) {
          busyPeriods.push({
            start: new Date(event.start.dateTime),
            end: new Date(event.end.dateTime),
          });
        }
      }

      return busyPeriods;
    } catch (error) {
      console.error('Failed to get busy periods:', error);
      // Return empty array on error to be safe (assume all slots are busy)
      return [];
    }
  }

  private isSlotConflicting(
    slot: TimeSlot, 
    busyPeriods: Array<{ start: Date; end: Date }>, 
    bufferTime: number
  ): boolean {
    // Add buffer time to the slot
    const bufferedStart = new Date(slot.start);
    bufferedStart.setMinutes(bufferedStart.getMinutes() - bufferTime);
    
    const bufferedEnd = new Date(slot.end);
    bufferedEnd.setMinutes(bufferedEnd.getMinutes() + bufferTime);

    // Check if buffered slot overlaps with any busy period
    for (const busyPeriod of busyPeriods) {
      if (
        bufferedStart < busyPeriod.end && 
        bufferedEnd > busyPeriod.start
      ) {
        return true;
      }
    }

    return false;
  }
}

// Utility functions for working with time zones
export function convertToTimeZone(date: Date, timeZone: string): Date {
  return new Date(date.toLocaleString('en-US', { timeZone }));
}

export function formatTimeSlot(slot: TimeSlot, timeZone: string, locale: string = 'es-ES'): string {
  const start = convertToTimeZone(slot.start, timeZone);
  const end = convertToTimeZone(slot.end, timeZone);
  
  const startTime = start.toLocaleTimeString(locale, { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
  const endTime = end.toLocaleTimeString(locale, { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
  
  return `${startTime} - ${endTime}`;
}

// Default working hours (Monday to Friday 9-17, Saturday 10-14)
export const DEFAULT_WORKING_HOURS: DaySchedule = {
  0: null, // Sunday - closed
  1: { start: '09:00', end: '17:00' }, // Monday
  2: { start: '09:00', end: '17:00' }, // Tuesday
  3: { start: '09:00', end: '17:00' }, // Wednesday
  4: { start: '09:00', end: '17:00' }, // Thursday
  5: { start: '09:00', end: '17:00' }, // Friday
  6: { start: '10:00', end: '14:00' }, // Saturday
};

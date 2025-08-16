import type { GoogleCalendarClient, CalendarEvent } from './client';

export interface AppointmentEventData {
  customerName: string;
  customerPhone: string;
  serviceName: string;
  duration: number; // minutes
  appointmentId: string;
  tenantName: string;
}

export class CalendarEventManager {
  private calendarClient: GoogleCalendarClient;

  constructor(calendarClient: GoogleCalendarClient) {
    this.calendarClient = calendarClient;
  }

  /**
   * Create a new appointment event in the calendar
   */
  async createAppointmentEvent(
    start: Date,
    eventData: AppointmentEventData
  ): Promise<string> {
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + eventData.duration);

    const event: CalendarEvent = {
      summary: `${eventData.serviceName} - ${eventData.customerName}`,
      description: this.buildEventDescription(eventData),
      start,
      end,
      attendees: [eventData.customerPhone + '@whatsapp.com'], // Not a real email, just for reference
    };

    return await this.calendarClient.createEvent(event);
  }

  /**
   * Update an existing appointment event
   */
  async updateAppointmentEvent(
    eventId: string,
    start?: Date,
    eventData?: Partial<AppointmentEventData>
  ): Promise<void> {
    const updateData: Partial<CalendarEvent> = {};

    if (start && eventData?.duration) {
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + eventData.duration);
      updateData.start = start;
      updateData.end = end;
    }

    if (eventData) {
      if (eventData.serviceName || eventData.customerName) {
        updateData.summary = `${eventData.serviceName || 'Service'} - ${eventData.customerName || 'Customer'}`;
      }
      
      if (eventData.customerName || eventData.customerPhone || eventData.serviceName || eventData.appointmentId || eventData.tenantName) {
        updateData.description = this.buildEventDescription(eventData as AppointmentEventData);
      }

      if (eventData.customerPhone) {
        updateData.attendees = [eventData.customerPhone + '@whatsapp.com'];
      }
    }

    await this.calendarClient.updateEvent(eventId, updateData);
  }

  /**
   * Cancel (delete) an appointment event
   */
  async cancelAppointmentEvent(eventId: string): Promise<void> {
    await this.calendarClient.deleteEvent(eventId);
  }

  /**
   * Get appointment event details
   */
  async getAppointmentEvent(eventId: string): Promise<CalendarEvent | null> {
    return await this.calendarClient.getEvent(eventId);
  }

  /**
   * Reschedule an appointment to a new time
   */
  async rescheduleAppointment(
    eventId: string,
    newStart: Date,
    duration: number
  ): Promise<void> {
    const newEnd = new Date(newStart);
    newEnd.setMinutes(newEnd.getMinutes() + duration);

    await this.calendarClient.updateEvent(eventId, {
      start: newStart,
      end: newEnd,
    });
  }

  /**
   * Block time in calendar (for breaks, holidays, etc.)
   */
  async createBlockedTime(
    start: Date,
    end: Date,
    reason: string = 'Blocked'
  ): Promise<string> {
    const event: CalendarEvent = {
      summary: `🚫 ${reason}`,
      description: `Tiempo bloqueado: ${reason}`,
      start,
      end,
    };

    return await this.calendarClient.createEvent(event);
  }

  private buildEventDescription(eventData: Partial<AppointmentEventData>): string {
    const lines: string[] = [];
    
    if (eventData.tenantName) {
      lines.push(`🏢 Negocio: ${eventData.tenantName}`);
    }
    
    if (eventData.serviceName) {
      lines.push(`💼 Servicio: ${eventData.serviceName}`);
    }
    
    if (eventData.customerName) {
      lines.push(`👤 Cliente: ${eventData.customerName}`);
    }
    
    if (eventData.customerPhone) {
      lines.push(`📱 Teléfono: ${eventData.customerPhone}`);
    }
    
    if (eventData.duration) {
      lines.push(`⏱️ Duración: ${eventData.duration} minutos`);
    }
    
    if (eventData.appointmentId) {
      lines.push(`🆔 ID Cita: ${eventData.appointmentId}`);
    }

    lines.push('');
    lines.push('📋 Creado por WhatsApp Booking Chatbot');

    return lines.join('\n');
  }
}

// Utility functions for event formatting
export function formatEventSummary(serviceName: string, customerName: string): string {
  return `${serviceName} - ${customerName}`;
}

export function parseEventDescription(description: string): Partial<AppointmentEventData> {
  const data: Partial<AppointmentEventData> = {};
  
  const lines = description.split('\n');
  
  for (const line of lines) {
    if (line.includes('Servicio:')) {
      data.serviceName = line.split('Servicio:')[1]?.trim();
    } else if (line.includes('Cliente:')) {
      data.customerName = line.split('Cliente:')[1]?.trim();
    } else if (line.includes('Teléfono:')) {
      data.customerPhone = line.split('Teléfono:')[1]?.trim();
    } else if (line.includes('Duración:')) {
      const durationMatch = line.match(/(\d+)\s*minutos/);
      if (durationMatch) {
        data.duration = parseInt(durationMatch[1]);
      }
    } else if (line.includes('ID Cita:')) {
      data.appointmentId = line.split('ID Cita:')[1]?.trim();
    } else if (line.includes('Negocio:')) {
      data.tenantName = line.split('Negocio:')[1]?.trim();
    }
  }
  
  return data;
}

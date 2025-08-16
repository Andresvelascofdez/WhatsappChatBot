import { z } from 'zod';
import type { Service } from '@chatbot/db';

export interface SlotGenerationOptions {
  service: Service;
  date: Date;
  workingHours: {
    start: string; // HH:mm format
    end: string;   // HH:mm format
  } | null;
  timeZone: string;
  excludedPeriods?: Array<{
    start: Date;
    end: Date;
  }>;
}

export interface GeneratedSlot {
  start: Date;
  end: Date;
  serviceId: string;
  available: boolean;
  conflictReason?: string;
}

export const SlotGenerationOptionsSchema = z.object({
  service: z.object({
    id: z.string(),
    name: z.string(),
    tenant_id: z.string(),
    duration_min: z.number().int().positive(),
    price_cents: z.number().int().nonnegative(),
    slot_granularity_min: z.number().int().positive(),
    buffer_min: z.number().int().nonnegative(),
    is_active: z.boolean(),
  }),
  date: z.date(),
  workingHours: z.union([
    z.object({
      start: z.string().regex(/^\d{2}:\d{2}$/),
      end: z.string().regex(/^\d{2}:\d{2}$/),
    }),
    z.null(),
  ]),
  timeZone: z.string(),
  excludedPeriods: z.array(z.object({
    start: z.date(),
    end: z.date(),
  })).optional(),
});

export class SlotGenerator {
  /**
   * Generate available time slots for a service on a specific date
   */
  generateSlots(options: SlotGenerationOptions): GeneratedSlot[] {
    const validatedOptions = SlotGenerationOptionsSchema.parse(options);
    
    // If no working hours for this day, return empty array
    if (!validatedOptions.workingHours) {
      return [];
    }

    const slots = this.generatePotentialSlots(validatedOptions);
    return this.markSlotAvailability(slots, validatedOptions.excludedPeriods || []);
  }

  /**
   * Generate slots that can fit within working hours
   */
  private generatePotentialSlots(options: SlotGenerationOptions): GeneratedSlot[] {
    const { service, date, workingHours } = options;
    
    if (!workingHours) return [];

    const slots: GeneratedSlot[] = [];
    
    // Parse working hours
    const [startHour, startMinute] = workingHours.start.split(':').map(Number);
    const [endHour, endMinute] = workingHours.end.split(':').map(Number);
    
    // Create start and end times for the day
    const dayStart = new Date(date);
    dayStart.setHours(startHour, startMinute, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(endHour, endMinute, 0, 0);
    
    // Generate slots based on granularity
    let currentTime = new Date(dayStart);
    
    while (currentTime < dayEnd) {
      const slotEnd = new Date(currentTime);
      slotEnd.setMinutes(slotEnd.getMinutes() + service.duration_min);
      
      // Check if the entire service duration fits within working hours
      if (slotEnd <= dayEnd) {
        slots.push({
          start: new Date(currentTime),
          end: slotEnd,
          serviceId: service.id,
          available: true, // Will be determined later
        });
      }
      
      // Move to next potential slot start time
      currentTime.setMinutes(currentTime.getMinutes() + service.slot_granularity_min);
    }
    
    return slots;
  }

  /**
   * Mark slots as available or conflicting based on excluded periods
   */
  private markSlotAvailability(
    slots: GeneratedSlot[],
    excludedPeriods: Array<{ start: Date; end: Date }>
  ): GeneratedSlot[] {
    return slots.map(slot => {
      // Check for conflicts with excluded periods
      for (const excluded of excludedPeriods) {
        if (this.slotsOverlap(slot, excluded)) {
          return {
            ...slot,
            available: false,
            conflictReason: 'Time slot is already booked',
          };
        }
      }
      
      return slot;
    });
  }

  /**
   * Check if two time periods overlap (considering buffer time)
   */
  private slotsOverlap(
    slot: { start: Date; end: Date },
    excluded: { start: Date; end: Date },
    bufferTime: number = 0
  ): boolean {
    // Add buffer time to the slot
    const bufferedStart = new Date(slot.start);
    bufferedStart.setMinutes(bufferedStart.getMinutes() - bufferTime);
    
    const bufferedEnd = new Date(slot.end);
    bufferedEnd.setMinutes(bufferedEnd.getMinutes() + bufferTime);

    // Check if buffered slot overlaps with excluded period
    return bufferedStart < excluded.end && bufferedEnd > excluded.start;
  }

  /**
   * Get the next N available slots
   */
  getNextAvailableSlots(slots: GeneratedSlot[], count: number = 5): GeneratedSlot[] {
    return slots
      .filter(slot => slot.available)
      .slice(0, count);
  }

  /**
   * Find the first available slot after a specific time
   */
  findFirstAvailableSlot(slots: GeneratedSlot[], afterTime?: Date): GeneratedSlot | null {
    const now = afterTime || new Date();
    
    return slots.find(slot => 
      slot.available && slot.start >= now
    ) || null;
  }

  /**
   * Check if a specific time slot is available
   */
  isSlotAvailable(
    slots: GeneratedSlot[],
    targetStart: Date,
    targetEnd: Date
  ): boolean {
    return slots.some(slot => 
      slot.available &&
      slot.start.getTime() === targetStart.getTime() &&
      slot.end.getTime() === targetEnd.getTime()
    );
  }
}

/**
 * Utility functions for working with slots
 */

export function formatSlotTime(slot: GeneratedSlot, locale: string = 'es-ES'): string {
  const startTime = slot.start.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  
  const endTime = slot.end.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  
  return `${startTime} - ${endTime}`;
}

export function formatSlotDate(slot: GeneratedSlot, locale: string = 'es-ES'): string {
  return slot.start.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function groupSlotsByDate(slots: GeneratedSlot[]): Map<string, GeneratedSlot[]> {
  const groups = new Map<string, GeneratedSlot[]>();
  
  for (const slot of slots) {
    const dateKey = slot.start.toISOString().split('T')[0]; // YYYY-MM-DD
    const existing = groups.get(dateKey) || [];
    existing.push(slot);
    groups.set(dateKey, existing);
  }
  
  return groups;
}

export function filterSlotsAfterTime(slots: GeneratedSlot[], afterTime: Date): GeneratedSlot[] {
  return slots.filter(slot => slot.start >= afterTime);
}

export function calculateSlotDuration(slot: GeneratedSlot): number {
  return Math.round((slot.end.getTime() - slot.start.getTime()) / (1000 * 60)); // minutes
}

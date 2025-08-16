import { z } from 'zod';
import type { 
  Service, 
  Customer, 
  Appointment, 
  AppointmentRepository,
  ServiceRepository,
  CustomerRepository 
} from '@chatbot/db';
import type { GeneratedSlot } from './slot-generator';
import { SlotGenerator } from './slot-generator';

export interface BookingRequest {
  tenantId: string;
  customerId: string;
  serviceId: string;
  slotStart: Date;
  slotEnd: Date;
  customerName?: string;
  customerPhone?: string;
}

export interface BookingResult {
  success: boolean;
  appointmentId?: string;
  conflictReason?: string;
  alternativeSlots?: GeneratedSlot[];
}

export interface HoldRequest {
  tenantId: string;
  customerId: string;
  serviceId: string;
  slotStart: Date;
  slotEnd: Date;
  holdDurationMinutes?: number;
}

export interface HoldResult {
  success: boolean;
  appointmentId?: string;
  expiresAt?: Date;
  conflictReason?: string;
}

export const BookingRequestSchema = z.object({
  tenantId: z.string().uuid(),
  customerId: z.string().uuid(),
  serviceId: z.string().uuid(),
  slotStart: z.date(),
  slotEnd: z.date(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
});

export const HoldRequestSchema = z.object({
  tenantId: z.string().uuid(),
  customerId: z.string().uuid(),
  serviceId: z.string().uuid(),
  slotStart: z.date(),
  slotEnd: z.date(),
  holdDurationMinutes: z.number().int().positive().default(5),
});

export class BookingService {
  private appointmentRepo: AppointmentRepository;
  private serviceRepo: ServiceRepository;
  private customerRepo: CustomerRepository;
  private slotGenerator: SlotGenerator;

  constructor(
    appointmentRepo: AppointmentRepository,
    serviceRepo: ServiceRepository,
    customerRepo: CustomerRepository
  ) {
    this.appointmentRepo = appointmentRepo;
    this.serviceRepo = serviceRepo;
    this.customerRepo = customerRepo;
    this.slotGenerator = new SlotGenerator();
  }

  /**
   * Place a temporary hold on a time slot
   */
  async holdSlot(request: HoldRequest): Promise<HoldResult> {
    const validatedRequest = HoldRequestSchema.parse(request);

    try {
      // Check if slot is available
      const conflictingAppointments = await this.appointmentRepo.findConflicting(
        validatedRequest.tenantId,
        validatedRequest.slotStart,
        validatedRequest.slotEnd
      );

      if (conflictingAppointments.length > 0) {
        return {
          success: false,
          conflictReason: 'Time slot is already booked or held',
        };
      }

      // Create pending appointment with expiration
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + validatedRequest.holdDurationMinutes);

      const appointment = await this.appointmentRepo.create(validatedRequest.tenantId, {
        customer_id: validatedRequest.customerId,
        service_id: validatedRequest.serviceId,
        start_ts: validatedRequest.slotStart,
        end_ts: validatedRequest.slotEnd,
        status: 'pending',
        gcal_event_id: null,
        expires_at: expiresAt,
      });

      return {
        success: true,
        appointmentId: appointment.id,
        expiresAt,
      };
    } catch (error) {
      // Handle unique constraint violation (concurrent booking attempt)
      if (error instanceof Error && error.message.includes('unique')) {
        return {
          success: false,
          conflictReason: 'Time slot was just booked by another customer',
        };
      }

      throw error;
    }
  }

  /**
   * Confirm a held appointment
   */
  async confirmAppointment(
    tenantId: string,
    appointmentId: string,
    gcalEventId?: string
  ): Promise<BookingResult> {
    try {
      await this.appointmentRepo.updateStatus(
        tenantId,
        appointmentId,
        'confirmed',
        gcalEventId
      );

      return {
        success: true,
        appointmentId,
      };
    } catch (error) {
      return {
        success: false,
        conflictReason: `Failed to confirm appointment: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(
    tenantId: string,
    appointmentId: string
  ): Promise<BookingResult> {
    try {
      await this.appointmentRepo.updateStatus(
        tenantId,
        appointmentId,
        'cancelled'
      );

      return {
        success: true,
        appointmentId,
      };
    } catch (error) {
      return {
        success: false,
        conflictReason: `Failed to cancel appointment: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Find customer's pending appointment
   */
  async findPendingAppointment(
    tenantId: string,
    customerId: string
  ): Promise<Appointment | null> {
    return await this.appointmentRepo.findPending(tenantId, customerId);
  }

  /**
   * Get alternative slots when requested slot is not available
   */
  async getAlternativeSlots(
    tenantId: string,
    serviceId: string,
    preferredDate: Date,
    count: number = 5
  ): Promise<GeneratedSlot[]> {
    // Get service details
    const service = await this.serviceRepo.findById(tenantId, serviceId);
    if (!service) {
      return [];
    }

    // Get conflicting appointments for the date
    const dayStart = new Date(preferredDate);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(preferredDate);
    dayEnd.setHours(23, 59, 59, 999);

    const conflictingAppointments = await this.appointmentRepo.findConflicting(
      tenantId,
      dayStart,
      dayEnd
    );

    // Convert conflicting appointments to excluded periods
    const excludedPeriods = conflictingAppointments.map((apt: Appointment) => ({
      start: apt.start_ts,
      end: apt.end_ts,
    }));

    // TODO: Get working hours from tenant configuration
    // For now, use default business hours
    const workingHours = {
      start: '09:00',
      end: '17:00',
    };

    // Generate available slots
    const slots = this.slotGenerator.generateSlots({
      service,
      date: preferredDate,
      workingHours,
      timeZone: 'Europe/Madrid', // TODO: Get from tenant config
      excludedPeriods,
    });

    return this.slotGenerator.getNextAvailableSlots(slots, count);
  }

  /**
   * Book a slot directly (hold + confirm in one step)
   */
  async bookSlot(request: BookingRequest): Promise<BookingResult> {
    const validatedRequest = BookingRequestSchema.parse(request);

    // First, try to hold the slot
    const holdResult = await this.holdSlot({
      tenantId: validatedRequest.tenantId,
      customerId: validatedRequest.customerId,
      serviceId: validatedRequest.serviceId,
      slotStart: validatedRequest.slotStart,
      slotEnd: validatedRequest.slotEnd,
      holdDurationMinutes: 1, // Very short hold for direct booking
    });

    if (!holdResult.success) {
      // Get alternative slots if the requested slot is not available
      const alternativeSlots = await this.getAlternativeSlots(
        validatedRequest.tenantId,
        validatedRequest.serviceId,
        validatedRequest.slotStart
      );

      return {
        success: false,
        conflictReason: holdResult.conflictReason,
        alternativeSlots,
      };
    }

    // Immediately confirm the appointment
    const confirmResult = await this.confirmAppointment(
      validatedRequest.tenantId,
      holdResult.appointmentId!
    );

    return confirmResult;
  }

  /**
   * Cleanup expired holds
   */
  async cleanupExpiredHolds(): Promise<number> {
    // This would typically be called by a scheduled job
    // Returns the number of expired appointments marked as 'expired'
    
    // Note: The actual cleanup is handled by the database function
    // clean_expired_appointments() which is called from the db package
    
    return 0; // Placeholder
  }
}

// Utility functions
export function calculateDurationMinutes(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
}

export function addMinutesToDate(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

export function isSlotInPast(slotStart: Date, bufferMinutes: number = 0): boolean {
  const now = new Date();
  const bufferTime = new Date(now);
  bufferTime.setMinutes(bufferTime.getMinutes() + bufferMinutes);
  
  return slotStart <= bufferTime;
}

import { Hono } from 'hono';
import { z } from 'zod';
import { BookingService } from '@chatbot/booking';
import { AppConfig } from './config';

/**
 * Availability request schema
 */
const AvailabilityRequestSchema = z.object({
  tenantId: z.string().uuid(),
  serviceId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  timezone: z.string().default('UTC'),
});

/**
 * Booking request schema
 */
const BookingRequestSchema = z.object({
  tenantId: z.string().uuid(),
  serviceId: z.string().uuid(),
  customerId: z.string().uuid(),
  slotStart: z.string().datetime(),
  slotEnd: z.string().datetime(),
  customerName: z.string().min(1).optional(),
  customerPhone: z.string().min(1).optional(),
});

/**
 * Confirmation request schema
 */
const ConfirmBookingSchema = z.object({
  tenantId: z.string().uuid(),
  appointmentId: z.string().uuid(),
});

/**
 * Create booking API endpoints
 */
export function createBookingAPI(bookingService: BookingService, config: AppConfig) {
  const app = new Hono();

  /**
   * POST /availability - Get alternative slots (simulates availability check)
   */
  app.post('/availability', async (c) => {
    try {
      const body = await c.req.json();
      const { tenantId, serviceId, date } = AvailabilityRequestSchema.parse(body);
      
      // Use getAlternativeSlots to simulate availability check
      const slots = await bookingService.getAlternativeSlots(
        tenantId,
        serviceId,
        new Date(date),
        5 // count
      );

      return c.json({
        success: true,
        data: {
          date,
          serviceId,
          slots: slots.map(slot => ({
            start: slot.start.toISOString(),
            end: slot.end.toISOString(),
            available: slot.available,
            conflictReason: slot.conflictReason,
          })),
        },
      });
    } catch (error) {
      console.error('Availability check failed:', error);
      return c.json({
        success: false,
        error: 'Failed to check availability',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, 500);
    }
  });

  /**
   * POST /book - Create a booking
   */
  app.post('/book', async (c) => {
    try {
      const body = await c.req.json();
      const bookingData = BookingRequestSchema.parse(body);
      
      const result = await bookingService.bookSlot({
        tenantId: bookingData.tenantId,
        customerId: bookingData.customerId,
        serviceId: bookingData.serviceId,
        slotStart: new Date(bookingData.slotStart),
        slotEnd: new Date(bookingData.slotEnd),
        customerName: bookingData.customerName,
        customerPhone: bookingData.customerPhone,
      });

      if (result.success) {
        return c.json({
          success: true,
          data: {
            appointmentId: result.appointmentId,
            status: 'pending',
            expiresIn: '15 minutes',
          },
        });
      } else {
        return c.json({
          success: false,
          error: 'Booking failed',
          reason: result.conflictReason,
          alternatives: result.alternativeSlots?.map(slot => ({
            start: slot.start.toISOString(),
            end: slot.end.toISOString(),
          })),
        }, 409);
      }
    } catch (error) {
      console.error('Booking creation failed:', error);
      return c.json({
        success: false,
        error: 'Failed to create booking',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, 500);
    }
  });

  /**
   * POST /confirm - Confirm a pending booking
   */
  app.post('/confirm', async (c) => {
    try {
      const body = await c.req.json();
      const { tenantId, appointmentId } = ConfirmBookingSchema.parse(body);
      
      const result = await bookingService.confirmAppointment(tenantId, appointmentId);

      if (result.success) {
        return c.json({
          success: true,
          data: {
            appointmentId,
            status: 'confirmed',
          },
        });
      } else {
        return c.json({
          success: false,
          error: 'Confirmation failed',
          reason: result.conflictReason,
        }, 400);
      }
    } catch (error) {
      console.error('Booking confirmation failed:', error);
      return c.json({
        success: false,
        error: 'Failed to confirm booking',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, 500);
    }
  });

  /**
   * DELETE /appointment/:id - Cancel an appointment
   */
  app.delete('/appointment/:id', async (c) => {
    try {
      const appointmentId = c.req.param('id');
      const tenantId = c.req.header('x-tenant-id');

      if (!tenantId) {
        return c.json({
          success: false,
          error: 'Tenant ID required',
        }, 400);
      }

      const result = await bookingService.cancelAppointment(tenantId, appointmentId);

      if (result.success) {
        return c.json({
          success: true,
          data: {
            appointmentId,
            status: 'cancelled',
          },
        });
      } else {
        return c.json({
          success: false,
          error: 'Cancellation failed',
          reason: result.conflictReason,
        }, 400);
      }
    } catch (error) {
      console.error('Booking cancellation failed:', error);
      return c.json({
        success: false,
        error: 'Failed to cancel booking',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, 500);
    }
  });

  return app;
}

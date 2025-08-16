import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createBookingAPI } from '../src/booking-api';
import { BookingService } from '@chatbot/booking';
import { AppConfig } from '../src/config';
import { Hono } from 'hono';

// Mock BookingService
const mockBookingService = {
  getAlternativeSlots: vi.fn(),
  bookSlot: vi.fn(),
  confirmAppointment: vi.fn(),
  cancelAppointment: vi.fn(),
} as unknown as BookingService;

const mockConfig = {} as AppConfig;

describe('Booking API', () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createBookingAPI(mockBookingService, mockConfig);
  });

  describe('POST /availability', () => {
    it('should return available slots', async () => {
      const mockSlots = [
        {
          start: new Date('2025-08-16T09:00:00Z'),
          end: new Date('2025-08-16T10:00:00Z'),
          serviceId: 'service-1',
          available: true,
        },
      ];

      mockBookingService.getAlternativeSlots = vi.fn().mockResolvedValue(mockSlots);

      const response = await app.request('/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: '123e4567-e89b-12d3-a456-426614174000',
          serviceId: '123e4567-e89b-12d3-a456-426614174001',
          date: '2025-08-16',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.slots).toHaveLength(1);
      expect(data.data.slots[0].start).toBe('2025-08-16T09:00:00.000Z');
    });

    it('should handle validation errors', async () => {
      const response = await app.request('/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 'invalid-uuid',
          serviceId: '123e4567-e89b-12d3-a456-426614174001',
          date: '2025-08-16',
        }),
      });

      expect(response.status).toBe(500);
    });
  });

  describe('POST /book', () => {
    it('should create a booking successfully', async () => {
      const mockResult = {
        success: true,
        appointmentId: 'appt-123',
      };

      mockBookingService.bookSlot = vi.fn().mockResolvedValue(mockResult);

      const response = await app.request('/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: '123e4567-e89b-12d3-a456-426614174000',
          serviceId: '123e4567-e89b-12d3-a456-426614174001',
          customerId: '123e4567-e89b-12d3-a456-426614174002',
          slotStart: '2025-08-16T09:00:00Z',
          slotEnd: '2025-08-16T10:00:00Z',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.appointmentId).toBe('appt-123');
    });

    it('should handle booking conflicts', async () => {
      const mockResult = {
        success: false,
        conflictReason: 'Slot already booked',
        alternativeSlots: [
          {
            start: new Date('2025-08-16T10:00:00Z'),
            end: new Date('2025-08-16T11:00:00Z'),
          },
        ],
      };

      mockBookingService.bookSlot = vi.fn().mockResolvedValue(mockResult);

      const response = await app.request('/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: '123e4567-e89b-12d3-a456-426614174000',
          serviceId: '123e4567-e89b-12d3-a456-426614174001',
          customerId: '123e4567-e89b-12d3-a456-426614174002',
          slotStart: '2025-08-16T09:00:00Z',
          slotEnd: '2025-08-16T10:00:00Z',
        }),
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.reason).toBe('Slot already booked');
      expect(data.alternatives).toHaveLength(1);
    });
  });

  describe('POST /confirm', () => {
    it('should confirm a booking', async () => {
      const mockResult = {
        success: true,
        appointmentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      };

      mockBookingService.confirmAppointment = vi.fn().mockResolvedValue(mockResult);

      const response = await app.request('/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: '123e4567-e89b-12d3-a456-426614174000',
          appointmentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('confirmed');
    });
  });

  describe('DELETE /appointment/:id', () => {
    it('should cancel an appointment', async () => {
      const mockResult = {
        success: true,
        appointmentId: 'appt-123',
      };

      mockBookingService.cancelAppointment = vi.fn().mockResolvedValue(mockResult);

      const response = await app.request('/appointment/appt-123', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'x-tenant-id': '123e4567-e89b-12d3-a456-426614174000',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('cancelled');
    });

    it('should require tenant ID', async () => {
      const response = await app.request('/appointment/appt-123', {
        method: 'DELETE',
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Tenant ID required');
    });
  });
});

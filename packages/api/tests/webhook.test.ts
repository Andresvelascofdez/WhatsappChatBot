import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createWebhookHandler } from '../src/webhook';
import type { AppConfig } from '../src/config';

// Mock dependencies
vi.mock('@chatbot/db', () => ({
  createDatabaseClient: vi.fn(),
  AppointmentRepository: vi.fn(() => ({})),
  ServiceRepository: vi.fn(() => ({})),
  CustomerRepository: vi.fn(() => ({})),
}));

vi.mock('@chatbot/gcal', () => ({
  GoogleCalendarClient: vi.fn(() => ({})),
}));

vi.mock('@chatbot/booking', () => ({
  BookingService: vi.fn(() => ({
    getAlternativeSlots: vi.fn(),
    bookSlot: vi.fn(),
    confirmAppointment: vi.fn(),
    cancelAppointment: vi.fn(),
  })),
}));

vi.mock('../src/handlers', () => ({
  createMessageHandler: vi.fn(() => ({
    handleMessage: vi.fn(),
  })),
}));

vi.mock('../src/booking-api', () => ({
  createBookingAPI: vi.fn(() => ({
    routes: [],
  })),
}));

describe('WhatsApp Webhook', () => {
  let app: any;
  let mockConfig: AppConfig;

  beforeEach(() => {
    mockConfig = {
      env: {} as any, // Mock env object
      database: {
        url: 'test-db-url',
        anonKey: 'test-anon-key',
        serviceRoleKey: 'test-service-key',
      },
      google: {
        serviceAccountEmail: 'test@example.com',
        serviceAccountPrivateKey: 'test-key',
        calendarId: 'test-calendar',
      },
      whatsapp: {
        webhookVerifyToken: 'test-verify-token',
        apiUrl: 'https://api.example.com',
        apiKey: 'test-api-key',
      },
      booking: {
        defaultHoldDurationMinutes: 15,
        maxAdvanceBookingDays: 30,
      },
    };

    app = createWebhookHandler(mockConfig);
  });

  describe('Webhook Handler Creation', () => {
    it('should create webhook handler successfully', async () => {
      expect(app).toBeDefined();
      expect(typeof app.request).toBe('function');
    });
  });

  describe('Basic Webhook Routes', () => {
    it('should handle GET requests to root', async () => {
      const response = await app.request('/', {
        method: 'GET',
      });

      // Should not crash - exact response depends on implementation
      expect(response).toBeDefined();
    });

    it('should handle POST requests to root', async () => {
      const response = await app.request('/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'data' }),
      });

      // Should not crash - exact response depends on implementation
      expect(response).toBeDefined();
    });
  });
});

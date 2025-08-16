import { Hono } from 'hono';
import { z } from 'zod';
import { 
  IncomingMessage,
  IncomingMessageSchema 
} from '@chatbot/wa';
import { 
  createDatabaseClient,
  AppointmentRepository,
  ServiceRepository,
  CustomerRepository
} from '@chatbot/db';
import { GoogleCalendarClient } from '@chatbot/gcal';
import { BookingService } from '@chatbot/booking';
import { createAppConfig, AppConfig } from './config';
import { createMessageHandler } from './handlers';
import { createBookingAPI } from './booking-api';

/**
 * WhatsApp webhook verification schema
 */
const WebhookVerificationSchema = z.object({
  'hub.mode': z.literal('subscribe'),
  'hub.verify_token': z.string(),
  'hub.challenge': z.string(),
});

/**
 * WhatsApp webhook payload schema
 */
const WebhookPayloadSchema = z.object({
  object: z.literal('whatsapp_business_account'),
  entry: z.array(z.object({
    id: z.string(),
    changes: z.array(z.object({
      value: z.object({
        messaging_product: z.literal('whatsapp'),
        metadata: z.object({
          display_phone_number: z.string(),
          phone_number_id: z.string(),
        }),
        messages: z.array(IncomingMessageSchema).optional(),
        statuses: z.array(z.any()).optional(), // Status updates
      }),
      field: z.literal('messages'),
    })),
  })),
});

export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;

/**
 * Create WhatsApp webhook handler
 */
export function createWebhookHandler(config: AppConfig) {
  const app = new Hono();

  // Initialize services
  createDatabaseClient({
    url: config.database.url,
    serviceRoleKey: config.database.serviceRoleKey,
  });

  const calendarClient = new GoogleCalendarClient({
    clientEmail: config.google.serviceAccountEmail,
    privateKey: config.google.serviceAccountPrivateKey,
    calendarId: config.google.calendarId,
  });

  // Initialize repositories
  const appointmentRepo = new AppointmentRepository();
  const serviceRepo = new ServiceRepository();
  const customerRepo = new CustomerRepository();

  const bookingService = new BookingService(
    appointmentRepo,
    serviceRepo,
    customerRepo
  );

  const messageHandler = createMessageHandler(bookingService, config);

  // Mount booking API routes
  app.route('/api', createBookingAPI(bookingService, config));

  // Webhook verification (GET)
  app.get('/webhook', async (c) => {
    const query = c.req.query();
    
    try {
      const validation = WebhookVerificationSchema.parse(query);
      
      if (validation['hub.verify_token'] === config.whatsapp.webhookVerifyToken) {
        return c.text(validation['hub.challenge']);
      } else {
        return c.text('Invalid verify token', 403);
      }
    } catch (error) {
      console.error('Webhook verification failed:', error);
      return c.text('Bad request', 400);
    }
  });

  // Webhook message processing (POST)
  app.post('/webhook', async (c) => {
    try {
      const body = await c.req.json();
      const payload = WebhookPayloadSchema.parse(body);

      // Process each entry
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          if (!change.value.messages) continue;

          const phoneNumberId = change.value.metadata.phone_number_id;
          
          // Map phone number ID to tenant ID
          // In a real implementation, this would be stored in a database
          const tenantId = phoneNumberId; // Placeholder

          // Process each message
          for (const message of change.value.messages) {
            try {
              await messageHandler.handleMessage(message, tenantId);
            } catch (error) {
              console.error('Failed to process message:', error);
              // Continue processing other messages
            }
          }
        }
      }

      return c.json({ success: true });
    } catch (error) {
      console.error('Webhook processing failed:', error);
      return c.json({ error: 'Processing failed' }, 400);
    }
  });

  return app;
}

/**
 * Create webhook app with configuration
 */
export function createWebhookApp(): Hono {
  const config = createAppConfig();
  return createWebhookHandler(config);
}

/**
 * Default export for serverless deployment
 */
export default createWebhookApp();

import { IncomingMessage, ProcessedMessage } from '@chatbot/wa';
import { BookingService } from '@chatbot/booking';
import { AppConfig } from './config';

/**
 * Handler for WhatsApp message processing
 */
export class MessageHandler {
  constructor(
    private bookingService: BookingService,
    private config: AppConfig
  ) {}

  /**
   * Process an incoming WhatsApp message
   */
  async handleMessage(message: IncomingMessage, tenantId: string): Promise<void> {
    console.log(`Processing message type: ${message.type} for tenant: ${tenantId}`);

    // Convert to ProcessedMessage format
    const processedMessage: ProcessedMessage = {
      messageId: `msg_${Date.now()}`,
      from: 'unknown', // Will be populated from webhook payload
      body: this.extractMessageBody(message),
      timestamp: new Date(),
    };

    // Simple intent routing
    await this.routeMessage(processedMessage, tenantId);
  }

  /**
   * Extract text content from different message types
   */
  private extractMessageBody(message: IncomingMessage): string {
    switch (message.type) {
      case 'text':
        return message.text.body;
      case 'interactive':
        if (message.interactive.type === 'button_reply') {
          return message.interactive.button_reply.title;
        } else if (message.interactive.type === 'list_reply') {
          return message.interactive.list_reply.title;
        }
        return '';
      default:
        return '';
    }
  }

  /**
   * Simple message routing based on content
   */
  private async routeMessage(message: ProcessedMessage, tenantId: string): Promise<void> {
    const body = message.body.toLowerCase();

    if (body.includes('hola') || body.includes('hello')) {
      await this.handleGreeting(message, tenantId);
    } else if (body.includes('disponibilidad') || body.includes('cita')) {
      await this.handleAvailabilityRequest(message, tenantId);
    } else if (body.includes('reservar') || body.includes('book')) {
      await this.handleBookingRequest(message, tenantId);
    } else {
      await this.handleUnknown(message, tenantId);
    }
  }

  /**
   * Handle greeting messages
   */
  private async handleGreeting(message: ProcessedMessage, tenantId: string): Promise<void> {
    console.log(`Greeting from ${message.from} for tenant ${tenantId}`);
    // TODO: Send welcome message with options
  }

  /**
   * Handle availability requests
   */
  private async handleAvailabilityRequest(message: ProcessedMessage, tenantId: string): Promise<void> {
    console.log(`Availability request from ${message.from} for tenant ${tenantId}`);
    // TODO: Check availability and respond
  }

  /**
   * Handle booking requests
   */
  private async handleBookingRequest(message: ProcessedMessage, tenantId: string): Promise<void> {
    console.log(`Booking request from ${message.from} for tenant ${tenantId}`);
    // TODO: Process booking
  }

  /**
   * Handle unknown messages
   */
  private async handleUnknown(message: ProcessedMessage, tenantId: string): Promise<void> {
    console.log(`Unknown message from ${message.from} for tenant ${tenantId}: ${message.body}`);
    // TODO: Send help message
  }
}

/**
 * Create message handler
 */
export function createMessageHandler(bookingService: BookingService, config: AppConfig): MessageHandler {
  return new MessageHandler(bookingService, config);
}

import { IncomingMessage, ProcessedMessage } from '@chatbot/wa';
import { BookingService } from '@chatbot/booking';

/**
 * Intent types for message routing
 */
export type MessageIntent = 
  | 'greeting'
  | 'check_availability'
  | 'book_appointment'
  | 'cancel_appointment'
  | 'modify_appointment'
  | 'get_info'
  | 'unknown';

/**
 * Intent detection results
 */
export interface IntentDetection {
  intent: MessageIntent;
  confidence: number;
  entities?: Record<string, any>;
}

/**
 * Message router for handling different intents
 */
export class MessageRouter {
  constructor(private bookingService: BookingService) {}

  /**
   * Route message to appropriate handler
   */
  async route(message: ProcessedMessage, tenantId: string): Promise<void> {
    const intent = this.detectIntent(message);
    
    console.log(`Detected intent: ${intent.intent} (confidence: ${intent.confidence})`);

    switch (intent.intent) {
      case 'greeting':
        await this.handleGreeting(message, tenantId);
        break;
      case 'check_availability':
        await this.handleAvailabilityCheck(message, tenantId, intent.entities);
        break;
      case 'book_appointment':
        await this.handleBookingRequest(message, tenantId, intent.entities);
        break;
      case 'cancel_appointment':
        await this.handleCancellation(message, tenantId, intent.entities);
        break;
      case 'modify_appointment':
        await this.handleModification(message, tenantId, intent.entities);
        break;
      case 'get_info':
        await this.handleInfoRequest(message, tenantId, intent.entities);
        break;
      default:
        await this.handleUnknown(message, tenantId);
        break;
    }
  }

  /**
   * Detect intent from message
   */
  private detectIntent(message: ProcessedMessage): IntentDetection {
    const text = message.body?.toLowerCase() || '';
    
    // Simple keyword-based intent detection
    // In production, this would use NLP/ML models
    
    if (this.matchesKeywords(text, ['hola', 'hello', 'hi', 'buenos dias', 'buenas tardes'])) {
      return { intent: 'greeting', confidence: 0.9 };
    }
    
    if (this.matchesKeywords(text, ['disponibilidad', 'availability', 'cita', 'appointment', 'horario', 'schedule'])) {
      return { 
        intent: 'check_availability', 
        confidence: 0.8,
        entities: this.extractDateEntities(text)
      };
    }
    
    if (this.matchesKeywords(text, ['reservar', 'book', 'agendar', 'confirmar', 'confirm'])) {
      return { 
        intent: 'book_appointment', 
        confidence: 0.8,
        entities: this.extractBookingEntities(text)
      };
    }
    
    if (this.matchesKeywords(text, ['cancelar', 'cancel', 'anular'])) {
      return { 
        intent: 'cancel_appointment', 
        confidence: 0.8,
        entities: this.extractAppointmentIdentifier(text)
      };
    }
    
    if (this.matchesKeywords(text, ['cambiar', 'modify', 'reprogramar', 'reschedule'])) {
      return { 
        intent: 'modify_appointment', 
        confidence: 0.7,
        entities: this.extractModificationEntities(text)
      };
    }
    
    if (this.matchesKeywords(text, ['info', 'informacion', 'precios', 'prices', 'servicios', 'services'])) {
      return { 
        intent: 'get_info', 
        confidence: 0.7,
        entities: this.extractInfoType(text)
      };
    }
    
    return { intent: 'unknown', confidence: 0.1 };
  }

  /**
   * Handle greeting messages
   */
  private async handleGreeting(message: ProcessedMessage, tenantId: string): Promise<void> {
    // TODO: Send greeting response with available options
    console.log('Handling greeting for tenant:', tenantId);
  }

  /**
   * Handle availability check requests
   */
  private async handleAvailabilityCheck(
    message: ProcessedMessage, 
    tenantId: string, 
    entities?: Record<string, any>
  ): Promise<void> {
    // TODO: Check availability and respond with slots
    console.log('Handling availability check for tenant:', tenantId, entities);
  }

  /**
   * Handle booking requests
   */
  private async handleBookingRequest(
    message: ProcessedMessage, 
    tenantId: string, 
    entities?: Record<string, any>
  ): Promise<void> {
    // TODO: Process booking request
    console.log('Handling booking request for tenant:', tenantId, entities);
  }

  /**
   * Handle cancellation requests
   */
  private async handleCancellation(
    message: ProcessedMessage, 
    tenantId: string, 
    entities?: Record<string, any>
  ): Promise<void> {
    // TODO: Process cancellation
    console.log('Handling cancellation for tenant:', tenantId, entities);
  }

  /**
   * Handle modification requests
   */
  private async handleModification(
    message: ProcessedMessage, 
    tenantId: string, 
    entities?: Record<string, any>
  ): Promise<void> {
    // TODO: Process modification
    console.log('Handling modification for tenant:', tenantId, entities);
  }

  /**
   * Handle information requests
   */
  private async handleInfoRequest(
    message: ProcessedMessage, 
    tenantId: string, 
    entities?: Record<string, any>
  ): Promise<void> {
    // TODO: Provide requested information
    console.log('Handling info request for tenant:', tenantId, entities);
  }

  /**
   * Handle unknown intents
   */
  private async handleUnknown(message: ProcessedMessage, tenantId: string): Promise<void> {
    // TODO: Send help message or escalate to human
    console.log('Handling unknown intent for tenant:', tenantId);
  }

  /**
   * Check if text matches any of the keywords
   */
  private matchesKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  /**
   * Extract date-related entities from text
   */
  private extractDateEntities(text: string): Record<string, any> {
    // Simple date extraction - in production use proper NLP
    const entities: Record<string, any> = {};
    
    // Look for day names
    const dayMatch = text.match(/(lunes|martes|miercoles|jueves|viernes|sabado|domingo|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
    if (dayMatch) {
      entities.day = dayMatch[1];
    }
    
    // Look for dates
    const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dateMatch) {
      entities.date = dateMatch[0];
    }
    
    return entities;
  }

  /**
   * Extract booking-related entities
   */
  private extractBookingEntities(text: string): Record<string, any> {
    const entities = this.extractDateEntities(text);
    
    // Look for time
    const timeMatch = text.match(/(\d{1,2}):(\d{2})\s*(am|pm|h)?/i);
    if (timeMatch) {
      entities.time = timeMatch[0];
    }
    
    return entities;
  }

  /**
   * Extract appointment identifier
   */
  private extractAppointmentIdentifier(text: string): Record<string, any> {
    const entities: Record<string, any> = {};
    
    // Look for appointment ID
    const idMatch = text.match(/([a-f0-9-]{36})/i);
    if (idMatch) {
      entities.appointmentId = idMatch[1];
    }
    
    return entities;
  }

  /**
   * Extract modification entities
   */
  private extractModificationEntities(text: string): Record<string, any> {
    return {
      ...this.extractAppointmentIdentifier(text),
      ...this.extractBookingEntities(text)
    };
  }

  /**
   * Extract information type
   */
  private extractInfoType(text: string): Record<string, any> {
    const entities: Record<string, any> = {};
    
    if (text.includes('precio') || text.includes('price')) {
      entities.infoType = 'prices';
    } else if (text.includes('servicio') || text.includes('service')) {
      entities.infoType = 'services';
    } else if (text.includes('direccion') || text.includes('address')) {
      entities.infoType = 'address';
    } else if (text.includes('horario') || text.includes('hours')) {
      entities.infoType = 'hours';
    }
    
    return entities;
  }
}

/**
 * Create message router instance
 */
export function createIntentRouter(bookingService: BookingService): MessageRouter {
  return new MessageRouter(bookingService);
}

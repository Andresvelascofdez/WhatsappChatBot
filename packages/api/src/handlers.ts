import { IncomingMessage, ProcessedMessage } from '@chatbot/wa';
import { BookingService } from '@chatbot/booking';
import { AppConfig } from './config';
import { WhatsAppClient, createWhatsAppClient } from './whatsapp-client';

/**
 * Handler for WhatsApp message processing with cost optimization
 */
export class MessageHandler {
  private waClient: WhatsAppClient;

  constructor(
    private bookingService: BookingService,
    private config: AppConfig
  ) {
    // Crear cliente optimizado para costos
    this.waClient = createWhatsAppClient({
      provider: config.whatsapp.provider,
      apiUrl: config.whatsapp.apiUrl,
      cloudAccessToken: config.whatsapp.cloudAccessToken,
      phoneNumberId: config.whatsapp.phoneNumberId,
      apiKey: config.whatsapp.apiKey,
      webhookVerifyToken: config.whatsapp.webhookVerifyToken,
    });

    // Mostrar información de costos
    const costPerMessage = this.waClient.getEstimatedCostPerMessage();
    console.log(`💰 Proveedor: ${config.whatsapp.provider}, Costo estimado: €${costPerMessage}/mensaje`);
  }

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

    // Simple intent routing with responses logged for now
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

    try {
      if (body.includes('hola') || body.includes('hello') || body.includes('hi')) {
        await this.handleGreeting(message, tenantId);
      } else if (body.includes('disponibilidad') || body.includes('cita') || body.includes('appointment')) {
        await this.handleAvailabilityRequest(message, tenantId);
      } else if (body.includes('reservar') || body.includes('book') || body.includes('agendar')) {
        await this.handleBookingRequest(message, tenantId);
      } else if (body.includes('cancelar') || body.includes('cancel')) {
        await this.handleCancellationRequest(message, tenantId);
      } else if (body.includes('precio') || body.includes('info') || body.includes('servicio')) {
        await this.handleFAQRequest(message, tenantId);
      } else {
        await this.handleUnknown(message, tenantId);
      }
    } catch (error) {
      console.error(`Error handling message for tenant ${tenantId}:`, error);
      await this.logErrorResponse(message.from);
    }
  }

  /**
   * Handle greeting messages
   */
  private async handleGreeting(message: ProcessedMessage, tenantId: string): Promise<void> {
    const welcomeMessage = `¡Hola! 👋 Bienvenido a nuestro sistema de reservas.

¿En qué puedo ayudarte hoy?

🗓️ Ver disponibilidad
📅 Reservar una cita  
❓ Información de servicios
📞 Contacto

Solo escribe lo que necesitas o elige una opción.`;

    try {
      await this.waClient.sendMessage({
        to: message.from,
        type: 'text',
        text: { body: welcomeMessage },
      });
      console.log(`✅ Saludo enviado a ${message.from}`);
    } catch (error) {
      console.error(`❌ Error enviando saludo:`, error);
    }
  }

  /**
   * Handle availability requests
   */
  private async handleAvailabilityRequest(message: ProcessedMessage, tenantId: string): Promise<void> {
    const availabilityMessage = `📅 Para consultar disponibilidad necesito algunos datos:

1️⃣ ¿Qué servicio te interesa?
2️⃣ ¿Qué día prefieres? (ej: mañana, lunes, 25/08)

Una vez que me proporciones esta información, te mostraré los horarios disponibles.`;

    try {
      await this.waClient.sendMessage({
        to: message.from,
        type: 'text', 
        text: { body: availabilityMessage },
      });
      console.log(`✅ Consulta disponibilidad enviada a ${message.from}`);
    } catch (error) {
      console.error(`❌ Error enviando disponibilidad:`, error);
    }
  }

  /**
   * Handle booking requests
   */
  private async handleBookingRequest(message: ProcessedMessage, tenantId: string): Promise<void> {
    const bookingMessage = `📝 Para hacer tu reserva necesito:

👤 Nombre completo
📱 Teléfono de contacto  
🗓️ Fecha preferida
🕐 Horario preferido
💼 Tipo de servicio

Puedes enviarme toda la información o ir paso a paso.

Ejemplo: "Juan Pérez, 555-1234, mañana 10am, corte de cabello"`;

    try {
      await this.waClient.sendMessage({
        to: message.from,
        type: 'text',
        text: { body: bookingMessage },
      });
      console.log(`✅ Solicitud reserva enviada a ${message.from}`);
    } catch (error) {
      console.error(`❌ Error enviando reserva:`, error);
    }
  }

  /**
   * Handle cancellation requests  
   */
  private async handleCancellationRequest(message: ProcessedMessage, tenantId: string): Promise<void> {
    const cancelMessage = `❌ Para cancelar tu cita necesito:

🆔 ID de la reserva o
📱 Teléfono con el que reservaste

Te ayudo a encontrar tu cita y la cancelamos.`;

    try {
      await this.waClient.sendMessage({
        to: message.from,
        type: 'text',
        text: { body: cancelMessage },
      });
      console.log(`✅ Solicitud cancelación enviada a ${message.from}`);
    } catch (error) {
      console.error(`❌ Error enviando cancelación:`, error);
    }
  }

  /**
   * Handle FAQ requests
   */
  private async handleFAQRequest(message: ProcessedMessage, tenantId: string): Promise<void> {
    // Default FAQ response
    const defaultInfo = `ℹ️ Información del negocio:

💼 Servicios disponibles
💰 Precios competitivos  
📍 Ubicación conveniente
🕒 Horarios flexibles

Para información específica, contáctanos directamente.`;

    try {
      await this.waClient.sendMessage({
        to: message.from,
        type: 'text',
        text: { body: defaultInfo },
      });
      console.log(`✅ FAQ enviado a ${message.from}`);
    } catch (error) {
      console.error(`❌ Error enviando FAQ:`, error);
    }
  }

  /**
   * Handle unknown messages
   */
  private async handleUnknown(message: ProcessedMessage, tenantId: string): Promise<void> {
    const helpMessage = `🤔 No entendí tu mensaje. 

Puedo ayudarte con:

🗓️ "disponibilidad" - Ver horarios libres
📅 "reservar" - Agendar una cita
❌ "cancelar" - Cancelar reserva  
❓ "info" - Información de servicios

¿Con qué te ayudo?`;

    try {
      await this.waClient.sendMessage({
        to: message.from,
        type: 'text',
        text: { body: helpMessage },
      });
      console.log(`✅ Ayuda enviada a ${message.from}`);
    } catch (error) {
      console.error(`❌ Error enviando ayuda:`, error);
    }
  }

  /**
   * Log error response
   */
  private async logErrorResponse(phone: string): Promise<void> {
    const errorMessage = `❌ Ups! Algo salió mal. 

Por favor intenta de nuevo en unos momentos o contáctanos directamente.

Disculpa las molestias.`;

    try {
      await this.waClient.sendMessage({
        to: phone,
        type: 'text',
        text: { body: errorMessage },
      });
      console.log(`✅ Error notificado a ${phone}`);
    } catch (error) {
      console.error(`❌ Error enviando notificación de error:`, error);
    }
  }
}

/**
 * Create message handler
 */
export function createMessageHandler(bookingService: BookingService, config: AppConfig): MessageHandler {
  return new MessageHandler(bookingService, config);
}

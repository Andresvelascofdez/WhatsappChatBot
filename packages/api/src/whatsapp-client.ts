/**
 * Cliente WhatsApp multi-proveedor optimizado para costos
 * Soporta: Twilio, Cloud API (Meta), 360dialog, Ultramsg
 */

export interface WhatsAppMessage {
  to: string;
  type: 'text';
  text: {
    body: string;
  };
}

export interface WhatsAppConfig {
  provider: 'twilio' | 'cloud' | '360dialog' | 'ultramsg';
  apiUrl?: string;
  // Twilio - Pago por mensaje, sin perfil comercial Facebook
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioWhatsAppNumber?: string;
  // Cloud API (Meta) - La más barata
  cloudAccessToken?: string;
  phoneNumberId?: string;
  // Legacy APIs
  apiKey?: string;
  webhookVerifyToken: string;
}

/**
 * Cliente WhatsApp universal que elige la API más barata
 */
export class WhatsAppClient {
  constructor(private config: WhatsAppConfig) {}

  /**
   * Enviar mensaje usando el proveedor configurado
   */
  async sendMessage(message: WhatsAppMessage): Promise<void> {
    switch (this.config.provider) {
      case 'twilio':
        return this.sendTwilioMessage(message);
      case 'cloud':
        return this.sendCloudMessage(message);
      case '360dialog':
        return this.send360DialogMessage(message);
      case 'ultramsg':
        return this.sendUltramsgMessage(message);
      default:
        throw new Error(`Proveedor no soportado: ${this.config.provider}`);
    }
  }

  /**
   * Twilio WhatsApp API - Pago por mensaje (~$0.005-0.01)
   * Sin perfil comercial de Facebook requerido
   */
  private async sendTwilioMessage(message: WhatsAppMessage): Promise<void> {
    if (!this.config.twilioAccountSid || !this.config.twilioAuthToken || !this.config.twilioWhatsAppNumber) {
      throw new Error('Credenciales de Twilio faltantes');
    }

    // Importar Twilio dinámicamente para evitar errores en edge runtime
    const { default: twilio } = await import('twilio');
    const client = twilio(this.config.twilioAccountSid, this.config.twilioAuthToken);

    try {
      const response = await client.messages.create({
        from: this.config.twilioWhatsAppNumber,
        to: `whatsapp:${message.to}`,
        body: message.text.body,
      });

      console.log(`✅ Mensaje Twilio enviado: ${response.sid}`);
    } catch (error) {
      console.error('❌ Error enviando mensaje Twilio:', error);
      throw new Error(`Error Twilio: ${error}`);
    }
  }

  /**
   * WhatsApp Cloud API (Meta) - GRATIS hasta 1000 msg/mes
   * Costo: €0-15/mes total para TODOS los clientes
   */
  private async sendCloudMessage(message: WhatsAppMessage): Promise<void> {
    if (!this.config.cloudAccessToken || !this.config.phoneNumberId) {
      throw new Error('Cloud API: Faltan cloudAccessToken o phoneNumberId');
    }

    const url = `${this.config.apiUrl}/${this.config.phoneNumberId}/messages`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.cloudAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: message.to,
        type: 'text',
        text: {
          body: message.text.body,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cloud API error: ${response.status} ${error}`);
    }

    console.log(`✅ Mensaje enviado via Cloud API (GRATIS) a ${message.to}`);
  }

  /**
   * 360dialog - Más caro pero estable
   * Costo: €40-100/mes
   */
  private async send360DialogMessage(message: WhatsAppMessage): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('360dialog: Falta apiKey');
    }

    const response = await fetch(`${this.config.apiUrl}/messages`, {
      method: 'POST',
      headers: {
        'D360-API-KEY': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`360dialog error: ${response.status} ${error}`);
    }

    console.log(`✅ Mensaje enviado via 360dialog a ${message.to}`);
  }

  /**
   * Ultramsg - Opción intermedia
   * Costo: €15-30/mes
   */
  private async sendUltramsgMessage(message: WhatsAppMessage): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('Ultramsg: Falta apiKey');
    }

    // Extraer instance ID de la URL o config
    const instanceId = this.extractInstanceId();
    const url = `${this.config.apiUrl}/instance${instanceId}/messages/chat`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token: this.config.apiKey,
        to: message.to,
        body: message.text.body,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ultramsg error: ${response.status} ${error}`);
    }

    console.log(`✅ Mensaje enviado via Ultramsg a ${message.to}`);
  }

  /**
   * Extraer instance ID para Ultramsg (formato específico)
   */
  private extractInstanceId(): string {
    // Implementar lógica específica de Ultramsg si es necesario
    return '1'; // Default instance
  }

  /**
   * Calcular costo estimado por mensaje según proveedor
   */
  getEstimatedCostPerMessage(): number {
    switch (this.config.provider) {
      case 'cloud':
        return 0.005; // €0.005 después de los primeros 1000 gratis
      case 'ultramsg':
        return 0.02; // ~€0.02 por mensaje
      case '360dialog':
        return 0.05; // ~€0.05 por mensaje
      default:
        return 0.01;
    }
  }

  /**
   * Recomendar el proveedor más barato según volumen
   */
  static recommendProvider(messagesPerMonth: number): 'cloud' | 'ultramsg' | '360dialog' {
    if (messagesPerMonth <= 1000) {
      return 'cloud'; // GRATIS hasta 1000 mensajes
    } else if (messagesPerMonth <= 5000) {
      return 'cloud'; // Sigue siendo lo más barato
    } else {
      return 'ultramsg'; // Para volúmenes muy altos
    }
  }
}

/**
 * Factory para crear cliente según configuración
 */
export function createWhatsAppClient(config: WhatsAppConfig): WhatsAppClient {
  return new WhatsAppClient(config);
}

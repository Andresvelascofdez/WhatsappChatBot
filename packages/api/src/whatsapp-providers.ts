import { z } from 'zod';

/**
 * Configuración para diferentes proveedores de WhatsApp
 */
export interface WhatsAppProvider {
  name: string;
  sendMessage(to: string, message: string): Promise<boolean>;
  sendInteractiveMessage?(to: string, message: any): Promise<boolean>;
}

/**
 * Ultramsg.com Provider - Muy barato (€8-15/mes)
 */
export class UltramsgProvider implements WhatsAppProvider {
  name = 'Ultramsg';
  
  constructor(
    private instanceId: string,
    private token: string
  ) {}

  async sendMessage(to: string, message: string): Promise<boolean> {
    try {
      const url = `https://api.ultramsg.com/${this.instanceId}/messages/chat`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          token: this.token,
          to: to,
          body: message,
        }),
      });

      const result = await response.json();
      return result.sent === true;
    } catch (error) {
      console.error('Ultramsg send failed:', error);
      return false;
    }
  }

  async sendInteractiveMessage(to: string, message: any): Promise<boolean> {
    try {
      const url = `https://api.ultramsg.com/${this.instanceId}/messages/button`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          token: this.token,
          to: to,
          body: message.text,
          buttons: JSON.stringify(message.buttons),
        }),
      });

      const result = await response.json();
      return result.sent === true;
    } catch (error) {
      console.error('Ultramsg interactive send failed:', error);
      return false;
    }
  }
}

/**
 * ChatAPI.com Provider - Precio medio (€12-25/mes)
 */
export class ChatAPIProvider implements WhatsAppProvider {
  name = 'ChatAPI';
  
  constructor(
    private instanceId: string,
    private token: string
  ) {}

  async sendMessage(to: string, message: string): Promise<boolean> {
    try {
      const url = `https://api.chat-api.com/instance${this.instanceId}/message`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: this.token,
          chatId: `${to}@c.us`,
          body: message,
        }),
      });

      const result = await response.json();
      return result.sent === true;
    } catch (error) {
      console.error('ChatAPI send failed:', error);
      return false;
    }
  }
}

/**
 * WhatsMate.net Provider - La más barata (€5-15/mes)
 */
export class WhatsMateProvider implements WhatsAppProvider {
  name = 'WhatsMate';
  
  constructor(
    private instanceId: string,
    private clientSecret: string
  ) {}

  async sendMessage(to: string, message: string): Promise<boolean> {
    try {
      const url = `https://api.whatsmate.net/v3/whatsapp/single/text/message/${this.instanceId}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WM-CLIENT-ID': this.instanceId,
          'X-WM-CLIENT-SECRET': this.clientSecret,
        },
        body: JSON.stringify({
          number: to,
          message: message,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('WhatsMate send failed:', error);
      return false;
    }
  }
}

/**
 * Factory para crear el proveedor según configuración
 */
export function createWhatsAppProvider(config: any): WhatsAppProvider {
  switch (config.provider) {
    case 'ultramsg':
      return new UltramsgProvider(config.instanceId, config.token);
    case 'chatapi':
      return new ChatAPIProvider(config.instanceId, config.token);
    case 'whatsmate':
      return new WhatsMateProvider(config.instanceId, config.clientSecret);
    default:
      throw new Error(`Proveedor no soportado: ${config.provider}`);
  }
}

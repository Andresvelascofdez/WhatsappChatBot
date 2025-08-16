import { z } from 'zod';
import type {
  OutgoingMessage,
  SendMessageResponse,
  ErrorResponse,
  CreateTextMessage,
  CreateTemplateMessage,
  CreateButtonMessage,
  CreateListMessage,
} from './schemas';
import {
  OutgoingMessageSchema,
  SendMessageResponseSchema,
  ErrorResponseSchema,
  CreateTextMessageSchema,
  CreateTemplateMessageSchema,
  CreateButtonMessageSchema,
  CreateListMessageSchema,
} from './schemas';

export interface WhatsAppClientConfig {
  apiUrl: string;
  accessToken: string;
  phoneNumberId?: string;
}

export interface MessageContext {
  tenantId: string;
  customerId: string;
  messageId?: string;
}

export class WhatsAppClient {
  private config: WhatsAppClientConfig;

  constructor(config: WhatsAppClientConfig) {
    this.config = config;
  }

  async sendTextMessage(params: CreateTextMessage, context?: MessageContext): Promise<string> {
    const validatedParams = CreateTextMessageSchema.parse(params);
    
    const message: OutgoingMessage = {
      type: 'text',
      text: {
        body: validatedParams.text,
      },
    };

    return this.sendMessage(validatedParams.to, message, context);
  }

  async sendTemplateMessage(params: CreateTemplateMessage, context?: MessageContext): Promise<string> {
    const validatedParams = CreateTemplateMessageSchema.parse(params);
    
    const message: OutgoingMessage = {
      type: 'template',
      template: {
        name: validatedParams.template,
        language: {
          code: validatedParams.language,
        },
        components: validatedParams.parameters ? [{
          type: 'body',
          parameters: validatedParams.parameters.map(param => ({
            type: 'text',
            text: param,
          })),
        }] : undefined,
      },
    };

    return this.sendMessage(validatedParams.to, message, context);
  }

  async sendButtonMessage(params: CreateButtonMessage, context?: MessageContext): Promise<string> {
    const validatedParams = CreateButtonMessageSchema.parse(params);
    
    const message: OutgoingMessage = {
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: validatedParams.body,
        },
        action: {
          buttons: validatedParams.buttons.map(button => ({
            type: 'reply',
            reply: {
              id: button.id,
              title: button.title,
            },
          })),
        },
      },
    };

    return this.sendMessage(validatedParams.to, message, context);
  }

  async sendListMessage(params: CreateListMessage, context?: MessageContext): Promise<string> {
    const validatedParams = CreateListMessageSchema.parse(params);
    
    const message: OutgoingMessage = {
      type: 'interactive',
      interactive: {
        type: 'list',
        body: {
          text: validatedParams.body,
        },
        action: {
          button: validatedParams.buttonText,
          sections: validatedParams.sections,
        },
      },
    };

    return this.sendMessage(validatedParams.to, message, context);
  }

  private async sendMessage(to: string, message: OutgoingMessage, context?: MessageContext): Promise<string> {
    const validatedMessage = OutgoingMessageSchema.parse(message);
    
    const payload = {
      messaging_product: 'whatsapp',
      to,
      ...validatedMessage,
    };

    try {
      const response = await fetch(`${this.config.apiUrl}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorResponse = ErrorResponseSchema.parse(responseData);
        throw new WhatsAppError(
          errorResponse.error.message,
          errorResponse.error.code,
          errorResponse.error.type,
          context
        );
      }

      const successResponse = SendMessageResponseSchema.parse(responseData);
      const messageId = successResponse.messages[0]?.id;

      if (!messageId) {
        throw new WhatsAppError('No message ID returned', 500, 'UNKNOWN_ERROR', context);
      }

      return messageId;
    } catch (error) {
      if (error instanceof WhatsAppError) {
        throw error;
      }

      throw new WhatsAppError(
        `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        'NETWORK_ERROR',
        context
      );
    }
  }

  async markAsRead(messageId: string): Promise<void> {
    const payload = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    };

    try {
      const response = await fetch(`${this.config.apiUrl}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new WhatsAppError(
          errorData.error?.message || 'Failed to mark message as read',
          response.status,
          'API_ERROR'
        );
      }
    } catch (error) {
      if (error instanceof WhatsAppError) {
        throw error;
      }
      throw new WhatsAppError(
        `Failed to mark message as read: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        'NETWORK_ERROR'
      );
    }
  }
}

export class WhatsAppError extends Error {
  public readonly code: number;
  public readonly type: string;
  public readonly context?: MessageContext;

  constructor(message: string, code: number, type: string, context?: MessageContext) {
    super(message);
    this.name = 'WhatsAppError';
    this.code = code;
    this.type = type;
    this.context = context;
  }

  toJSON(): object {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      type: this.type,
      context: this.context,
    };
  }
}

// Utility function to create WhatsApp client from environment
export function createWhatsAppClientFromEnv(): WhatsAppClient {
  const apiUrl = process.env.WHATSAPP_API_URL;
  const accessToken = process.env.WHATSAPP_TOKEN;

  if (!apiUrl || !accessToken) {
    throw new Error('Missing required WhatsApp environment variables: WHATSAPP_API_URL, WHATSAPP_TOKEN');
  }

  return new WhatsAppClient({
    apiUrl,
    accessToken,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  });
}

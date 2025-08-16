import { z } from 'zod';
import type { MessageEvent } from './schemas';
import { MessageEventSchema } from './schemas';

export interface WebhookConfig {
  verifyToken: string;
}

export interface WebhookVerification {
  mode: string;
  token: string;
  challenge: string;
}

export interface ProcessedMessage {
  messageId: string;
  from: string;
  body: string;
  timestamp: Date;
  contactName?: string;
  interactiveType?: 'button_reply' | 'list_reply';
  interactivePayload?: {
    id: string;
    title: string;
    description?: string;
  };
}

export interface ProcessedStatus {
  messageId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Date;
  recipientId: string;
  errors?: Array<{
    code: number;
    title: string;
    message: string;
  }>;
}

export class WebhookProcessor {
  private config: WebhookConfig;

  constructor(config: WebhookConfig) {
    this.config = config;
  }

  /**
   * Verify webhook subscription (GET request)
   */
  verifyWebhook(params: WebhookVerification): string | null {
    const { mode, token, challenge } = params;

    if (mode === 'subscribe' && token === this.config.verifyToken) {
      console.log('Webhook verified successfully');
      return challenge;
    }

    console.warn('Webhook verification failed', { mode, token: token.substring(0, 10) + '...' });
    return null;
  }

  /**
   * Process incoming webhook event (POST request)
   */
  processWebhookEvent(body: unknown): WebhookProcessingResult {
    try {
      const event = MessageEventSchema.parse(body);
      const result: WebhookProcessingResult = {
        messages: [],
        statuses: [],
        isValid: true,
      };

      for (const entry of event.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            const { messages = [], statuses = [] } = change.value;

            // Process incoming messages
            for (const message of messages) {
              const processedMessage = this.processMessage(message, change.value.contacts);
              if (processedMessage) {
                result.messages.push(processedMessage);
              }
            }

            // Process message statuses
            for (const status of statuses) {
              const processedStatus = this.processStatus(status);
              if (processedStatus) {
                result.statuses.push(processedStatus);
              }
            }
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Failed to process webhook event:', error);
      return {
        messages: [],
        statuses: [],
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private processMessage(
    message: any, 
    contacts?: Array<{ profile: { name: string }; wa_id: string }>
  ): ProcessedMessage | null {
    try {
      const contactName = contacts?.find(c => c.wa_id === message.from)?.profile?.name;

      const baseMessage: ProcessedMessage = {
        messageId: message.id,
        from: message.from,
        body: '',
        timestamp: new Date(parseInt(message.timestamp) * 1000),
        contactName,
      };

      // Handle text messages
      if (message.type === 'text' && message.text?.body) {
        return {
          ...baseMessage,
          body: message.text.body,
        };
      }

      // Handle interactive button replies
      if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
        const buttonReply = message.interactive.button_reply;
        return {
          ...baseMessage,
          body: buttonReply.title,
          interactiveType: 'button_reply',
          interactivePayload: {
            id: buttonReply.id,
            title: buttonReply.title,
          },
        };
      }

      // Handle interactive list replies
      if (message.type === 'interactive' && message.interactive?.type === 'list_reply') {
        const listReply = message.interactive.list_reply;
        return {
          ...baseMessage,
          body: listReply.title,
          interactiveType: 'list_reply',
          interactivePayload: {
            id: listReply.id,
            title: listReply.title,
            description: listReply.description,
          },
        };
      }

      // Unsupported message type
      console.warn(`Unsupported message type: ${message.type}`);
      return null;
    } catch (error) {
      console.error('Failed to process message:', error);
      return null;
    }
  }

  private processStatus(status: any): ProcessedStatus | null {
    try {
      return {
        messageId: status.id,
        status: status.status,
        timestamp: new Date(parseInt(status.timestamp) * 1000),
        recipientId: status.recipient_id,
        errors: status.errors,
      };
    } catch (error) {
      console.error('Failed to process status:', error);
      return null;
    }
  }
}

export interface WebhookProcessingResult {
  messages: ProcessedMessage[];
  statuses: ProcessedStatus[];
  isValid: boolean;
  error?: string;
}

// Utility function to create webhook processor from environment
export function createWebhookProcessorFromEnv(): WebhookProcessor {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (!verifyToken) {
    throw new Error('Missing required environment variable: WHATSAPP_VERIFY_TOKEN');
  }

  return new WebhookProcessor({ verifyToken });
}

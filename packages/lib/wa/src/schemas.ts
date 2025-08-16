import { z } from 'zod';

// WhatsApp Message Types
export const MessageTypeSchema = z.enum(['text', 'template', 'interactive']);

// Text Message Schema
export const TextMessageSchema = z.object({
  type: z.literal('text'),
  text: z.object({
    body: z.string().min(1).max(4096),
  }),
});

// Template Message Schema
export const TemplateMessageSchema = z.object({
  type: z.literal('template'),
  template: z.object({
    name: z.string(),
    language: z.object({
      code: z.string().default('es'),
    }),
    components: z.array(z.object({
      type: z.string(),
      parameters: z.array(z.object({
        type: z.string(),
        text: z.string(),
      })).optional(),
    })).optional(),
  }),
});

// Interactive Button Schema
export const InteractiveButtonSchema = z.object({
  type: z.literal('interactive'),
  interactive: z.object({
    type: z.literal('button'),
    body: z.object({
      text: z.string().max(1024),
    }),
    action: z.object({
      buttons: z.array(z.object({
        type: z.literal('reply'),
        reply: z.object({
          id: z.string().max(256),
          title: z.string().max(20),
        }),
      })).max(3),
    }),
  }),
});

// Interactive List Schema
export const InteractiveListSchema = z.object({
  type: z.literal('interactive'),
  interactive: z.object({
    type: z.literal('list'),
    body: z.object({
      text: z.string().max(1024),
    }),
    action: z.object({
      button: z.string().max(20),
      sections: z.array(z.object({
        title: z.string().max(24).optional(),
        rows: z.array(z.object({
          id: z.string().max(200),
          title: z.string().max(24),
          description: z.string().max(72).optional(),
        })).max(10),
      })).max(10),
    }),
  }),
});

// Combined Message Schema
export const OutgoingMessageSchema = z.union([
  TextMessageSchema,
  TemplateMessageSchema,
  InteractiveButtonSchema,
  InteractiveListSchema,
]);

export type OutgoingMessage = z.infer<typeof OutgoingMessageSchema>;

// Incoming Message Schemas
export const IncomingTextSchema = z.object({
  type: z.literal('text'),
  text: z.object({
    body: z.string(),
  }),
});

export const IncomingButtonReplySchema = z.object({
  type: z.literal('interactive'),
  interactive: z.object({
    type: z.literal('button_reply'),
    button_reply: z.object({
      id: z.string(),
      title: z.string(),
    }),
  }),
});

export const IncomingListReplySchema = z.object({
  type: z.literal('interactive'),
  interactive: z.object({
    type: z.literal('list_reply'),
    list_reply: z.object({
      id: z.string(),
      title: z.string(),
      description: z.string().optional(),
    }),
  }),
});

export const IncomingMessageSchema = z.union([
  IncomingTextSchema,
  IncomingButtonReplySchema,
  IncomingListReplySchema,
]);

export type IncomingMessage = z.infer<typeof IncomingMessageSchema>;

// Webhook Event Schemas
export const MessageEventSchema = z.object({
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
        contacts: z.array(z.object({
          profile: z.object({
            name: z.string(),
          }),
          wa_id: z.string(),
        })).optional(),
        messages: z.array(z.object({
          id: z.string(),
          from: z.string(),
          timestamp: z.string(),
          type: z.string(),
          text: z.object({
            body: z.string(),
          }).optional(),
          interactive: z.object({
            type: z.string(),
            button_reply: z.object({
              id: z.string(),
              title: z.string(),
            }).optional(),
            list_reply: z.object({
              id: z.string(),
              title: z.string(),
              description: z.string().optional(),
            }).optional(),
          }).optional(),
        })).optional(),
        statuses: z.array(z.object({
          id: z.string(),
          status: z.enum(['sent', 'delivered', 'read', 'failed']),
          timestamp: z.string(),
          recipient_id: z.string(),
          errors: z.array(z.object({
            code: z.number(),
            title: z.string(),
            message: z.string(),
          })).optional(),
        })).optional(),
      }),
      field: z.literal('messages'),
    })),
  })),
});

export type MessageEvent = z.infer<typeof MessageEventSchema>;

// API Response Schemas
export const SendMessageResponseSchema = z.object({
  messaging_product: z.literal('whatsapp'),
  contacts: z.array(z.object({
    input: z.string(),
    wa_id: z.string(),
  })),
  messages: z.array(z.object({
    id: z.string(),
  })),
});

export type SendMessageResponse = z.infer<typeof SendMessageResponseSchema>;

// Error Response Schema
export const ErrorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
    type: z.string(),
    code: z.number(),
    error_data: z.object({
      messaging_product: z.literal('whatsapp'),
      details: z.string(),
    }).optional(),
  }),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// Helper schemas for message creation
export const CreateTextMessageSchema = z.object({
  to: z.string().regex(/^\+\d{10,15}$/),
  text: z.string().min(1).max(4096),
});

export const CreateTemplateMessageSchema = z.object({
  to: z.string().regex(/^\+\d{10,15}$/),
  template: z.string(),
  language: z.string().default('es'),
  parameters: z.array(z.string()).optional(),
});

export const CreateButtonMessageSchema = z.object({
  to: z.string().regex(/^\+\d{10,15}$/),
  body: z.string().max(1024),
  buttons: z.array(z.object({
    id: z.string().max(256),
    title: z.string().max(20),
  })).max(3),
});

export const CreateListMessageSchema = z.object({
  to: z.string().regex(/^\+\d{10,15}$/),
  body: z.string().max(1024),
  buttonText: z.string().max(20),
  sections: z.array(z.object({
    title: z.string().max(24).optional(),
    rows: z.array(z.object({
      id: z.string().max(200),
      title: z.string().max(24),
      description: z.string().max(72).optional(),
    })).max(10),
  })).max(10),
});

export type CreateTextMessage = z.infer<typeof CreateTextMessageSchema>;
export type CreateTemplateMessage = z.infer<typeof CreateTemplateMessageSchema>;
export type CreateButtonMessage = z.infer<typeof CreateButtonMessageSchema>;
export type CreateListMessage = z.infer<typeof CreateListMessageSchema>;

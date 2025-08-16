import { z } from 'zod';

/**
 * Environment configuration schema
 */
export const EnvConfigSchema = z.object({
  // Database
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // WhatsApp Business API (360dialog)
  WHATSAPP_API_URL: z.string().url().default('https://waba-v2.360dialog.io'),
  WHATSAPP_API_KEY: z.string().min(1),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().min(1),
  
  // Google Calendar API
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().email(),
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: z.string().min(1),
  GOOGLE_CALENDAR_ID: z.string().min(1),
  
  // Application Settings
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  
  // Hold/Booking Settings
  DEFAULT_HOLD_DURATION_MINUTES: z.coerce.number().int().min(1).max(60).default(15),
  MAX_ADVANCE_BOOKING_DAYS: z.coerce.number().int().min(1).max(365).default(30),
});

export type EnvConfig = z.infer<typeof EnvConfigSchema>;

/**
 * Load and validate environment configuration
 */
export function loadConfig(): EnvConfig {
  try {
    const config = EnvConfigSchema.parse(process.env);
    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join('.')).join(', ');
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
}

/**
 * Application runtime configuration
 */
export interface AppConfig {
  env: EnvConfig;
  database: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  whatsapp: {
    apiUrl: string;
    apiKey: string;
    webhookVerifyToken: string;
  };
  google: {
    serviceAccountEmail: string;
    serviceAccountPrivateKey: string;
    calendarId: string;
  };
  booking: {
    defaultHoldDurationMinutes: number;
    maxAdvanceBookingDays: number;
  };
}

/**
 * Create application configuration from environment
 */
export function createAppConfig(): AppConfig {
  const env = loadConfig();
  
  return {
    env,
    database: {
      url: env.SUPABASE_URL,
      anonKey: env.SUPABASE_ANON_KEY,
      serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    },
    whatsapp: {
      apiUrl: env.WHATSAPP_API_URL,
      apiKey: env.WHATSAPP_API_KEY,
      webhookVerifyToken: env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    },
    google: {
      serviceAccountEmail: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      serviceAccountPrivateKey: env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      calendarId: env.GOOGLE_CALENDAR_ID,
    },
    booking: {
      defaultHoldDurationMinutes: env.DEFAULT_HOLD_DURATION_MINUTES,
      maxAdvanceBookingDays: env.MAX_ADVANCE_BOOKING_DAYS,
    },
  };
}

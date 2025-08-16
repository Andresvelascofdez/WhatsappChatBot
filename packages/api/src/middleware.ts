import { NextFunction, Request, Response } from 'express';
import { AppConfig } from './config';

/**
 * Enhanced request with app configuration and tenant context
 */
export interface AppRequest extends Request {
  config: AppConfig;
  tenantId?: string;
  userId?: string;
}

/**
 * Error response format
 */
export interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: any;
}

/**
 * Success response format
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Response helpers
 */
export const response = {
  success<T>(res: Response, data: T, message?: string): void {
    res.json({
      success: true,
      data,
      ...(message && { message }),
    } as SuccessResponse<T>);
  },

  error(res: Response, status: number, message: string, code?: string, details?: any): void {
    res.status(status).json({
      error: 'Request failed',
      message,
      ...(code && { code }),
      ...(details && { details }),
    } as ErrorResponse);
  },

  badRequest(res: Response, message: string, details?: any): void {
    this.error(res, 400, message, 'BAD_REQUEST', details);
  },

  unauthorized(res: Response, message = 'Unauthorized'): void {
    this.error(res, 401, message, 'UNAUTHORIZED');
  },

  forbidden(res: Response, message = 'Forbidden'): void {
    this.error(res, 403, message, 'FORBIDDEN');
  },

  notFound(res: Response, message = 'Not found'): void {
    this.error(res, 404, message, 'NOT_FOUND');
  },

  conflict(res: Response, message: string, details?: any): void {
    this.error(res, 409, message, 'CONFLICT', details);
  },

  validationError(res: Response, message: string, details?: any): void {
    this.error(res, 422, message, 'VALIDATION_ERROR', details);
  },

  internalError(res: Response, message = 'Internal server error'): void {
    this.error(res, 500, message, 'INTERNAL_ERROR');
  },
};

/**
 * Attach app configuration to request
 */
export function withConfig(config: AppConfig) {
  return (req: AppRequest, res: Response, next: NextFunction): void => {
    req.config = config;
    next();
  };
}

/**
 * Validate WhatsApp webhook signature
 */
export function verifyWebhookSignature(config: AppConfig) {
  return (req: AppRequest, res: Response, next: NextFunction): void => {
    if (req.method === 'GET') {
      // Webhook verification
      const verifyToken = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      if (verifyToken === config.whatsapp.webhookVerifyToken) {
        res.send(challenge);
        return;
      } else {
        response.forbidden(res, 'Invalid verify token');
        return;
      }
    }

    // For POST requests, we would verify the signature here
    // but 360dialog doesn't use signatures, only IP whitelisting
    next();
  };
}

/**
 * Extract tenant from request (phone number, domain, or header)
 */
export function extractTenant() {
  return (req: AppRequest, res: Response, next: NextFunction): void => {
    // For WhatsApp webhook, extract tenant from phone number
    if (req.body?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id) {
      const phoneNumberId = req.body.entry[0].changes[0].value.metadata.phone_number_id;
      // Map phone number ID to tenant ID (this would be stored in a mapping table)
      req.tenantId = phoneNumberId; // Placeholder - implement proper mapping
    }
    
    // For API requests, extract from header or subdomain
    const tenantHeader = req.headers['x-tenant-id'] as string;
    if (tenantHeader) {
      req.tenantId = tenantHeader;
    }

    next();
  };
}

/**
 * Require tenant context
 */
export function requireTenant() {
  return (req: AppRequest, res: Response, next: NextFunction): void => {
    if (!req.tenantId) {
      response.badRequest(res, 'Tenant context required');
      return;
    }
    next();
  };
}

/**
 * Global error handler
 */
export function errorHandler() {
  return (
    error: Error,
    req: AppRequest,
    res: Response,
    next: NextFunction
  ): void => {
    console.error('Unhandled error:', error);

    if (error.name === 'ZodError') {
      response.validationError(res, 'Validation failed', error);
      return;
    }

    if (error.message.includes('not found')) {
      response.notFound(res, error.message);
      return;
    }

    if (error.message.includes('already exists')) {
      response.conflict(res, error.message);
      return;
    }

    response.internalError(res, 'Something went wrong');
  };
}

/**
 * Request logger
 */
export function requestLogger() {
  return (req: AppRequest, res: Response, next: NextFunction): void => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
    });

    next();
  };
}

/**
 * CORS middleware for API endpoints
 */
export function cors() {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-tenant-id');

    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }

    next();
  };
}

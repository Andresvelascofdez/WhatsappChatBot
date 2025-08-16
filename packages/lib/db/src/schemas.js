import { z } from 'zod';
// Tenant schema
export const TenantSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    tz: z.string().default('Europe/Madrid'),
    phone_masked: z.string(),
    locale: z.string().default('es'),
    active: z.boolean().default(true),
    created_at: z.date(),
});
// Service schema
export const ServiceSchema = z.object({
    id: z.string().uuid(),
    tenant_id: z.string().uuid(),
    name: z.string().min(1),
    duration_min: z.number().int().positive(),
    price_cents: z.number().int().nonnegative(),
    slot_granularity_min: z.number().int().positive().default(30),
    buffer_min: z.number().int().nonnegative().default(0),
    is_active: z.boolean().default(true),
});
// Customer schema
export const CustomerSchema = z.object({
    id: z.string().uuid(),
    tenant_id: z.string().uuid(),
    name: z.string().min(1),
    whatsapp: z.string().regex(/^\+\d{10,15}$/),
    created_at: z.date(),
});
// Appointment status enum
export const AppointmentStatus = z.enum(['pending', 'confirmed', 'cancelled', 'expired']);
// Appointment schema
export const AppointmentSchema = z.object({
    id: z.string().uuid(),
    tenant_id: z.string().uuid(),
    customer_id: z.string().uuid(),
    service_id: z.string().uuid(),
    start_ts: z.date(),
    end_ts: z.date(),
    status: AppointmentStatus,
    gcal_event_id: z.string().nullable(),
    created_at: z.date(),
    expires_at: z.date().nullable(),
});
// FAQ schema
export const FAQKeySchema = z.enum(['prices', 'services', 'address', 'hours']).or(z.string().regex(/^custom:/));
export const FAQSchema = z.object({
    id: z.string().uuid(),
    tenant_id: z.string().uuid(),
    key: FAQKeySchema,
    content_text: z.string().min(1),
});
// Channel schema
export const ChannelTypeSchema = z.enum(['whatsapp', 'instagram']);
export const ChannelSchema = z.object({
    id: z.string().uuid(),
    tenant_id: z.string().uuid(),
    type: ChannelTypeSchema,
    provider: z.string(),
    business_number: z.string(),
    page_id: z.string().nullable(),
    webhook_secret: z.string(),
    is_live: z.boolean().default(false),
});
// Message log schema
export const MessageDirectionSchema = z.enum(['in', 'out']);
export const MessageLogSchema = z.object({
    id: z.string().uuid(),
    tenant_id: z.string().uuid(),
    customer_id: z.string().uuid(),
    direction: MessageDirectionSchema,
    template_name: z.string().nullable(),
    payload_json: z.record(z.unknown()),
    ts: z.date(),
});
// Export all schemas
export const schemas = {
    TenantSchema,
    ServiceSchema,
    CustomerSchema,
    AppointmentSchema,
    FAQSchema,
    ChannelSchema,
    MessageLogSchema,
};
//# sourceMappingURL=schemas.js.map
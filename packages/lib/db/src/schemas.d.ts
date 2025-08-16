import { z } from 'zod';
export declare const TenantSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    tz: z.ZodDefault<z.ZodString>;
    phone_masked: z.ZodString;
    locale: z.ZodDefault<z.ZodString>;
    active: z.ZodDefault<z.ZodBoolean>;
    created_at: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    tz: string;
    phone_masked: string;
    locale: string;
    active: boolean;
    created_at: Date;
}, {
    id: string;
    name: string;
    phone_masked: string;
    created_at: Date;
    tz?: string | undefined;
    locale?: string | undefined;
    active?: boolean | undefined;
}>;
export type Tenant = z.infer<typeof TenantSchema>;
export declare const ServiceSchema: z.ZodObject<{
    id: z.ZodString;
    tenant_id: z.ZodString;
    name: z.ZodString;
    duration_min: z.ZodNumber;
    price_cents: z.ZodNumber;
    slot_granularity_min: z.ZodDefault<z.ZodNumber>;
    buffer_min: z.ZodDefault<z.ZodNumber>;
    is_active: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    tenant_id: string;
    duration_min: number;
    price_cents: number;
    slot_granularity_min: number;
    buffer_min: number;
    is_active: boolean;
}, {
    id: string;
    name: string;
    tenant_id: string;
    duration_min: number;
    price_cents: number;
    slot_granularity_min?: number | undefined;
    buffer_min?: number | undefined;
    is_active?: boolean | undefined;
}>;
export type Service = z.infer<typeof ServiceSchema>;
export declare const CustomerSchema: z.ZodObject<{
    id: z.ZodString;
    tenant_id: z.ZodString;
    name: z.ZodString;
    whatsapp: z.ZodString;
    created_at: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    created_at: Date;
    tenant_id: string;
    whatsapp: string;
}, {
    id: string;
    name: string;
    created_at: Date;
    tenant_id: string;
    whatsapp: string;
}>;
export type Customer = z.infer<typeof CustomerSchema>;
export declare const AppointmentStatus: z.ZodEnum<["pending", "confirmed", "cancelled", "expired"]>;
export declare const AppointmentSchema: z.ZodObject<{
    id: z.ZodString;
    tenant_id: z.ZodString;
    customer_id: z.ZodString;
    service_id: z.ZodString;
    start_ts: z.ZodDate;
    end_ts: z.ZodDate;
    status: z.ZodEnum<["pending", "confirmed", "cancelled", "expired"]>;
    gcal_event_id: z.ZodNullable<z.ZodString>;
    created_at: z.ZodDate;
    expires_at: z.ZodNullable<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: Date;
    status: "pending" | "confirmed" | "cancelled" | "expired";
    tenant_id: string;
    customer_id: string;
    service_id: string;
    start_ts: Date;
    end_ts: Date;
    gcal_event_id: string | null;
    expires_at: Date | null;
}, {
    id: string;
    created_at: Date;
    status: "pending" | "confirmed" | "cancelled" | "expired";
    tenant_id: string;
    customer_id: string;
    service_id: string;
    start_ts: Date;
    end_ts: Date;
    gcal_event_id: string | null;
    expires_at: Date | null;
}>;
export type Appointment = z.infer<typeof AppointmentSchema>;
export declare const FAQKeySchema: z.ZodUnion<[z.ZodEnum<["prices", "services", "address", "hours"]>, z.ZodString]>;
export declare const FAQSchema: z.ZodObject<{
    id: z.ZodString;
    tenant_id: z.ZodString;
    key: z.ZodUnion<[z.ZodEnum<["prices", "services", "address", "hours"]>, z.ZodString]>;
    content_text: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    tenant_id: string;
    key: string;
    content_text: string;
}, {
    id: string;
    tenant_id: string;
    key: string;
    content_text: string;
}>;
export type FAQ = z.infer<typeof FAQSchema>;
export declare const ChannelTypeSchema: z.ZodEnum<["whatsapp", "instagram"]>;
export declare const ChannelSchema: z.ZodObject<{
    id: z.ZodString;
    tenant_id: z.ZodString;
    type: z.ZodEnum<["whatsapp", "instagram"]>;
    provider: z.ZodString;
    business_number: z.ZodString;
    page_id: z.ZodNullable<z.ZodString>;
    webhook_secret: z.ZodString;
    is_live: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "whatsapp" | "instagram";
    tenant_id: string;
    provider: string;
    business_number: string;
    page_id: string | null;
    webhook_secret: string;
    is_live: boolean;
}, {
    id: string;
    type: "whatsapp" | "instagram";
    tenant_id: string;
    provider: string;
    business_number: string;
    page_id: string | null;
    webhook_secret: string;
    is_live?: boolean | undefined;
}>;
export type Channel = z.infer<typeof ChannelSchema>;
export declare const MessageDirectionSchema: z.ZodEnum<["in", "out"]>;
export declare const MessageLogSchema: z.ZodObject<{
    id: z.ZodString;
    tenant_id: z.ZodString;
    customer_id: z.ZodString;
    direction: z.ZodEnum<["in", "out"]>;
    template_name: z.ZodNullable<z.ZodString>;
    payload_json: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    ts: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    tenant_id: string;
    customer_id: string;
    direction: "in" | "out";
    template_name: string | null;
    payload_json: Record<string, unknown>;
    ts: Date;
}, {
    id: string;
    tenant_id: string;
    customer_id: string;
    direction: "in" | "out";
    template_name: string | null;
    payload_json: Record<string, unknown>;
    ts: Date;
}>;
export type MessageLog = z.infer<typeof MessageLogSchema>;
export declare const schemas: {
    readonly TenantSchema: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        tz: z.ZodDefault<z.ZodString>;
        phone_masked: z.ZodString;
        locale: z.ZodDefault<z.ZodString>;
        active: z.ZodDefault<z.ZodBoolean>;
        created_at: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        tz: string;
        phone_masked: string;
        locale: string;
        active: boolean;
        created_at: Date;
    }, {
        id: string;
        name: string;
        phone_masked: string;
        created_at: Date;
        tz?: string | undefined;
        locale?: string | undefined;
        active?: boolean | undefined;
    }>;
    readonly ServiceSchema: z.ZodObject<{
        id: z.ZodString;
        tenant_id: z.ZodString;
        name: z.ZodString;
        duration_min: z.ZodNumber;
        price_cents: z.ZodNumber;
        slot_granularity_min: z.ZodDefault<z.ZodNumber>;
        buffer_min: z.ZodDefault<z.ZodNumber>;
        is_active: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        tenant_id: string;
        duration_min: number;
        price_cents: number;
        slot_granularity_min: number;
        buffer_min: number;
        is_active: boolean;
    }, {
        id: string;
        name: string;
        tenant_id: string;
        duration_min: number;
        price_cents: number;
        slot_granularity_min?: number | undefined;
        buffer_min?: number | undefined;
        is_active?: boolean | undefined;
    }>;
    readonly CustomerSchema: z.ZodObject<{
        id: z.ZodString;
        tenant_id: z.ZodString;
        name: z.ZodString;
        whatsapp: z.ZodString;
        created_at: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        created_at: Date;
        tenant_id: string;
        whatsapp: string;
    }, {
        id: string;
        name: string;
        created_at: Date;
        tenant_id: string;
        whatsapp: string;
    }>;
    readonly AppointmentSchema: z.ZodObject<{
        id: z.ZodString;
        tenant_id: z.ZodString;
        customer_id: z.ZodString;
        service_id: z.ZodString;
        start_ts: z.ZodDate;
        end_ts: z.ZodDate;
        status: z.ZodEnum<["pending", "confirmed", "cancelled", "expired"]>;
        gcal_event_id: z.ZodNullable<z.ZodString>;
        created_at: z.ZodDate;
        expires_at: z.ZodNullable<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        created_at: Date;
        status: "pending" | "confirmed" | "cancelled" | "expired";
        tenant_id: string;
        customer_id: string;
        service_id: string;
        start_ts: Date;
        end_ts: Date;
        gcal_event_id: string | null;
        expires_at: Date | null;
    }, {
        id: string;
        created_at: Date;
        status: "pending" | "confirmed" | "cancelled" | "expired";
        tenant_id: string;
        customer_id: string;
        service_id: string;
        start_ts: Date;
        end_ts: Date;
        gcal_event_id: string | null;
        expires_at: Date | null;
    }>;
    readonly FAQSchema: z.ZodObject<{
        id: z.ZodString;
        tenant_id: z.ZodString;
        key: z.ZodUnion<[z.ZodEnum<["prices", "services", "address", "hours"]>, z.ZodString]>;
        content_text: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        tenant_id: string;
        key: string;
        content_text: string;
    }, {
        id: string;
        tenant_id: string;
        key: string;
        content_text: string;
    }>;
    readonly ChannelSchema: z.ZodObject<{
        id: z.ZodString;
        tenant_id: z.ZodString;
        type: z.ZodEnum<["whatsapp", "instagram"]>;
        provider: z.ZodString;
        business_number: z.ZodString;
        page_id: z.ZodNullable<z.ZodString>;
        webhook_secret: z.ZodString;
        is_live: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        type: "whatsapp" | "instagram";
        tenant_id: string;
        provider: string;
        business_number: string;
        page_id: string | null;
        webhook_secret: string;
        is_live: boolean;
    }, {
        id: string;
        type: "whatsapp" | "instagram";
        tenant_id: string;
        provider: string;
        business_number: string;
        page_id: string | null;
        webhook_secret: string;
        is_live?: boolean | undefined;
    }>;
    readonly MessageLogSchema: z.ZodObject<{
        id: z.ZodString;
        tenant_id: z.ZodString;
        customer_id: z.ZodString;
        direction: z.ZodEnum<["in", "out"]>;
        template_name: z.ZodNullable<z.ZodString>;
        payload_json: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        ts: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        id: string;
        tenant_id: string;
        customer_id: string;
        direction: "in" | "out";
        template_name: string | null;
        payload_json: Record<string, unknown>;
        ts: Date;
    }, {
        id: string;
        tenant_id: string;
        customer_id: string;
        direction: "in" | "out";
        template_name: string | null;
        payload_json: Record<string, unknown>;
        ts: Date;
    }>;
};
//# sourceMappingURL=schemas.d.ts.map
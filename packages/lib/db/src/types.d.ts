export type Json = string | number | boolean | null | {
    [key: string]: Json | undefined;
} | Json[];
export interface Database {
    public: {
        Tables: {
            tenants: {
                Row: {
                    id: string;
                    name: string;
                    tz: string;
                    phone_masked: string;
                    locale: string;
                    active: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    tz?: string;
                    phone_masked: string;
                    locale?: string;
                    active?: boolean;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    tz?: string;
                    phone_masked?: string;
                    locale?: string;
                    active?: boolean;
                    created_at?: string;
                };
            };
            services: {
                Row: {
                    id: string;
                    tenant_id: string;
                    name: string;
                    duration_min: number;
                    price_cents: number;
                    slot_granularity_min: number;
                    buffer_min: number;
                    is_active: boolean;
                };
                Insert: {
                    id?: string;
                    tenant_id: string;
                    name: string;
                    duration_min: number;
                    price_cents: number;
                    slot_granularity_min?: number;
                    buffer_min?: number;
                    is_active?: boolean;
                };
                Update: {
                    id?: string;
                    tenant_id?: string;
                    name?: string;
                    duration_min?: number;
                    price_cents?: number;
                    slot_granularity_min?: number;
                    buffer_min?: number;
                    is_active?: boolean;
                };
            };
            customers: {
                Row: {
                    id: string;
                    tenant_id: string;
                    name: string;
                    whatsapp: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    tenant_id: string;
                    name: string;
                    whatsapp: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    tenant_id?: string;
                    name?: string;
                    whatsapp?: string;
                    created_at?: string;
                };
            };
            appointments: {
                Row: {
                    id: string;
                    tenant_id: string;
                    customer_id: string;
                    service_id: string;
                    start_ts: string;
                    end_ts: string;
                    status: 'pending' | 'confirmed' | 'cancelled' | 'expired';
                    gcal_event_id: string | null;
                    created_at: string;
                    expires_at: string | null;
                };
                Insert: {
                    id?: string;
                    tenant_id: string;
                    customer_id: string;
                    service_id: string;
                    start_ts: string;
                    end_ts: string;
                    status: 'pending' | 'confirmed' | 'cancelled' | 'expired';
                    gcal_event_id?: string | null;
                    created_at?: string;
                    expires_at?: string | null;
                };
                Update: {
                    id?: string;
                    tenant_id?: string;
                    customer_id?: string;
                    service_id?: string;
                    start_ts?: string;
                    end_ts?: string;
                    status?: 'pending' | 'confirmed' | 'cancelled' | 'expired';
                    gcal_event_id?: string | null;
                    created_at?: string;
                    expires_at?: string | null;
                };
            };
            faqs: {
                Row: {
                    id: string;
                    tenant_id: string;
                    key: string;
                    content_text: string;
                };
                Insert: {
                    id?: string;
                    tenant_id: string;
                    key: string;
                    content_text: string;
                };
                Update: {
                    id?: string;
                    tenant_id?: string;
                    key?: string;
                    content_text?: string;
                };
            };
            channels: {
                Row: {
                    id: string;
                    tenant_id: string;
                    type: 'whatsapp' | 'instagram';
                    provider: string;
                    business_number: string;
                    page_id: string | null;
                    webhook_secret: string;
                    is_live: boolean;
                };
                Insert: {
                    id?: string;
                    tenant_id: string;
                    type: 'whatsapp' | 'instagram';
                    provider: string;
                    business_number: string;
                    page_id?: string | null;
                    webhook_secret: string;
                    is_live?: boolean;
                };
                Update: {
                    id?: string;
                    tenant_id?: string;
                    type?: 'whatsapp' | 'instagram';
                    provider?: string;
                    business_number?: string;
                    page_id?: string | null;
                    webhook_secret?: string;
                    is_live?: boolean;
                };
            };
            message_logs: {
                Row: {
                    id: string;
                    tenant_id: string;
                    customer_id: string;
                    direction: 'in' | 'out';
                    template_name: string | null;
                    payload_json: Json;
                    ts: string;
                };
                Insert: {
                    id?: string;
                    tenant_id: string;
                    customer_id: string;
                    direction: 'in' | 'out';
                    template_name?: string | null;
                    payload_json: Json;
                    ts?: string;
                };
                Update: {
                    id?: string;
                    tenant_id?: string;
                    customer_id?: string;
                    direction?: 'in' | 'out';
                    template_name?: string | null;
                    payload_json?: Json;
                    ts?: string;
                };
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            clean_expired_appointments: {
                Args: Record<PropertyKey, never>;
                Returns: number;
            };
            set_config: {
                Args: {
                    setting_name: string;
                    setting_value: string;
                    is_local: boolean;
                };
                Returns: undefined;
            };
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
}
//# sourceMappingURL=types.d.ts.map
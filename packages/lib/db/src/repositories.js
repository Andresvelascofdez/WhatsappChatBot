import { getDatabaseClient, setTenantContext } from './client';
// Base repository class with tenant context
class BaseRepository {
    get db() {
        return getDatabaseClient();
    }
    async withTenant(tenantId, operation) {
        await setTenantContext(tenantId);
        return operation();
    }
}
export class TenantRepository extends BaseRepository {
    async findById(id) {
        const { data, error } = await this.db
            .from('tenants')
            .select('*')
            .eq('id', id)
            .eq('active', true)
            .single();
        if (error)
            throw new Error(`Failed to find tenant: ${error.message}`);
        return data ? this.mapToTenant(data) : null;
    }
    async findByPhoneMasked(phoneMasked) {
        const { data, error } = await this.db
            .from('tenants')
            .select('*')
            .eq('phone_masked', phoneMasked)
            .eq('active', true)
            .single();
        if (error && error.code !== 'PGRST116') {
            throw new Error(`Failed to find tenant by phone: ${error.message}`);
        }
        return data ? this.mapToTenant(data) : null;
    }
    mapToTenant(row) {
        return {
            id: row.id,
            name: row.name,
            tz: row.tz,
            phone_masked: row.phone_masked,
            locale: row.locale,
            active: row.active,
            created_at: new Date(row.created_at),
        };
    }
}
export class ServiceRepository extends BaseRepository {
    async findByTenant(tenantId) {
        return this.withTenant(tenantId, async () => {
            const { data, error } = await this.db
                .from('services')
                .select('*')
                .eq('is_active', true)
                .order('name');
            if (error)
                throw new Error(`Failed to find services: ${error.message}`);
            return data.map(this.mapToService);
        });
    }
    async findById(tenantId, serviceId) {
        return this.withTenant(tenantId, async () => {
            const { data, error } = await this.db
                .from('services')
                .select('*')
                .eq('id', serviceId)
                .eq('is_active', true)
                .single();
            if (error && error.code !== 'PGRST116') {
                throw new Error(`Failed to find service: ${error.message}`);
            }
            return data ? this.mapToService(data) : null;
        });
    }
    mapToService(row) {
        return {
            id: row.id,
            tenant_id: row.tenant_id,
            name: row.name,
            duration_min: row.duration_min,
            price_cents: row.price_cents,
            slot_granularity_min: row.slot_granularity_min,
            buffer_min: row.buffer_min,
            is_active: row.is_active,
        };
    }
}
export class CustomerRepository extends BaseRepository {
    async findOrCreate(tenantId, whatsapp, name) {
        return this.withTenant(tenantId, async () => {
            // Try to find existing customer
            const { data: existing } = await this.db
                .from('customers')
                .select('*')
                .eq('whatsapp', whatsapp)
                .single();
            if (existing) {
                return this.mapToCustomer(existing);
            }
            // Create new customer
            const { data, error } = await this.db
                .from('customers')
                .insert({
                tenant_id: tenantId,
                name,
                whatsapp,
            })
                .select()
                .single();
            if (error)
                throw new Error(`Failed to create customer: ${error.message}`);
            return this.mapToCustomer(data);
        });
    }
    mapToCustomer(row) {
        return {
            id: row.id,
            tenant_id: row.tenant_id,
            name: row.name,
            whatsapp: row.whatsapp,
            created_at: new Date(row.created_at),
        };
    }
}
export class AppointmentRepository extends BaseRepository {
    async create(tenantId, appointment) {
        return this.withTenant(tenantId, async () => {
            const { data, error } = await this.db
                .from('appointments')
                .insert({
                tenant_id: tenantId,
                customer_id: appointment.customer_id,
                service_id: appointment.service_id,
                start_ts: appointment.start_ts.toISOString(),
                end_ts: appointment.end_ts.toISOString(),
                status: appointment.status,
                gcal_event_id: appointment.gcal_event_id,
                expires_at: appointment.expires_at?.toISOString(),
            })
                .select()
                .single();
            if (error)
                throw new Error(`Failed to create appointment: ${error.message}`);
            return this.mapToAppointment(data);
        });
    }
    async updateStatus(tenantId, appointmentId, status, gcalEventId) {
        return this.withTenant(tenantId, async () => {
            const updateData = { status };
            if (gcalEventId !== undefined) {
                updateData.gcal_event_id = gcalEventId;
            }
            const { error } = await this.db
                .from('appointments')
                .update(updateData)
                .eq('id', appointmentId);
            if (error)
                throw new Error(`Failed to update appointment: ${error.message}`);
        });
    }
    async findPending(tenantId, customerId) {
        return this.withTenant(tenantId, async () => {
            const { data, error } = await this.db
                .from('appointments')
                .select('*')
                .eq('customer_id', customerId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            if (error && error.code !== 'PGRST116') {
                throw new Error(`Failed to find pending appointment: ${error.message}`);
            }
            return data ? this.mapToAppointment(data) : null;
        });
    }
    async findConflicting(tenantId, startTs, endTs) {
        return this.withTenant(tenantId, async () => {
            const { data, error } = await this.db
                .from('appointments')
                .select('*')
                .in('status', ['pending', 'confirmed'])
                .gte('end_ts', startTs.toISOString())
                .lte('start_ts', endTs.toISOString());
            if (error)
                throw new Error(`Failed to find conflicting appointments: ${error.message}`);
            return data.map(this.mapToAppointment);
        });
    }
    mapToAppointment(row) {
        return {
            id: row.id,
            tenant_id: row.tenant_id,
            customer_id: row.customer_id,
            service_id: row.service_id,
            start_ts: new Date(row.start_ts),
            end_ts: new Date(row.end_ts),
            status: row.status,
            gcal_event_id: row.gcal_event_id,
            created_at: new Date(row.created_at),
            expires_at: row.expires_at ? new Date(row.expires_at) : null,
        };
    }
}
export class FAQRepository extends BaseRepository {
    async findByKey(tenantId, key) {
        return this.withTenant(tenantId, async () => {
            const { data, error } = await this.db
                .from('faqs')
                .select('*')
                .eq('key', key)
                .single();
            if (error && error.code !== 'PGRST116') {
                throw new Error(`Failed to find FAQ: ${error.message}`);
            }
            return data ? this.mapToFAQ(data) : null;
        });
    }
    mapToFAQ(row) {
        return {
            id: row.id,
            tenant_id: row.tenant_id,
            key: row.key,
            content_text: row.content_text,
        };
    }
}
// Utility function to clean expired appointments
export async function cleanExpiredAppointments() {
    const db = getDatabaseClient();
    const { data, error } = await db.rpc('clean_expired_appointments');
    if (error)
        throw new Error(`Failed to clean expired appointments: ${error.message}`);
    return data || 0;
}
//# sourceMappingURL=repositories.js.map
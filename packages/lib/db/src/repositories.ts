import { getDatabaseClient, setTenantContext } from './client';
import type { Database } from './types';
import type { 
  Tenant, 
  Service, 
  Customer, 
  Appointment, 
  FAQ, 
  Channel, 
  MessageLog 
} from './schemas';

// Base repository class with tenant context
abstract class BaseRepository {
  protected get db() {
    return getDatabaseClient();
  }

  protected async withTenant<T>(tenantId: string, operation: () => Promise<T>): Promise<T> {
    await setTenantContext(tenantId);
    return operation();
  }
}

export class TenantRepository extends BaseRepository {
  async findById(id: string): Promise<Tenant | null> {
    const { data, error } = await this.db
      .from('tenants')
      .select('*')
      .eq('id', id)
      .eq('active', true)
      .single();

    if (error) throw new Error(`Failed to find tenant: ${error.message}`);
    return data ? this.mapToTenant(data) : null;
  }

  async findByPhoneMasked(phoneMasked: string): Promise<Tenant | null> {
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

  private mapToTenant(row: Database['public']['Tables']['tenants']['Row']): Tenant {
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
  async findByTenant(tenantId: string): Promise<Service[]> {
    return this.withTenant(tenantId, async () => {
      const { data, error } = await this.db
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw new Error(`Failed to find services: ${error.message}`);
      return data.map(this.mapToService);
    });
  }

  async findById(tenantId: string, serviceId: string): Promise<Service | null> {
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

  private mapToService(row: Database['public']['Tables']['services']['Row']): Service {
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
  async findOrCreate(
    tenantId: string, 
    whatsapp: string, 
    name: string
  ): Promise<Customer> {
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

      if (error) throw new Error(`Failed to create customer: ${error.message}`);
      return this.mapToCustomer(data);
    });
  }

  private mapToCustomer(row: Database['public']['Tables']['customers']['Row']): Customer {
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
  async create(tenantId: string, appointment: Omit<Appointment, 'id' | 'tenant_id' | 'created_at'>): Promise<Appointment> {
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

      if (error) throw new Error(`Failed to create appointment: ${error.message}`);
      return this.mapToAppointment(data);
    });
  }

  async updateStatus(
    tenantId: string, 
    appointmentId: string, 
    status: Appointment['status'],
    gcalEventId?: string
  ): Promise<void> {
    return this.withTenant(tenantId, async () => {
      const updateData: Database['public']['Tables']['appointments']['Update'] = { status };
      if (gcalEventId !== undefined) {
        updateData.gcal_event_id = gcalEventId;
      }

      const { error } = await this.db
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId);

      if (error) throw new Error(`Failed to update appointment: ${error.message}`);
    });
  }

  async findPending(tenantId: string, customerId: string): Promise<Appointment | null> {
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

  async findConflicting(
    tenantId: string, 
    startTs: Date, 
    endTs: Date
  ): Promise<Appointment[]> {
    return this.withTenant(tenantId, async () => {
      const { data, error } = await this.db
        .from('appointments')
        .select('*')
        .in('status', ['pending', 'confirmed'])
        .gte('end_ts', startTs.toISOString())
        .lte('start_ts', endTs.toISOString());

      if (error) throw new Error(`Failed to find conflicting appointments: ${error.message}`);
      return data.map(this.mapToAppointment);
    });
  }

  private mapToAppointment(row: Database['public']['Tables']['appointments']['Row']): Appointment {
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
  async findByKey(tenantId: string, key: string): Promise<FAQ | null> {
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

  private mapToFAQ(row: Database['public']['Tables']['faqs']['Row']): FAQ {
    return {
      id: row.id,
      tenant_id: row.tenant_id,
      key: row.key as FAQ['key'],
      content_text: row.content_text,
    };
  }
}

// Utility function to clean expired appointments
export async function cleanExpiredAppointments(): Promise<number> {
  const db = getDatabaseClient();
  const { data, error } = await db.rpc('clean_expired_appointments');
  
  if (error) throw new Error(`Failed to clean expired appointments: ${error.message}`);
  return data || 0;
}

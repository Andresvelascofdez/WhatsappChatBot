import type { Database } from './types';
import type { Tenant, Service, Customer, Appointment, FAQ } from './schemas';
declare abstract class BaseRepository {
    protected get db(): import("@supabase/supabase-js").SupabaseClient<Database, "public", any>;
    protected withTenant<T>(tenantId: string, operation: () => Promise<T>): Promise<T>;
}
export declare class TenantRepository extends BaseRepository {
    findById(id: string): Promise<Tenant | null>;
    findByPhoneMasked(phoneMasked: string): Promise<Tenant | null>;
    private mapToTenant;
}
export declare class ServiceRepository extends BaseRepository {
    findByTenant(tenantId: string): Promise<Service[]>;
    findById(tenantId: string, serviceId: string): Promise<Service | null>;
    private mapToService;
}
export declare class CustomerRepository extends BaseRepository {
    findOrCreate(tenantId: string, whatsapp: string, name: string): Promise<Customer>;
    private mapToCustomer;
}
export declare class AppointmentRepository extends BaseRepository {
    create(tenantId: string, appointment: Omit<Appointment, 'id' | 'created_at'>): Promise<Appointment>;
    updateStatus(tenantId: string, appointmentId: string, status: Appointment['status'], gcalEventId?: string): Promise<void>;
    findPending(tenantId: string, customerId: string): Promise<Appointment | null>;
    findConflicting(tenantId: string, startTs: Date, endTs: Date): Promise<Appointment[]>;
    private mapToAppointment;
}
export declare class FAQRepository extends BaseRepository {
    findByKey(tenantId: string, key: string): Promise<FAQ | null>;
    private mapToFAQ;
}
export declare function cleanExpiredAppointments(): Promise<number>;
export {};
//# sourceMappingURL=repositories.d.ts.map
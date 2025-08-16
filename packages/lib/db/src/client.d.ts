import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
export interface DatabaseConfig {
    url: string;
    serviceRoleKey: string;
    anonKey?: string;
}
export declare function createDatabaseClient(config: DatabaseConfig): SupabaseClient<Database>;
export declare function getDatabaseClient(): SupabaseClient<Database>;
export declare function setTenantContext(tenantId: string): Promise<void>;
export declare function testConnection(): Promise<boolean>;
//# sourceMappingURL=client.d.ts.map
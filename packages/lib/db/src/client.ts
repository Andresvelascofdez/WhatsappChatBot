import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

let supabaseClient: SupabaseClient<Database> | null = null;

export interface DatabaseConfig {
  url: string;
  serviceRoleKey: string;
  anonKey?: string;
}

export function createDatabaseClient(config: DatabaseConfig): SupabaseClient<Database> {
  if (supabaseClient) {
    return supabaseClient;
  }

  supabaseClient = createClient<Database>(
    config.url,
    config.serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
    }
  );

  return supabaseClient;
}

export function getDatabaseClient(): SupabaseClient<Database> {
  if (!supabaseClient) {
    throw new Error('Database client not initialized. Call createDatabaseClient first.');
  }
  return supabaseClient;
}

export async function setTenantContext(tenantId: string): Promise<void> {
  const client = getDatabaseClient();
  
  const { error } = await client.rpc('set_config', {
    setting_name: 'app.current_tenant_id',
    setting_value: tenantId,
    is_local: true,
  });

  if (error) {
    throw new Error(`Failed to set tenant context: ${error.message}`);
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    const client = getDatabaseClient();
    const { error } = await client.from('tenants').select('count').limit(1).single();
    return !error;
  } catch {
    return false;
  }
}

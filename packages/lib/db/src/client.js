import { createClient } from '@supabase/supabase-js';
let supabaseClient = null;
export function createDatabaseClient(config) {
    if (supabaseClient) {
        return supabaseClient;
    }
    supabaseClient = createClient(config.url, config.serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
        db: {
            schema: 'public',
        },
    });
    return supabaseClient;
}
export function getDatabaseClient() {
    if (!supabaseClient) {
        throw new Error('Database client not initialized. Call createDatabaseClient first.');
    }
    return supabaseClient;
}
export async function setTenantContext(tenantId) {
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
export async function testConnection() {
    try {
        const client = getDatabaseClient();
        const { error } = await client.from('tenants').select('count').limit(1).single();
        return !error;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=client.js.map
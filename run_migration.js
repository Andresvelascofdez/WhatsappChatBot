// Usar node-fetch para compatibilidad
const fetch = require('node-fetch');

// Usar el mismo cliente configurado que está en el API
const supabaseUrl = 'https://ygdhxqnfvajbdrnifcqq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnZGh4cW5mdmFqYmRybmlmY3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM0MDcwNTYsImV4cCI6MjA0ODk4MzA1Nn0.T5j1QPCDj3Vj_r_xJOuqgK9vXJTdvwWECgOdQPOsE60';

// Usar fetch para hacer la migración directamente
async function runMigration() {
    try {
        console.log('🔄 Ejecutando migración para agregar campo address...');
        
        // Hacer la consulta SQL directamente usando REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey
            },
            body: JSON.stringify({
                sql: 'ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address VARCHAR(255);'
            })
        });
        
        if (!response.ok) {
            const error = await response.text();
            console.error('❌ Error ejecutando migración:', error);
            return;
        }
        
        console.log('✅ Migración ejecutada exitosamente');
        console.log('📝 Campo address agregado a la tabla tenants');
        
        // Verificar la estructura actualizada
        const verifyResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey
            },
            body: JSON.stringify({
                sql: `
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns 
                    WHERE table_name = 'tenants' 
                    ORDER BY ordinal_position;
                `
            })
        });
        
        if (verifyResponse.ok) {
            const columns = await verifyResponse.json();
            console.log('🔍 Estructura actual de la tabla tenants:');
            columns.forEach(col => {
                console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

runMigration();

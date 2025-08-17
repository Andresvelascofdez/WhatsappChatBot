/**
 * 🔍 DIAGNÓSTICO: Obtener IDs de tenants y servicios
 * 
 * URL: /api/admin/debug-tenants
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

module.exports = async function handler(req, res) {
    try {
        // Obtener todos los tenants
        const { data: tenants, error: tenantsError } = await supabase
            .from('tenants')
            .select('id, name, phone, email');

        if (tenantsError) {
            return res.status(500).json({
                error: 'Error obteniendo tenants',
                details: tenantsError.message
            });
        }

        // Para cada tenant, obtener sus servicios
        const tenantsWithServices = [];
        for (const tenant of tenants) {
            const { data: services, error: servicesError } = await supabase
                .from('services')
                .select('id, name, duration_minutes, price_cents')
                .eq('tenant_id', tenant.id);

            tenantsWithServices.push({
                tenant: tenant,
                services: services || [],
                servicesError: servicesError?.message
            });
        }

        const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>🔍 Debug Tenants & Services</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1000px; margin: 20px auto; padding: 20px; }
        .tenant { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .service { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 4px; }
        .debug-link { display: inline-block; margin: 5px; padding: 8px 12px; background: #007cba; color: white; text-decoration: none; border-radius: 4px; }
        .debug-link:hover { background: #005a87; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 12px; }
    </style>
</head>
<body>
    <h1>🔍 Debug Tenants & Services</h1>
    
    ${tenantsWithServices.map(item => `
        <div class="tenant">
            <h3>🏪 ${item.tenant.name}</h3>
            <p><strong>ID:</strong> ${item.tenant.id}</p>
            <p><strong>Teléfono:</strong> ${item.tenant.phone}</p>
            <p><strong>Email:</strong> ${item.tenant.email}</p>
            
            <h4>📋 Servicios (${item.services.length}):</h4>
            ${item.services.map(service => `
                <div class="service">
                    <strong>${service.name}</strong> (${service.duration_minutes} min) - €${(service.price_cents/100).toFixed(2)}
                    <br><small>ID: ${service.id}</small>
                    <br>
                    <a href="/api/admin/debug-slots?tenantId=${item.tenant.id}&serviceId=${service.id}&date=2025-08-18" class="debug-link">🔍 Debug Slots</a>
                </div>
            `).join('')}
            
            ${item.servicesError ? `<p style="color: red;">Error servicios: ${item.servicesError}</p>` : ''}
        </div>
    `).join('')}

    <h3>🔧 Datos completos:</h3>
    <pre>${JSON.stringify(tenantsWithServices, null, 2)}</pre>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(html);

    } catch (error) {
        res.status(500).json({
            error: 'Error en diagnóstico',
            message: error.message,
            stack: error.stack
        });
    }
};

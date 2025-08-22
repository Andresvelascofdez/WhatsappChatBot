/**
 * 🎛️ PANEL DE ADMINISTRACIÓN PRINCIPAL
 * 
 * Interfaz web para gestionar el sistema multi-tenant
 * URL: /admin
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Obtener estadísticas del sistema
        const [tenantsResult, servicesResult, appointmentsResult] = await Promise.all([
            supabase.from('tenants').select('id, business_name, phone_number, active, is_active, calendar_config'),
            supabase.from('services').select('tenant_id, is_active'),
            supabase.from('appointments').select('tenant_id, status')
        ]);

        const tenants = tenantsResult.data || [];
        const services = servicesResult.data || [];
        const appointments = appointmentsResult.data || [];

        // Normalizar y calcular estadísticas
        const activeTenants = tenants.filter(t => {
            // Usar active si existe, sino usar is_active, si no existe ninguno asumir true
            const isActive = t.active !== undefined ? t.active : 
                           (t.is_active !== undefined ? t.is_active : true);
            return isActive !== false;
        });

        const stats = {
            totalTenants: tenants.length,
            activeTenants: activeTenants.length, // Campo corregido
            totalServices: services.filter(s => s.is_active !== false).length,
            totalAppointments: appointments.length,
            tenantsWithCalendar: tenants.filter(t => t.calendar_config?.access_token).length,
            confirmedAppointments: appointments.filter(a => a.status === 'confirmed').length
        };

        const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎛️ Panel de Administración - WhatsApp Bot</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .header {
            background: white;
            border-radius: 20px;
            padding: 40px;
            margin-bottom: 30px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }

        .header h1 {
            font-size: 3rem;
            background: linear-gradient(45deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }

        .header p {
            color: #666;
            font-size: 1.1rem;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: white;
            border-radius: 15px;
            padding: 30px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }

        .stat-card:hover {
            transform: translateY(-5px);
        }

        .stat-number {
            font-size: 3rem;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .stat-label {
            color: #666;
            font-size: 1.1rem;
        }

        .actions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .action-card {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }

        .action-card:hover {
            transform: translateY(-5px);
        }

        .action-card h3 {
            margin-bottom: 15px;
            color: #333;
            font-size: 1.3rem;
        }

        .action-card p {
            color: #666;
            margin-bottom: 20px;
            line-height: 1.5;
        }

        .btn {
            display: inline-block;
            padding: 12px 25px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            font-size: 16px;
        }

        .btn-primary {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
            background: #6c757d;
            color: white;
        }

        .btn-success {
            background: #28a745;
            color: white;
        }

        .btn-info {
            background: #17a2b8;
            color: white;
        }

        .tenants-section {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }

        .tenants-section h2 {
            margin-bottom: 20px;
            color: #333;
        }

        .tenant-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            border: 1px solid #eee;
            border-radius: 10px;
            margin-bottom: 10px;
            transition: background-color 0.3s ease;
        }

        .tenant-item:hover {
            background-color: #f8f9fa;
        }

        .tenant-info {
            flex: 1;
        }

        .tenant-name {
            font-weight: bold;
            color: #333;
        }

        .tenant-phone {
            color: #666;
            font-size: 0.9rem;
        }

        .tenant-status {
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
        }

        .status-connected {
            background: #d4edda;
            color: #155724;
        }

        .status-pending {
            background: #fff3cd;
            color: #856404;
        }

        .emoji {
            font-size: 2rem;
            margin-bottom: 15px;
        }

        @media (max-width: 768px) {
            .stats-grid {
                grid-template-columns: 1fr;
            }
            
            .actions-grid {
                grid-template-columns: 1fr;
            }
            
            .tenant-item {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>🎛️ Panel de Administración</h1>
            <p>Sistema Multi-Tenant WhatsApp Bot - Gestión Centralizada</p>
        </div>

        <!-- Estadísticas -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="emoji">🏢</div>
                <div class="stat-number" style="color: #667eea;">${stats.activeTenants}</div>
                <div class="stat-label">Clientes Activos</div>
            </div>
        </div>

        <!-- Acciones -->
        <div class="actions-grid">
            <div class="action-card">
                <div class="emoji">🏢</div>
                <h3>Agregar Nuevo Cliente</h3>
                <p>Agrega un nuevo negocio al sistema multi-tenant. Incluye configuración automática de servicios y generación de enlace de autorización Google Calendar.</p>
                <a href="/admin/add-client" class="btn btn-primary">➕ Agregar Cliente</a>
            </div>
            
            <div class="action-card">
                <div class="emoji">📊</div>
                <h3>Ver Todos los Clientes</h3>
                <p>Visualiza y gestiona todos los clientes registrados. Consulta su estado de configuración y enlaces de autorización.</p>
                <a href="/admin/manage-clients" class="btn btn-secondary">👥 Gestionar Clientes</a>
            </div>
            
            <div class="action-card">
                <div class="emoji">🔍</div>
                <h3>Verificar Configuración</h3>
                <p>Revisa que todas las variables de entorno y configuraciones estén correctas para el funcionamiento del sistema.</p>
                <button onclick="verifyConfig()" class="btn btn-info">🔍 Verificar Sistema</button>
            </div>
            
            <div class="action-card">
                <div class="emoji">📈</div>
                <h3>Estadísticas y Reportes</h3>
                <p>Consulta métricas de uso, citas por cliente, y rendimiento general del sistema multi-tenant.</p>
                <a href="/admin/stats" class="btn btn-success">📈 Ver Reportes</a>
            </div>
        </div>

        <!-- Lista de Clientes -->
        <div class="tenants-section">
            <h2>🏢 Clientes Recientes</h2>
            ${tenants.length === 0 ? `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 3rem; margin-bottom: 15px;">🏢</div>
                    <h3>No hay clientes configurados</h3>
                    <p>Agrega tu primer cliente para comenzar</p>
                    <a href="/admin/add-client" class="btn btn-primary" style="margin-top: 15px;">➕ Agregar Primer Cliente</a>
                </div>
            ` : tenants.slice(0, 5).map(tenant => `
                <div class="tenant-item">
                    <div class="tenant-info">
                        <div class="tenant-name">${tenant.business_name}</div>
                        <div class="tenant-phone">📱 +${tenant.phone_number}</div>
                    </div>
                    <div class="tenant-status ${tenant.calendar_config?.access_token ? 'status-connected' : 'status-pending'}">
                        ${tenant.calendar_config?.access_token ? '✅ Conectado' : '⏳ Pendiente'}
                    </div>
                </div>
            `).join('')}
            
            ${tenants.length > 5 ? `
                <div style="text-align: center; margin-top: 20px;">
                    <a href="/admin/clients" class="btn btn-secondary">Ver Todos los Clientes (${tenants.length})</a>
                </div>
            ` : ''}
        </div>
    </div>

    <script>
        function verifyConfig() {
            alert('🔄 Verificando configuración del sistema...');
            
            // Verificar health endpoint
            fetch('/health')
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'ok') {
                        alert('✅ Sistema funcionando correctamente\\n\\n' + 
                              '🔗 API: Operacional\\n' +
                              '🗄️ Base de datos: Conectada\\n' +
                              '📊 Servicio: ' + data.service);
                    } else {
                        alert('⚠️ Sistema con problemas detectados');
                    }
                })
                .catch(error => {
                    alert('❌ Error verificando sistema: ' + error.message);
                });
        }

        // Auto-refresh estadísticas cada 30 segundos
        setInterval(() => {
            window.location.reload();
        }, 30000);
    </script>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(html);

    } catch (error) {
        console.error('Error en panel admin:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

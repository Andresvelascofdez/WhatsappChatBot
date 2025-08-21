/**
 * 👥 GESTIÓN DE CLIENTES - PANEL VISUAL
 * 
 * Interfaz web para ver y gestionar clientes existentes
 * URL: /admin/manage-clients (GET) - Página HTML
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
        // Obtener todos los clientes con sus servicios y FAQs
        const response = await supabase
            .from('tenants')
            .select(`
                id,
                name,
                email,
                phone,
                address,
                created_at,
                updated_at,
                active,
                slot_config,
                calendar_config,
                services (*),
                faqs (*)
            `)
            .order('created_at', { ascending: false });

        if (response.error) {
            throw new Error(response.error.message);
        }

        const tenants = response.data || [];

        const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>👥 Gestión de Clientes - WhatsApp Bot</title>
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
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .content {
            padding: 30px;
        }
        .toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            flex-wrap: wrap;
            gap: 15px;
        }
        .search-box {
            flex: 1;
            min-width: 300px;
        }
        .search-box input {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 16px;
        }
        .search-box input:focus {
            border-color: #667eea;
            outline: none;
        }
        .btn {
            padding: 12px 25px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            text-align: center;
            transition: all 0.3s ease;
        }
        .btn-primary {
            background: #667eea;
            color: white;
        }
        .btn-primary:hover {
            background: #5a67d8;
            transform: translateY(-2px);
        }
        .btn-secondary {
            background: #6c757d;
            color: white;
        }
        .btn-secondary:hover {
            background: #5a6268;
        }
        .btn-success {
            background: #28a745;
            color: white;
        }
        .btn-success:hover {
            background: #218838;
        }
        .btn-danger {
            background: #dc3545;
            color: white;
        }
        .btn-danger:hover {
            background: #c82333;
        }
        .btn-warning {
            background: #ffc107;
            color: #212529;
        }
        .btn-warning:hover {
            background: #e0a800;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: linear-gradient(45deg, #f8f9fa, #e9ecef);
            padding: 20px;
            border-radius: 15px;
            text-align: center;
            border-left: 5px solid #667eea;
        }
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }
        .stat-label {
            color: #6c757d;
            font-size: 0.9rem;
        }
        .clients-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
            gap: 20px;
        }
        .client-card {
            border: 2px solid #e0e0e0;
            border-radius: 15px;
            padding: 20px;
            background: #f8f9fa;
            transition: all 0.3s ease;
        }
        .client-card:hover {
            border-color: #667eea;
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .client-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .client-title {
            font-size: 1.2rem;
            font-weight: bold;
            color: #333;
        }
        .client-status {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
        }
        .status-active {
            background: #d4edda;
            color: #155724;
        }
        .status-inactive {
            background: #f8d7da;
            color: #721c24;
        }
        .client-info {
            margin-bottom: 15px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            font-size: 0.9rem;
        }
        .info-label {
            font-weight: 600;
            color: #666;
        }
        .info-value {
            color: #333;
        }
        .client-stats {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 10px;
            margin: 15px 0;
        }
        .mini-stat {
            text-align: center;
            padding: 10px;
            background: white;
            border-radius: 8px;
        }
        .mini-stat-number {
            font-size: 1.1rem;
            font-weight: bold;
            color: #667eea;
        }
        .mini-stat-label {
            font-size: 0.7rem;
            color: #666;
            margin-top: 2px;
        }
        .client-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        .btn-sm {
            padding: 6px 12px;
            font-size: 0.8rem;
        }
        .calendar-status {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 0.7rem;
            font-weight: bold;
            margin-left: 8px;
        }
        .calendar-connected {
            background: #d4edda;
            color: #155724;
        }
        .calendar-disconnected {
            background: #fff3cd;
            color: #856404;
        }
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #6c757d;
        }
        .empty-state h3 {
            margin-bottom: 15px;
            font-size: 1.5rem;
        }
        @media (max-width: 768px) {
            .container {
                margin: 10px;
                border-radius: 15px;
            }
            .header {
                padding: 20px;
            }
            .content {
                padding: 20px;
            }
            .toolbar {
                flex-direction: column;
                align-items: stretch;
            }
            .search-box {
                min-width: auto;
            }
            .clients-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>👥 Gestión de Clientes</h1>
            <p>Panel de administración - Sistema Multi-Tenant WhatsApp Bot</p>
        </div>
        
        <div class="content">
            <!-- Toolbar -->
            <div class="toolbar">
                <div class="search-box">
                    <input type="text" id="searchClients" placeholder="🔍 Buscar clientes por nombre, email o teléfono...">
                </div>
                <div>
                    <a href="/admin/add-client" class="btn btn-primary">➕ Agregar Cliente</a>
                    <a href="/admin" class="btn btn-secondary">🏠 Panel Principal</a>
                </div>
            </div>

            <!-- Estadísticas -->
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-number">${tenants.length}</div>
                    <div class="stat-label">Total Clientes</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${tenants.filter(t => t.active !== false).length}</div>
                    <div class="stat-label">Clientes Activos</div>
                </div>
            </div>

            <!-- Lista de Clientes -->
            ${tenants.length === 0 ? `
            <div class="empty-state">
                <h3>📋 No hay clientes registrados</h3>
                <p>Comienza agregando tu primer cliente para gestionar las reservas por WhatsApp</p>
                <br>
                <a href="/admin/add-client" class="btn btn-primary">➕ Agregar Primer Cliente</a>
            </div>
            ` : `
            <div class="clients-grid" id="clientsGrid">
                ${tenants.map(tenant => {
                    const hasCalendar = tenant.calendar_config?.access_token;
                    
                    return `
                    <div class="client-card" data-search="${tenant.name?.toLowerCase()} ${tenant.email?.toLowerCase()} ${tenant.phone?.toLowerCase()}">
                        <div class="client-header">
                            <div class="client-title">${tenant.name || 'Sin nombre'}</div>
                            <div class="client-status ${tenant.active !== false ? 'status-active' : 'status-inactive'}">
                                ${tenant.active !== false ? '✅ Activo' : '❌ Inactivo'}
                            </div>
                        </div>
                        
                        <div class="client-info">
                            <div class="info-row">
                                <span class="info-label">📧 Email:</span>
                                <span class="info-value">${tenant.email || 'No especificado'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">📱 WhatsApp:</span>
                                <span class="info-value">+${tenant.phone || 'No especificado'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">📍 Dirección:</span>
                                <span class="info-value">${tenant.address || 'No especificada'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">📅 Creado:</span>
                                <span class="info-value">${new Date(tenant.created_at).toLocaleDateString('es-ES')}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">📆 Google Calendar:</span>
                                <span class="calendar-status ${hasCalendar ? 'calendar-connected' : 'calendar-disconnected'}">
                                    ${hasCalendar ? '🔗 Conectado' : '❌ Desconectado'}
                                </span>
                            </div>
                        </div>

                        <div class="client-actions">
                            <button onclick="viewClient('${tenant.id}')" class="btn btn-primary btn-sm">👁️ Ver</button>
                            <button onclick="editClient('${tenant.id}')" class="btn btn-warning btn-sm">✏️ Editar</button>
                            <button onclick="toggleStatus('${tenant.id}', ${tenant.active === false})" class="btn ${tenant.active !== false ? 'btn-danger' : 'btn-success'} btn-sm">
                                ${tenant.active !== false ? '⏸️ Desactivar' : '▶️ Activar'}
                            </button>
                            <button onclick="deleteClient('${tenant.id}', '${tenant.name}')" class="btn btn-danger btn-sm" style="margin-top: 5px;">
                                🗑️ Borrar Todo
                            </button>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
            `}
        </div>
    </div>

    <script>
        // Búsqueda en tiempo real
        document.getElementById('searchClients').addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const clientCards = document.querySelectorAll('.client-card');
            
            clientCards.forEach(card => {
                const searchData = card.getAttribute('data-search');
                if (searchData.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });

        // Funciones de gestión
        function viewClient(clientId) {
            window.open(\`/admin/client-view?id=\${clientId}\`, '_blank');
        }

        function editClient(clientId) {
            window.open(\`/admin/client-edit?id=\${clientId}\`, '_blank');
        }

        function toggleStatus(clientId, newStatus) {
            const action = newStatus ? 'activar' : 'desactivar';
            
            if (confirm(\`¿Estás seguro de que deseas \${action} este cliente?\`)) {
                fetch(\`/admin/clients/\${clientId}\`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        active: newStatus
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        location.reload();
                    } else {
                        alert('Error: ' + data.message);
                    }
                })
                .catch(error => {
                    alert('Error conectando con el servidor');
                    console.error(error);
                });
            }
        }

        function deleteClient(clientId, clientName) {
            const confirmation = prompt(\`🚨 ADVERTENCIA: Esta acción eliminará TODOS los datos del cliente "\${clientName}"\n\nEsto incluye:\n- Información del cliente\n- Todos sus servicios\n- Todas sus FAQs\n- Todas las citas\n- Todos los customers/clientes\n- Configuración de calendario\n\nEsta acción NO se puede deshacer.\n\nPara confirmar, escribe exactamente: BORRAR TODO\`);
            
            if (confirmation === 'BORRAR TODO') {
                const finalConfirm = confirm(\`¿Estás absolutamente seguro de que deseas borrar TODOS los datos de "\${clientName}"?\`);
                
                if (finalConfirm) {
                    // Mostrar loading
                    const originalText = event.target.textContent;
                    event.target.textContent = '🔄 Borrando...';
                    event.target.disabled = true;
                    
                    fetch(\`/admin/clients/\${clientId}/delete-all\`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert(\`✅ Cliente "\${clientName}" y todos sus datos han sido eliminados correctamente.\`);
                            location.reload();
                        } else {
                            alert('❌ Error: ' + data.message);
                            event.target.textContent = originalText;
                            event.target.disabled = false;
                        }
                    })
                    .catch(error => {
                        alert('❌ Error conectando con el servidor');
                        console.error(error);
                        event.target.textContent = originalText;
                        event.target.disabled = false;
                    });
                }
            } else if (confirmation !== null) {
                alert('Texto de confirmación incorrecto. Operación cancelada.');
            }
        }

        // Auto-refresh cada 30 segundos
        setInterval(() => {
            // Solo recargar si no hay búsqueda activa
            if (!document.getElementById('searchClients').value) {
                location.reload();
            }
        }, 30000);
    </script>
</body>
</html>
        `;

        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(html);

    } catch (error) {
        console.error('Error fetching clients:', error);
        return res.status(500).json({
            error: 'Failed to load clients page',
            message: error.message
        });
    }
};

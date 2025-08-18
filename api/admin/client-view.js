/**
 * 👁️ VER CLIENTE - DETALLES COMPLETOS
 * 
 * Página para visualizar todos los detalles de un cliente específico
 * URL: /admin/client-view?id={clientId}
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
        // Obtener ID del cliente desde query params
        const url = new URL(req.url, `http://${req.headers.host}`);
        const clientId = url.searchParams.get('id');

        if (!clientId) {
            return res.status(400).json({ error: 'Client ID is required' });
        }

        // Obtener datos del cliente con servicios y FAQs
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
            .eq('id', clientId)
            .single();

        if (response.error) {
            throw new Error(response.error.message);
        }

        if (!response.data) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        const client = response.data;
        const hasCalendar = client.calendar_config?.access_token;

        const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>👁️ Ver Cliente: ${client.name} - WhatsApp Bot</title>
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
        .back-btn {
            margin-bottom: 20px;
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
        .btn-secondary {
            background: #6c757d;
            color: white;
        }
        .btn-secondary:hover {
            background: #5a6268;
        }
        .btn-warning {
            background: #ffc107;
            color: #212529;
        }
        .btn-warning:hover {
            background: #e0a800;
        }
        .client-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        .info-section {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 15px;
            border-left: 5px solid #667eea;
        }
        .info-section h3 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.3rem;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 12px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .info-label {
            font-weight: 600;
            color: #666;
        }
        .info-value {
            color: #333;
            font-weight: 500;
        }
        .status-badge {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.9rem;
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
        .calendar-connected {
            background: #d4edda;
            color: #155724;
        }
        .calendar-disconnected {
            background: #fff3cd;
            color: #856404;
        }
        .services-section, .faqs-section {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 15px;
            margin-bottom: 20px;
            border-left: 5px solid #28a745;
        }
        .services-section h3, .faqs-section h3 {
            color: #28a745;
            margin-bottom: 15px;
        }
        .service-item, .faq-item {
            background: white;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 10px;
            border: 1px solid #e0e0e0;
        }
        .service-header, .faq-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        .service-name, .faq-question {
            font-weight: bold;
            color: #333;
        }
        .service-price {
            color: #28a745;
            font-weight: bold;
        }
        .service-duration {
            color: #666;
            font-size: 0.9rem;
        }
        .faq-answer {
            color: #666;
            line-height: 1.4;
        }
        .faq-keywords {
            font-size: 0.8rem;
            color: #999;
            margin-top: 5px;
        }
        .no-items {
            text-align: center;
            color: #666;
            font-style: italic;
            padding: 20px;
        }
        .actions {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-top: 30px;
        }
        @media (max-width: 768px) {
            .client-info {
                grid-template-columns: 1fr;
            }
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
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>👁️ Detalles del Cliente</h1>
            <p><strong>${client.name}</strong></p>
        </div>
        
        <div class="content">
            <div class="back-btn">
                <a href="/admin/manage-clients" class="btn btn-secondary">← Volver a la Lista</a>
            </div>

            <!-- Información Básica -->
            <div class="client-info">
                <div class="info-section">
                    <h3>📋 Información General</h3>
                    <div class="info-row">
                        <span class="info-label">Nombre del Negocio:</span>
                        <span class="info-value">${client.name}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Email:</span>
                        <span class="info-value">${client.email || 'No especificado'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Teléfono WhatsApp:</span>
                        <span class="info-value">+${client.phone}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Dirección:</span>
                        <span class="info-value">${client.address || 'No especificada'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Estado:</span>
                        <span class="status-badge ${client.active ? 'status-active' : 'status-inactive'}">
                            ${client.active ? '✅ Activo' : '❌ Inactivo'}
                        </span>
                    </div>
                </div>

                <div class="info-section">
                    <h3>⚙️ Configuración</h3>
                    <div class="info-row">
                        <span class="info-label">Creado:</span>
                        <span class="info-value">${new Date(client.created_at).toLocaleDateString('es-ES')}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Última actualización:</span>
                        <span class="info-value">${new Date(client.updated_at).toLocaleDateString('es-ES')}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Slots (minutos):</span>
                        <span class="info-value">${client.slot_config?.slot_granularity || 15} min</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Reserva mismo día:</span>
                        <span class="info-value">${client.slot_config?.allow_same_day_booking ? '✅ Sí' : '❌ No'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Días máx. reserva:</span>
                        <span class="info-value">${client.slot_config?.max_advance_booking_days || 30} días</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Google Calendar:</span>
                        <span class="status-badge ${hasCalendar ? 'calendar-connected' : 'calendar-disconnected'}">
                            ${hasCalendar ? '🔗 Conectado' : '❌ Desconectado'}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Servicios -->
            <div class="services-section">
                <h3>💰 Servicios (${client.services?.length || 0})</h3>
                ${client.services && client.services.length > 0 ? 
                    client.services.map(service => `
                        <div class="service-item">
                            <div class="service-header">
                                <span class="service-name">${service.name}</span>
                                <span class="service-price">€${(service.price_cents / 100).toFixed(2)}</span>
                            </div>
                            <div class="service-duration">⏱️ ${service.duration_min} minutos</div>
                            ${service.description ? `<div style="margin-top: 8px; color: #666;">${service.description}</div>` : ''}
                        </div>
                    `).join('') :
                    '<div class="no-items">📝 No hay servicios configurados</div>'
                }
            </div>

            <!-- FAQs -->
            <div class="faqs-section">
                <h3>❓ Preguntas Frecuentes (${client.faqs?.length || 0})</h3>
                ${client.faqs && client.faqs.length > 0 ?
                    client.faqs.map(faq => `
                        <div class="faq-item">
                            <div class="faq-header">
                                <span class="faq-question">${faq.question}</span>
                            </div>
                            <div class="faq-answer">${faq.answer}</div>
                            ${faq.keywords && faq.keywords.length > 0 ? 
                                `<div class="faq-keywords">🏷️ Palabras clave: ${Array.isArray(faq.keywords) ? faq.keywords.join(', ') : faq.keywords}</div>` : ''
                            }
                            ${faq.category ? `<div class="faq-keywords">📂 Categoría: ${faq.category}</div>` : ''}
                        </div>
                    `).join('') :
                    '<div class="no-items">💬 No hay FAQs configuradas</div>'
                }
            </div>

            <!-- Acciones -->
            <div class="actions">
                <a href="/admin/client-edit?id=${client.id}" class="btn btn-warning">✏️ Editar Cliente</a>
                <a href="/admin/manage-clients" class="btn btn-secondary">📋 Volver a Lista</a>
            </div>
        </div>
    </div>
</body>
</html>
        `;

        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(html);

    } catch (error) {
        console.error('Error loading client view:', error);
        return res.status(500).json({
            error: 'Failed to load client details',
            message: error.message
        });
    }
};

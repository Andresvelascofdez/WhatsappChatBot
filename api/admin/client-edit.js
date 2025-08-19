/**
 * ✏️ EDITAR CLIENTE - FORMULARIO DE EDICIÓN COMPLETO
 * 
 * Página para editar todos los detalles de un cliente específico
 * URL: /admin/client-edit?id={clientId}
 * Incluye: Información básica, horarios, servicios, FAQs, configuración de slots
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

module.exports = async function handler(req, res) {
    if (req.method === 'GET') {
        return await handleGetEdit(req, res);
    } else if (req.method === 'POST') {
        return await handlePostEdit(req, res);
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
};

async function handleGetEdit(req, res) {
    try {
        // Obtener ID del cliente desde query params
        const url = new URL(req.url, `http://${req.headers.host}`);
        const clientId = url.searchParams.get('id');

        if (!clientId) {
            return res.status(400).json({ error: 'Client ID is required' });
        }

        // Obtener datos completos del cliente
        const [tenantResponse, servicesResponse, faqsResponse] = await Promise.all([
            supabase
                .from('tenants')
                .select('*')
                .eq('id', clientId)
                .single(),
            supabase
                .from('services')
                .select('*')
                .eq('tenant_id', clientId)
                .eq('is_active', true),
            supabase
                .from('faqs')
                .select('*')
                .eq('tenant_id', clientId)
                .eq('is_active', true)
        ]);

        if (tenantResponse.error) {
            throw new Error(tenantResponse.error.message);
        }

        if (!tenantResponse.data) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        const client = tenantResponse.data;
        const services = servicesResponse.data || [];
        const faqs = faqsResponse.data || [];

        return showEditForm(res, client, services, faqs);

    } catch (error) {
        console.error('Error loading edit form:', error);
        return res.status(500).json({ error: 'Error cargando formulario de edición', message: error.message });
    }
}

function generateScheduleHTML(businessHours) {
    const days = [
        { key: 'monday', name: 'Lunes' },
        { key: 'tuesday', name: 'Martes' },
        { key: 'wednesday', name: 'Miércoles' },
        { key: 'thursday', name: 'Jueves' },
        { key: 'friday', name: 'Viernes' },
        { key: 'saturday', name: 'Sábado' },
        { key: 'sunday', name: 'Domingo' }
    ];

    return days.map(day => {
        const dayData = businessHours[day.key] || {};
        const isClosed = dayData.closed === true;
        const isSplit = !!(dayData.morning && dayData.afternoon);
        
        // Valores seguros para todos los casos
        const openTime = isSplit && dayData.morning && dayData.morning.open ? dayData.morning.open : (dayData.open || '09:00');
        const closeTime = isSplit && dayData.afternoon && dayData.afternoon.close ? dayData.afternoon.close : (dayData.close || '18:00');
        const lunchCloseTime = isSplit && dayData.morning && dayData.morning.close ? dayData.morning.close : '14:00';
        const lunchOpenTime = isSplit && dayData.afternoon && dayData.afternoon.open ? dayData.afternoon.open : '16:00';

        return `
        <div class="day-schedule" data-day="${day.key}">
            <div class="day-header">
                <h4>📅 ${day.name}</h4>
                <div class="day-controls">
                    <label class="checkbox-label">
                        <input type="checkbox" name="${day.key}_closed" ${isClosed ? 'checked' : ''} onchange="toggleDayClosed('${day.key}', this)">
                        <span>Cerrado</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" name="${day.key}_split" ${isSplit ? 'checked' : ''} onchange="toggleSplitDay('${day.key}', this)" ${isClosed ? 'disabled' : ''}>
                        <span>Jornada partida</span>
                    </label>
                </div>
            </div>
            <div class="schedule-times" id="${day.key}_times" ${isClosed ? 'style="display: none;"' : ''}>
                <div class="time-group">
                    <div class="time-input">
                        <label>Apertura</label>
                        <input type="time" name="${day.key}_open" value="${openTime}" ${isClosed ? 'disabled' : ''}>
                    </div>
                    <div class="time-input">
                        <label>Cierre</label>
                        <input type="time" name="${day.key}_close" value="${closeTime}" ${isClosed ? 'disabled' : ''}>
                    </div>
                </div>
                <div class="time-group split-times" id="${day.key}_split_times" ${!isSplit ? 'style="display: none;"' : ''}>
                    <div class="time-input">
                        <label>Cierre mediodía</label>
                        <input type="time" name="${day.key}_lunch_close" value="${lunchCloseTime}" ${isClosed ? 'disabled' : ''}>
                    </div>
                    <div class="time-input">
                        <label>Apertura tarde</label>
                        <input type="time" name="${day.key}_lunch_open" value="${lunchOpenTime}" ${isClosed ? 'disabled' : ''}>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}

function generateServicesHTML(services) {
    if (services.length === 0) {
        return `
        <div class="service-item">
            <div class="form-group">
                <label>Nombre del Servicio *</label>
                <input type="text" name="serviceName[]" required placeholder="ej: Corte + Barba" style="font-size: 1.1rem; padding: 12px;">
            </div>
            <div class="form-group">
                <label>Precio (€) *</label>
                <input type="number" name="servicePrice[]" required step="0.01" min="0" placeholder="35.00" style="font-size: 1.1rem; padding: 12px;">
            </div>
            <div class="form-group">
                <label>Duración (min) *</label>
                <input type="number" name="serviceDuration[]" required min="5" max="480" placeholder="45" style="font-size: 1.1rem; padding: 12px;">
            </div>
            <button type="button" class="btn btn-danger" onclick="removeService(this)">🗑️</button>
        </div>`;
    }

    return services.map(service => `
        <div class="service-item">
            <div class="form-group">
                <label>Nombre del Servicio *</label>
                <input type="text" name="serviceName[]" required value="${service.name || ''}" style="font-size: 1.1rem; padding: 12px;">
            </div>
            <div class="form-group">
                <label>Precio (€) *</label>
                <input type="number" name="servicePrice[]" required step="0.01" min="0" value="${service.price_cents ? (service.price_cents / 100).toFixed(2) : '0.00'}" style="font-size: 1.1rem; padding: 12px;">
            </div>
            <div class="form-group">
                <label>Duración (min) *</label>
                <input type="number" name="serviceDuration[]" required min="5" max="480" value="${service.duration_min || 30}" style="font-size: 1.1rem; padding: 12px;">
            </div>
            <button type="button" class="btn btn-danger" onclick="removeService(this)">🗑️</button>
        </div>
    `).join('');
}

function generateFaqsHTML(faqs) {
    if (faqs.length === 0) {
        return `
        <div class="faq-item">
            <div class="form-group">
                <label>Pregunta</label>
                <input type="text" name="faqQuestion[]" placeholder="¿Cuáles son vuestros horarios?" style="font-size: 1.1rem; padding: 12px;">
            </div>
            <div class="form-group">
                <label>Respuesta</label>
                <textarea name="faqAnswer[]" rows="3" placeholder="Abrimos de Lunes a Viernes de 9:00 a 18:00..." style="font-size: 1.1rem; padding: 12px; resize: vertical;"></textarea>
            </div>
            <div class="grid-2">
                <div class="form-group">
                    <label>Palabras clave (separadas por comas)</label>
                    <input type="text" name="faqKeywords[]" placeholder="horario, horarios, abierto, horas" style="font-size: 1.1rem; padding: 12px;">
                </div>
                <div class="form-group">
                    <label>Categoría</label>
                    <input type="text" name="faqCategory[]" placeholder="horarios" style="font-size: 1.1rem; padding: 12px;">
                </div>
            </div>
            <button type="button" class="btn btn-danger" onclick="removeFaq(this)">🗑️</button>
        </div>`;
    }

    return faqs.map(faq => `
        <div class="faq-item">
            <div class="form-group">
                <label>Pregunta</label>
                <input type="text" name="faqQuestion[]" value="${faq.question || ''}" style="font-size: 1.1rem; padding: 12px;">
            </div>
            <div class="form-group">
                <label>Respuesta</label>
                <textarea name="faqAnswer[]" rows="3" style="font-size: 1.1rem; padding: 12px; resize: vertical;">${faq.answer || ''}</textarea>
            </div>
            <div class="grid-2">
                <div class="form-group">
                    <label>Palabras clave (separadas por comas)</label>
                    <input type="text" name="faqKeywords[]" value="${Array.isArray(faq.keywords) ? faq.keywords.join(', ') : (faq.keywords || '')}" style="font-size: 1.1rem; padding: 12px;">
                </div>
                <div class="form-group">
                    <label>Categoría</label>
                    <input type="text" name="faqCategory[]" value="${faq.category || ''}" style="font-size: 1.1rem; padding: 12px;">
                </div>
            </div>
            <button type="button" class="btn btn-danger" onclick="removeFaq(this)">🗑️</button>
        </div>
    `).join('');
}

function showEditForm(res, client, services, faqs) {
    // Extraer horarios de trabajo
    const businessHours = client.business_hours || {};
    const slotConfig = client.slot_config || {};
    
    // Debug temporal: mostrar los datos de horarios
    console.log('=== DEBUG BUSINESS HOURS ===');
    console.log('Raw business_hours:', JSON.stringify(businessHours, null, 2));
    
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>✏️ Editar Cliente: ${client.name} - WhatsApp Bot Admin</title>
    
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
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }

        .header p {
            opacity: 0.9;
            font-size: 1.1rem;
        }

        .form-container {
            padding: 40px;
        }

        .section {
            margin-bottom: 40px;
            padding: 25px;
            background: #f8f9ff;
            border-radius: 15px;
            border-left: 5px solid #667eea;
        }

        .section h3 {
            color: #333;
            margin-bottom: 20px;
            font-size: 1.3rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #555;
        }

        input[type="text"],
        input[type="email"],
        input[type="number"],
        input[type="time"],
        textarea,
        select {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e1e5e9;
            border-radius: 10px;
            font-size: 16px;
            transition: all 0.3s ease;
        }

        input:focus,
        textarea:focus,
        select:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .services-container {
            border: 2px dashed #ddd;
            border-radius: 15px;
            padding: 20px;
            margin-top: 15px;
        }

        .service-item {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr auto;
            gap: 15px;
            align-items: end;
            margin-bottom: 15px;
            padding: 15px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }

        .faqs-container {
            border: 2px dashed #e0e0e0;
            border-radius: 15px;
            padding: 20px;
            margin-top: 15px;
            background: #f8f9fa;
        }

        .faq-item {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 15px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            border: 1px solid #e0e0e0;
        }

        .btn {
            padding: 12px 25px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
            text-align: center;
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

        .btn-danger {
            background: #dc3545;
            color: white;
            padding: 8px 15px;
            font-size: 14px;
        }

        .btn-add {
            background: #28a745;
            color: white;
            width: 100%;
            margin-top: 10px;
        }

        .submit-section {
            background: linear-gradient(45deg, #667eea, #764ba2);
            margin: 40px -40px -40px -40px;
            padding: 30px 40px;
            text-align: center;
        }

        .info-box {
            background: #e3f2fd;
            border: 1px solid #2196f3;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 20px;
        }

        .info-box h4 {
            color: #1976d2;
            margin-bottom: 10px;
        }

        .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }

        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px;
        }

        .checkbox-group input[type="checkbox"] {
            width: auto;
        }

        /* Estilos para Horarios de Trabajo */
        .schedule-container {
            background: white;
            border-radius: 15px;
            padding: 20px;
            margin-top: 15px;
            border: 2px solid #e1e5e9;
        }

        .day-schedule {
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9ff;
            border-radius: 10px;
            border-left: 4px solid #667eea;
        }

        .day-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .day-header h4 {
            margin: 0;
            color: #333;
            font-size: 1.1rem;
        }

        .day-controls {
            display: flex;
            gap: 15px;
            align-items: center;
        }

        .checkbox-label {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 14px;
            color: #666;
            cursor: pointer;
            margin: 0;
        }

        .checkbox-label input[type="checkbox"] {
            width: auto;
            margin: 0;
        }

        .schedule-times {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .time-group {
            display: flex;
            gap: 15px;
            align-items: end;
        }

        .time-input {
            flex: 1;
        }

        .time-input label {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
        }

        .time-input input[type="time"] {
            width: 100%;
            padding: 8px 12px;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 14px;
        }

        .time-input input[type="time"]:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .split-times {
            padding-left: 20px;
            border-left: 2px solid #ddd;
        }

        .schedule-actions {
            display: flex;
            gap: 15px;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #e1e5e9;
        }

        .schedule-actions button {
            flex: 1;
            padding: 10px 15px;
            font-size: 14px;
        }

        .day-schedule.closed {
            opacity: 0.6;
            background: #f5f5f5;
        }

        .day-schedule.closed .schedule-times {
            display: none;
        }

        @media (max-width: 768px) {
            .service-item {
                grid-template-columns: 1fr;
                gap: 10px;
            }
            
            .grid-2 {
                grid-template-columns: 1fr;
            }
            
            .form-container {
                padding: 20px;
            }

            .day-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }

            .day-controls {
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;
            }

            .time-group {
                flex-direction: column;
                gap: 10px;
            }

            .schedule-actions {
                flex-direction: column;
            }
        }

        .loading {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 1000;
            justify-content: center;
            align-items: center;
            color: white;
            font-size: 1.2rem;
        }

        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin-right: 15px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="loading" id="loading">
        <div>
            <div class="spinner"></div>
            Actualizando cliente...
        </div>
    </div>

    <div class="container">
        <div class="header">
            <h1>✏️ Editar Cliente</h1>
            <p>Modificar datos de ${client.name}</p>
        </div>

        <form class="form-container" id="clientForm" method="POST">
            <div style="margin-bottom: 20px;">
                <a href="/admin/client-view?id=${client.id}" class="btn btn-secondary">← Volver a Detalles</a>
            </div>

            <!-- Información del Negocio -->
            <div class="section">
                <h3>🏢 Información del Negocio</h3>
                
                <div class="grid-2">
                    <div class="form-group">
                        <label for="businessName">Nombre del Negocio *</label>
                        <input type="text" id="businessName" name="businessName" required 
                               value="${client.name || ''}"
                               placeholder="ej: Barbería Madrid Centro">
                    </div>
                    
                    <div class="form-group">
                        <label for="phoneNumber">Número WhatsApp *</label>
                        <input type="text" id="phoneNumber" name="phoneNumber" required 
                               value="${client.phone || ''}"
                               placeholder="ej: 34655123456" 
                               pattern="[0-9]+" 
                               title="Solo números">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="email">Email de Contacto *</label>
                    <input type="email" id="email" name="email" required 
                           value="${client.email || ''}"
                           placeholder="ej: contacto@barberia.com">
                </div>
                
                <div class="form-group">
                    <label for="address">Dirección del Negocio</label>
                    <textarea id="address" name="address" rows="3" 
                              placeholder="ej: Calle Gran Vía 123, Madrid">${client.address || ''}</textarea>
                </div>
            </div>

            <!-- Horarios de Trabajo -->
            <div class="section">
                <h3>🕒 Horarios de Trabajo</h3>
                
                <div class="info-box">
                    <h4>⏰ Configuración de Horarios</h4>
                    <p>Define los horarios de atención para cada día de la semana:</p>
                    <ul style="margin-left: 20px; margin-top: 10px;">
                        <li>✅ <strong>Jornada partida:</strong> Permite configurar apertura y cierre en dos horarios</li>
                        <li>✅ <strong>Día cerrado:</strong> Marca días sin atención</li>
                        <li>✅ <strong>Citas automáticas:</strong> Solo se permiten reservas en horarios configurados</li>
                    </ul>
                </div>

                <div class="schedule-container" id="scheduleContainer">
                    ${generateScheduleHTML(businessHours)}
                </div>

                <div class="schedule-actions">
                    <button type="button" class="btn btn-secondary" onclick="copySchedule('monday')">📋 Copiar Lunes a Toda la Semana</button>
                    <button type="button" class="btn btn-secondary" onclick="setWeekendClosed()">🏖️ Cerrar Fines de Semana</button>
                </div>
            </div>

            <!-- Servicios -->
            <div class="section">
                <h3>💼 Servicios</h3>
                
                <div class="info-box">
                    <h4>📋 Servicios Disponibles</h4>
                    <p>Configure los servicios que ofrece su negocio:</p>
                    <ul style="margin-left: 20px; margin-top: 10px;">
                        <li>✅ <strong>Nombre:</strong> Descripción clara del servicio</li>
                        <li>✅ <strong>Precio:</strong> Precio en euros (ej: 25.50)</li>
                        <li>✅ <strong>Duración:</strong> Tiempo necesario en minutos</li>
                        <li>✅ <strong>Mínimo:</strong> Debe tener al menos un servicio activo</li>
                    </ul>
                </div>

                <div class="services-container" id="servicesContainer">
                    ${generateServicesHTML(services)}
                </div>
                
                <button type="button" class="btn btn-add" onclick="addService()">+ Agregar Servicio</button>
            </div>

            <!-- FAQs -->
            <div class="section">
                <h3>❓ Preguntas Frecuentes</h3>
                
                <div class="info-box">
                    <h4>💬 Sistema de FAQs Inteligente</h4>
                    <p>Configure respuestas automáticas para consultas comunes:</p>
                    <ul style="margin-left: 20px; margin-top: 10px;">
                        <li>✅ <strong>Palabras clave:</strong> El bot detectará estas palabras para activar la respuesta</li>
                        <li>✅ <strong>Categorías:</strong> Organiza las FAQs por temas</li>
                        <li>✅ <strong>Opcional:</strong> Puedes agregar tantas FAQs como necesites</li>
                    </ul>
                </div>

                <div class="faqs-container" id="faqsContainer">
                    ${generateFaqsHTML(faqs)}
                </div>
                
                <button type="button" class="btn btn-add" onclick="addFaq()">+ Agregar FAQ</button>
            </div>

            <!-- Configuración del Sistema -->
            <div class="section">
                <h3>⚙️ Configuración del Sistema</h3>
                
                <div class="info-box">
                    <h4>🎛️ Configuración de Slots</h4>
                    <p>Configura cómo se manejarán las reservas y horarios disponibles para este cliente:</p>
                </div>

                <div class="grid-2">
                    <div class="form-group">
                        <label for="slotGranularity">Duración de Slots (minutos)</label>
                        <select id="slotGranularity" name="slotGranularity">
                            <option value="15" ${(slotConfig.slot_granularity || 15) == 15 ? 'selected' : ''}>15 minutos</option>
                            <option value="30" ${(slotConfig.slot_granularity || 15) == 30 ? 'selected' : ''}>30 minutos</option>
                            <option value="60" ${(slotConfig.slot_granularity || 15) == 60 ? 'selected' : ''}>60 minutos</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="maxAdvanceBooking">Días máximo para reservar</label>
                        <input type="number" id="maxAdvanceBooking" name="maxAdvanceBooking" 
                               value="${slotConfig.max_advance_booking_days || 30}"
                               min="1" max="365" 
                               placeholder="30">
                    </div>
                </div>

                <div class="form-group">
                    <label for="timezone">Zona Horaria</label>
                    <select id="timezone" name="timezone">
                        <option value="Europe/Madrid" ${(client.tz || 'Europe/Madrid') === 'Europe/Madrid' ? 'selected' : ''}>España (Madrid)</option>
                        <option value="Europe/London" ${(client.tz || 'Europe/Madrid') === 'Europe/London' ? 'selected' : ''}>Reino Unido (Londres)</option>
                        <option value="America/New_York" ${(client.tz || 'Europe/Madrid') === 'America/New_York' ? 'selected' : ''}>Estados Unidos (Nueva York)</option>
                        <option value="America/Mexico_City" ${(client.tz || 'Europe/Madrid') === 'America/Mexico_City' ? 'selected' : ''}>México (Ciudad de México)</option>
                        <option value="America/Argentina/Buenos_Aires" ${(client.tz || 'Europe/Madrid') === 'America/Argentina/Buenos_Aires' ? 'selected' : ''}>Argentina (Buenos Aires)</option>
                    </select>
                </div>

                <div class="checkbox-group">
                    <input type="checkbox" id="sameDayBooking" name="sameDayBooking" 
                           ${(slotConfig.allow_same_day_booking || false) ? 'checked' : ''}>
                    <label for="sameDayBooking">Permitir reservas el mismo día</label>
                </div>

                <div class="checkbox-group">
                    <input type="checkbox" id="clientActive" name="clientActive" 
                           ${(client.active !== false) ? 'checked' : ''}>
                    <label for="clientActive">Cliente activo (puede recibir mensajes)</label>
                </div>
            </div>

            <!-- Botón de envío -->
            <div class="submit-section">
                <button type="submit" class="btn btn-primary" style="font-size: 1.2rem; padding: 15px 40px;">
                    💾 Guardar Cambios
                </button>
            </div>
        </form>
    </div>

    <script>
        // Funciones para manejo de servicios
        function addService() {
            const container = document.getElementById('servicesContainer');
            const serviceItem = document.createElement('div');
            serviceItem.className = 'service-item';
            serviceItem.innerHTML = \`
                <div class="form-group">
                    <label>Nombre del Servicio *</label>
                    <input type="text" name="serviceName[]" required placeholder="ej: Corte + Barba" style="font-size: 1.1rem; padding: 12px;">
                </div>
                <div class="form-group">
                    <label>Precio (€) *</label>
                    <input type="number" name="servicePrice[]" required step="0.01" min="0" placeholder="35.00" style="font-size: 1.1rem; padding: 12px;">
                </div>
                <div class="form-group">
                    <label>Duración (min) *</label>
                    <input type="number" name="serviceDuration[]" required min="5" max="480" placeholder="45" style="font-size: 1.1rem; padding: 12px;">
                </div>
                <button type="button" class="btn btn-danger" onclick="removeService(this)">🗑️</button>
            \`;
            container.appendChild(serviceItem);
        }

        function removeService(button) {
            const container = document.getElementById('servicesContainer');
            if (container.children.length > 1) {
                button.parentElement.remove();
            } else {
                alert('Debe haber al menos un servicio');
            }
        }

        // Funciones para manejo de FAQs
        function addFaq() {
            const container = document.getElementById('faqsContainer');
            const faqItem = document.createElement('div');
            faqItem.className = 'faq-item';
            faqItem.innerHTML = \`
                <div class="form-group">
                    <label>Pregunta</label>
                    <input type="text" name="faqQuestion[]" placeholder="¿Cuáles son vuestros horarios?" style="font-size: 1.1rem; padding: 12px;">
                </div>
                <div class="form-group">
                    <label>Respuesta</label>
                    <textarea name="faqAnswer[]" rows="3" placeholder="Abrimos de Lunes a Viernes de 9:00 a 18:00..." style="font-size: 1.1rem; padding: 12px; resize: vertical;"></textarea>
                </div>
                <div class="grid-2">
                    <div class="form-group">
                        <label>Palabras clave (separadas por comas)</label>
                        <input type="text" name="faqKeywords[]" placeholder="horario, horarios, abierto, horas" style="font-size: 1.1rem; padding: 12px;">
                    </div>
                    <div class="form-group">
                        <label>Categoría</label>
                        <input type="text" name="faqCategory[]" placeholder="horarios" style="font-size: 1.1rem; padding: 12px;">
                    </div>
                </div>
                <button type="button" class="btn btn-danger" onclick="removeFaq(this)">🗑️</button>
            \`;
            container.appendChild(faqItem);
        }

        function removeFaq(button) {
            button.parentElement.remove();
        }

        // Funciones para manejo de horarios
        function toggleDayClosed(day, checkbox) {
            const timesContainer = document.getElementById(day + '_times');
            const splitCheckbox = document.querySelector('input[name="' + day + '_split"]');
            const timeInputs = timesContainer.querySelectorAll('input[type="time"]');
            
            if (checkbox.checked) {
                // Día cerrado
                timesContainer.style.display = 'none';
                splitCheckbox.disabled = true;
                splitCheckbox.checked = false;
                timeInputs.forEach(input => input.disabled = true);
                
                // Agregar clase visual
                const daySchedule = document.querySelector('[data-day="' + day + '"]');
                daySchedule.classList.add('closed');
            } else {
                // Día abierto
                timesContainer.style.display = 'flex';
                splitCheckbox.disabled = false;
                timeInputs.forEach(input => input.disabled = false);
                
                // Quitar clase visual
                const daySchedule = document.querySelector('[data-day="' + day + '"]');
                daySchedule.classList.remove('closed');
            }
        }

        function toggleSplitDay(day, checkbox) {
            const splitTimesContainer = document.getElementById(day + '_split_times');
            
            if (checkbox.checked) {
                splitTimesContainer.style.display = 'flex';
            } else {
                splitTimesContainer.style.display = 'none';
            }
        }

        function copySchedule(sourceDay) {
            const sourceOpen = document.querySelector('input[name="' + sourceDay + '_open"]').value;
            const sourceClose = document.querySelector('input[name="' + sourceDay + '_close"]').value;
            const sourceSplit = document.querySelector('input[name="' + sourceDay + '_split"]').checked;
            const sourceClosed = document.querySelector('input[name="' + sourceDay + '_closed"]').checked;
            
            let sourceLunchClose = '';
            let sourceLunchOpen = '';
            
            if (sourceSplit) {
                sourceLunchClose = document.querySelector('input[name="' + sourceDay + '_lunch_close"]').value;
                sourceLunchOpen = document.querySelector('input[name="' + sourceDay + '_lunch_open"]').value;
            }
            
            const days = ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            
            days.forEach(day => {
                // Copiar horarios básicos
                document.querySelector('input[name="' + day + '_open"]').value = sourceOpen;
                document.querySelector('input[name="' + day + '_close"]').value = sourceClose;
                
                // Copiar estado cerrado
                const closedCheckbox = document.querySelector('input[name="' + day + '_closed"]');
                closedCheckbox.checked = sourceClosed;
                toggleDayClosed(day, closedCheckbox);
                
                // Copiar jornada partida
                const splitCheckbox = document.querySelector('input[name="' + day + '_split"]');
                splitCheckbox.checked = sourceSplit;
                toggleSplitDay(day, splitCheckbox);
                
                if (sourceSplit) {
                    document.querySelector('input[name="' + day + '_lunch_close"]').value = sourceLunchClose;
                    document.querySelector('input[name="' + day + '_lunch_open"]').value = sourceLunchOpen;
                }
            });
            
            alert('✅ Horario del lunes copiado a toda la semana laboral');
        }

        function setWeekendClosed() {
            // Cerrar sábado
            const saturdayCheckbox = document.querySelector('input[name="saturday_closed"]');
            saturdayCheckbox.checked = true;
            toggleDayClosed('saturday', saturdayCheckbox);
            
            // Cerrar domingo
            const sundayCheckbox = document.querySelector('input[name="sunday_closed"]');
            sundayCheckbox.checked = true;
            toggleDayClosed('sunday', sundayCheckbox);
            
            alert('✅ Fines de semana configurados como cerrados');
        }

        // Manejo del formulario
        document.getElementById('clientForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Mostrar loading
            document.getElementById('loading').style.display = 'flex';
            
            // Crear FormData del formulario
            const formData = new FormData(this);
            
            // Verificar servicios
            const serviceNames = formData.getAll('serviceName[]');
            
            if (serviceNames.length === 0) {
                alert('Error: Debe agregar al menos un servicio.');
                document.getElementById('loading').style.display = 'none';
                return;
            }
            
            // Verificar campos críticos
            const businessName = formData.get('businessName');
            const phoneNumber = formData.get('phoneNumber');
            const email = formData.get('email');
            
            if (!businessName || !phoneNumber || !email) {
                alert('Error: Faltan campos obligatorios (Nombre, Teléfono, Email)');
                document.getElementById('loading').style.display = 'none';
                return;
            }
            
            // Convertir FormData a URLSearchParams para envío
            const urlParams = new URLSearchParams();
            
            // Agregar todos los campos
            for (let [key, value] of formData.entries()) {
                urlParams.append(key, value);
            }
            
            const bodyString = urlParams.toString();
            
            // Verificar que el body no esté vacío
            if (!bodyString || bodyString.length === 0) {
                alert('Error: No se pudieron procesar los datos del formulario');
                document.getElementById('loading').style.display = 'none';
                return;
            }
            
            // Enviar formulario
            fetch(window.location.href, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: bodyString
            })
            .then(response => {
                return response.text();
            })
            .then(html => {
                document.body.innerHTML = html;
            })
            .catch(error => {
                console.error('Fetch error:', error);
                document.getElementById('loading').style.display = 'none';
                alert('Error de red: ' + error.message);
            });
        });

        // Validación en tiempo real del teléfono
        document.getElementById('phoneNumber').addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
        });

        // Inicializar estados de horarios al cargar
        document.addEventListener('DOMContentLoaded', function() {
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            days.forEach(day => {
                const closedCheckbox = document.querySelector('input[name="' + day + '_closed"]');
                const splitCheckbox = document.querySelector('input[name="' + day + '_split"]');
                
                if (closedCheckbox && closedCheckbox.checked) {
                    toggleDayClosed(day, closedCheckbox);
                }
                
                if (splitCheckbox && splitCheckbox.checked) {
                    toggleSplitDay(day, splitCheckbox);
                }
            });
        });
    </script>
</body>
</html>`;

    res.status(200).send(html);
}

async function handlePostEdit(req, res) {
    try {
        // Obtener ID del cliente desde query params
        const url = new URL(req.url, `http://${req.headers.host}`);
        const clientId = url.searchParams.get('id');

        if (!clientId) {
            return res.status(400).json({ error: 'Client ID is required' });
        }

        // Manejo mejorado del body para Vercel
        let body = '';
        let parsedData = {};

        // En Vercel, el body ya puede venir parseado como string
        if (typeof req.body === 'string') {
            body = req.body;
        } else if (req.body && typeof req.body === 'object') {
            // Si ya es un objeto, puede que Vercel lo haya parseado
            parsedData = req.body;
        } else {
            // Leer chunks manualmente
            const chunks = [];
            for await (const chunk of req) {
                chunks.push(chunk);
            }
            body = Buffer.concat(chunks).toString();
        }

        // Si tenemos body como string, parsearlo (corregir parsing de arrays)
        if (body && Object.keys(parsedData).length === 0) {
            try {
                const formData = new URLSearchParams(body);
                
                for (let [key, value] of formData.entries()) {
                    if (parsedData[key]) {
                        // Si ya existe, convertir a array
                        if (Array.isArray(parsedData[key])) {
                            parsedData[key].push(value);
                        } else {
                            parsedData[key] = [parsedData[key], value];
                        }
                    } else {
                        parsedData[key] = value;
                    }
                }
            } catch (parseError) {
                console.error('Error parsing form data:', parseError);
                throw new Error(`Error parsing form data: ${parseError.message}`);
            }
        }

        // Verificar si el formulario está vacío
        if (Object.keys(parsedData).length === 0) {
            throw new Error('No se recibieron datos del formulario. Verifique que el formulario se envíe correctamente.');
        }

        // Extraer campos básicos
        const businessName = parsedData.businessName;
        const phoneNumber = parsedData.phoneNumber;
        const email = parsedData.email;
        const address = parsedData.address || null;
        
        // Extraer configuración de slots
        const slotGranularity = parseInt(parsedData.slotGranularity) || 30;
        const maxAdvanceBooking = parseInt(parsedData.maxAdvanceBooking) || 30;
        const timezone = parsedData.timezone || 'Europe/Madrid';
        const sameDayBooking = parsedData.sameDayBooking === 'on';
        const clientActive = parsedData.clientActive === 'on';

        // Extraer horarios de trabajo
        const businessHours = {};
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        days.forEach(day => {
            const isClosed = parsedData[day + '_closed'] === 'on';
            const isSplit = parsedData[day + '_split'] === 'on';
            
            if (isClosed) {
                businessHours[day] = { closed: true };
            } else {
                const open = parsedData[day + '_open'] || '09:00';
                const close = parsedData[day + '_close'] || '18:00';
                
                if (isSplit) {
                    const lunchClose = parsedData[day + '_lunch_close'] || '14:00';
                    const lunchOpen = parsedData[day + '_lunch_open'] || '16:00';
                    
                    businessHours[day] = {
                        morning: { open, close: lunchClose },
                        afternoon: { open: lunchOpen, close }
                    };
                } else {
                    businessHours[day] = { open, close };
                }
            }
        });

        // Extraer servicios (usando la misma lógica que add-client.js)
        const serviceNames = parsedData['serviceName[]'] || [];
        const servicePrices = parsedData['servicePrice[]'] || [];
        const serviceDurations = parsedData['serviceDuration[]'] || [];

        // Extraer FAQs (usando la misma lógica que add-client.js)
        const faqQuestions = parsedData['faqQuestion[]'] || [];
        const faqAnswers = parsedData['faqAnswer[]'] || [];
        const faqKeywords = parsedData['faqKeywords[]'] || [];
        const faqCategories = parsedData['faqCategory[]'] || [];

        // Asegurarse de que sean arrays
        const serviceNamesArray = Array.isArray(serviceNames) ? serviceNames : (serviceNames ? [serviceNames] : []);
        const servicePricesArray = Array.isArray(servicePrices) ? servicePrices : (servicePrices ? [servicePrices] : []);
        const serviceDurationsArray = Array.isArray(serviceDurations) ? serviceDurations : (serviceDurations ? [serviceDurations] : []);

        const faqQuestionsArray = Array.isArray(faqQuestions) ? faqQuestions : (faqQuestions ? [faqQuestions] : []);
        const faqAnswersArray = Array.isArray(faqAnswers) ? faqAnswers : (faqAnswers ? [faqAnswers] : []);
        const faqKeywordsArray = Array.isArray(faqKeywords) ? faqKeywords : (faqKeywords ? [faqKeywords] : []);
        const faqCategoriesArray = Array.isArray(faqCategories) ? faqCategories : (faqCategories ? [faqCategories] : []);

        // Validaciones básicas
        if (!businessName || !phoneNumber || !email) {
            throw new Error('Los campos Nombre, Teléfono y Email son obligatorios');
        }

        if (serviceNamesArray.length === 0) {
            throw new Error('Debe tener al menos un servicio');
        }

        // Preparar servicios
        const services = serviceNamesArray.map((name, index) => ({
            name: name,
            price: parseFloat(servicePricesArray[index] || 0),
            duration_minutes: parseInt(serviceDurationsArray[index] || 30)
        }));

        // Preparar FAQs
        const faqs = faqQuestionsArray
            .map((question, index) => ({
                question: question?.trim(),
                answer: faqAnswersArray[index]?.trim(),
                keywords: faqKeywordsArray[index] ? faqKeywordsArray[index].split(',').map(k => k.trim()).filter(k => k) : [],
                category: faqCategoriesArray[index]?.trim() || 'general'
            }))
            .filter(faq => faq.question && faq.answer);

        // Crear configuración de slots
        const slotConfig = {
            slot_granularity: slotGranularity,
            allow_same_day_booking: sameDayBooking,
            max_advance_booking_days: maxAdvanceBooking,
            dynamic_slots: true
        };

        console.log('=== UPDATING TENANT ===');
        console.log('Data to update:', {
            name: businessName,
            phone: phoneNumber,
            email: email,
            address: address,
            tz: timezone,
            active: clientActive,
            slot_config: slotConfig,
            business_hours: businessHours
        });

        // Actualizar tenant
        const { error: tenantError } = await supabase
            .from('tenants')
            .update({
                name: businessName,
                phone: phoneNumber,
                email: email,
                address: address,
                tz: timezone,
                active: clientActive,
                slot_config: slotConfig,
                business_hours: businessHours,
                updated_at: new Date().toISOString()
            })
            .eq('id', clientId);

        if (tenantError) {
            console.error('Tenant update error:', tenantError);
            throw new Error(`Error actualizando cliente: ${tenantError.message}`);
        }

        // Eliminar servicios anteriores
        await supabase
            .from('services')
            .delete()
            .eq('tenant_id', clientId);

        // Crear nuevos servicios
        if (services.length > 0) {
            const servicesWithTenant = services.map(service => ({
                tenant_id: clientId,
                name: service.name,
                description: `Servicio de ${service.name}`,
                price_cents: Math.round(service.price * 100),
                duration_min: service.duration_minutes,
                buffer_min: 0,
                is_active: true
            }));

            const { error: servicesError } = await supabase
                .from('services')
                .insert(servicesWithTenant);

            if (servicesError) {
                console.error('Services insert error:', servicesError);
                throw new Error(`Error actualizando servicios: ${servicesError.message}`);
            }
        }

        // Eliminar FAQs anteriores
        await supabase
            .from('faqs')
            .delete()
            .eq('tenant_id', clientId);

        // Crear nuevas FAQs
        if (faqs.length > 0) {
            const faqsWithTenant = faqs.map(faq => ({
                tenant_id: clientId,
                question: faq.question,
                answer: faq.answer,
                keywords: faq.keywords,
                category: faq.category,
                is_active: true
            }));

            const { error: faqsError } = await supabase
                .from('faqs')
                .insert(faqsWithTenant);

            if (faqsError) {
                console.error('FAQs insert error:', faqsError);
                throw new Error(`Error actualizando FAQs: ${faqsError.message}`);
            }
        }

        // Mostrar página de éxito
        const successHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>✅ Cliente Actualizado</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .success-container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            max-width: 500px;
        }
        .success-icon {
            font-size: 4rem;
            margin-bottom: 20px;
        }
        h1 {
            color: #28a745;
            margin-bottom: 20px;
        }
        .btn {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            text-decoration: none;
            display: inline-block;
            margin: 10px;
            transition: transform 0.3s;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
        .details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: left;
        }
    </style>
</head>
<body>
    <div class="success-container">
        <div class="success-icon">✅</div>
        <h1>Cliente Actualizado Exitosamente</h1>
        <p>Todos los datos de <strong>${businessName}</strong> han sido actualizados correctamente.</p>
        
        <div class="details">
            <h3>📋 Datos Actualizados:</h3>
            <ul>
                <li><strong>Información básica:</strong> Nombre, teléfono, email, dirección</li>
                <li><strong>Horarios de trabajo:</strong> Configuración completa semanal</li>
                <li><strong>Servicios:</strong> ${services.length} servicio(s) configurado(s)</li>
                <li><strong>FAQs:</strong> ${faqs.length} pregunta(s) frecuente(s)</li>
                <li><strong>Sistema:</strong> Configuración de slots y reservas</li>
                <li><strong>Estado:</strong> ${clientActive ? 'Activo' : 'Inactivo'}</li>
            </ul>
        </div>
        
        <a href="/admin/client-view?id=${clientId}" class="btn">👁️ Ver Detalles del Cliente</a>
        <a href="/admin/manage-clients" class="btn">📋 Volver a Lista de Clientes</a>
    </div>
    
    <script>
        // Auto-redirect después de 10 segundos
        setTimeout(function() {
            window.location.href = '/admin/client-view?id=${clientId}';
        }, 10000);
    </script>
</body>
</html>`;

        res.status(200).send(successHtml);

    } catch (error) {
        console.error('Error updating client:', error);
        
        const errorHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>❌ Error Actualizando Cliente</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .error-container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            max-width: 500px;
        }
        .error-icon {
            font-size: 4rem;
            margin-bottom: 20px;
        }
        h1 {
            color: #dc3545;
            margin-bottom: 20px;
        }
        .btn {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            text-decoration: none;
            display: inline-block;
            margin: 10px;
        }
        .error-details {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-icon">❌</div>
        <h1>Error Actualizando Cliente</h1>
        <div class="error-details">
            <strong>Error:</strong> ${error.message}
        </div>
        <p>Por favor, revisa los datos e inténtalo de nuevo.</p>
        
        <a href="javascript:history.back()" class="btn">⬅️ Volver al Formulario</a>
        <a href="/admin/manage-clients" class="btn">📋 Lista de Clientes</a>
    </div>
</body>
</html>`;

        res.status(500).send(errorHtml);
    }
}

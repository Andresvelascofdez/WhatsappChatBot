/**
 * 🔍 DIAGNÓSTICO: Investigar por qué no hay slots disponibles
 * 
 * URL: /api/admin/debug-slots
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

module.exports = async function handler(req, res) {
    try {
        // Obtener parámetros de testing
        const { tenantId, serviceId, date } = req.query;
        
        if (!tenantId || !serviceId || !date) {
            return res.status(400).json({
                error: 'Faltan parámetros: ?tenantId=xxx&serviceId=xxx&date=2025-08-18'
            });
        }

        const diagnosis = {
            timestamp: new Date().toISOString(),
            parameters: { tenantId, serviceId, date },
            steps: {}
        };

        // 1. Verificar que el tenant existe
        const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', tenantId)
            .single();

        if (tenantError || !tenant) {
            diagnosis.steps.tenant = {
                status: 'ERROR',
                message: 'Tenant no encontrado',
                error: tenantError?.message
            };
        } else {
            diagnosis.steps.tenant = {
                status: 'OK',
                message: 'Tenant encontrado',
                data: {
                    name: tenant.name,
                    hasCalendarConfig: !!tenant.calendar_config,
                    hasSlotConfig: !!tenant.slot_config
                }
            };
        }

        // 2. Verificar que el servicio existe
        const { data: service, error: serviceError } = await supabase
            .from('services')
            .select('*')
            .eq('id', serviceId)
            .eq('tenant_id', tenantId)
            .single();

        if (serviceError || !service) {
            diagnosis.steps.service = {
                status: 'ERROR',
                message: 'Servicio no encontrado',
                error: serviceError?.message
            };
        } else {
            diagnosis.steps.service = {
                status: 'OK',
                message: 'Servicio encontrado',
                data: {
                    name: service.name,
                    duration: service.duration_minutes,
                    price: service.price_cents
                }
            };
        }

        // 3. Verificar configuración de calendario
        if (tenant?.calendar_config) {
            try {
                const calConfig = typeof tenant.calendar_config === 'string' 
                    ? JSON.parse(tenant.calendar_config) 
                    : tenant.calendar_config;

                diagnosis.steps.calendarConfig = {
                    status: 'OK',
                    message: 'Configuración de calendario disponible',
                    data: {
                        hasAccessToken: !!calConfig.access_token,
                        hasRefreshToken: !!calConfig.refresh_token,
                        calendarId: calConfig.calendar_id,
                        expiresAt: calConfig.expires_at,
                        tokenExpired: calConfig.expires_at ? new Date(calConfig.expires_at) < new Date() : 'unknown'
                    }
                };
            } catch (e) {
                diagnosis.steps.calendarConfig = {
                    status: 'ERROR',
                    message: 'Error parseando configuración de calendario',
                    error: e.message
                };
            }
        } else {
            diagnosis.steps.calendarConfig = {
                status: 'ERROR',
                message: 'No hay configuración de calendario'
            };
        }

        // 4. Verificar horarios de negocio
        const requestedDate = new Date(date);
        const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][requestedDate.getDay()];
        
        const slotConfig = tenant?.slot_config ? 
            (typeof tenant.slot_config === 'string' ? JSON.parse(tenant.slot_config) : tenant.slot_config) 
            : {};

        const businessHours = slotConfig.business_hours?.[dayOfWeek] || {
            open: '09:00',
            close: '18:00',
            closed: false
        };

        diagnosis.steps.businessHours = {
            status: businessHours.closed ? 'CLOSED' : 'OK',
            message: businessHours.closed ? 'Negocio cerrado este día' : 'Horarios configurados',
            data: {
                dayOfWeek,
                hours: businessHours,
                slotGranularity: slotConfig.slot_granularity || 15
            }
        };

        // 5. Generar slots de prueba (sin verificar calendario)
        const testSlots = [];
        if (!businessHours.closed && service) {
            const startHour = parseInt(businessHours.open.split(':')[0]);
            const startMinute = parseInt(businessHours.open.split(':')[1]);
            const endHour = parseInt(businessHours.close.split(':')[0]);
            
            let currentTime = new Date(requestedDate);
            currentTime.setHours(startHour, startMinute, 0, 0);
            
            const endTime = new Date(requestedDate);
            endTime.setHours(endHour, 0, 0, 0);
            
            const serviceDuration = service.duration_minutes || 30;
            const slotGranularity = slotConfig.slot_granularity || 15;
            
            for (let i = 0; i < 10 && currentTime < endTime; i++) {
                const slotEnd = new Date(currentTime.getTime() + serviceDuration * 60000);
                
                if (slotEnd <= endTime) {
                    testSlots.push({
                        startTime: currentTime.toISOString(),
                        endTime: slotEnd.toISOString(),
                        displayTime: currentTime.toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        })
                    });
                }
                
                currentTime = new Date(currentTime.getTime() + slotGranularity * 60000);
            }
        }

        diagnosis.steps.testSlots = {
            status: testSlots.length > 0 ? 'OK' : 'ERROR',
            message: `${testSlots.length} slots generados sin verificar calendario`,
            data: testSlots
        };

        // 6. Probar acceso a calendario (si está configurado)
        if (tenant?.calendar_config && diagnosis.steps.calendarConfig.status === 'OK') {
            try {
                const calConfig = typeof tenant.calendar_config === 'string' 
                    ? JSON.parse(tenant.calendar_config) 
                    : tenant.calendar_config;

                // Probar llamada a Calendar API
                const testStart = new Date().toISOString();
                const testEnd = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // +1 hour

                const response = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${calConfig.access_token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        timeMin: testStart,
                        timeMax: testEnd,
                        items: [{ id: calConfig.calendar_id || 'primary' }]
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    diagnosis.steps.calendarAccess = {
                        status: 'OK',
                        message: 'Acceso a Calendar API exitoso',
                        data: {
                            calendarsChecked: Object.keys(result.calendars || {}),
                            testResult: result
                        }
                    };
                } else {
                    diagnosis.steps.calendarAccess = {
                        status: 'ERROR',
                        message: `Error Calendar API: ${response.status}`,
                        error: await response.text()
                    };
                }
            } catch (e) {
                diagnosis.steps.calendarAccess = {
                    status: 'ERROR',
                    message: 'Error conectando con Calendar API',
                    error: e.message
                };
            }
        }

        // Generar HTML de diagnóstico
        const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>🔍 Diagnóstico Slots</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1000px; margin: 20px auto; padding: 20px; }
        .step { margin: 20px 0; padding: 15px; border-radius: 8px; }
        .ok { background: #e8f5e8; border-left: 4px solid #4caf50; }
        .error { background: #ffebee; border-left: 4px solid #f44336; }
        .warning { background: #fff3e0; border-left: 4px solid #ff9800; }
        .closed { background: #f3e5f5; border-left: 4px solid #9c27b0; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 12px; }
        .data { margin-top: 10px; }
        h3 { margin-top: 0; }
        .recommendations { background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px; }
    </style>
</head>
<body>
    <h1>🔍 Diagnóstico de Slots Disponibles</h1>
    <p><strong>Parámetros:</strong> Tenant: ${tenantId}, Servicio: ${serviceId}, Fecha: ${date}</p>
    
    ${Object.entries(diagnosis.steps).map(([step, result]) => `
        <div class="step ${result.status.toLowerCase()}">
            <h3>${step.toUpperCase()}: ${result.status} - ${result.message}</h3>
            ${result.data ? `<div class="data"><pre>${JSON.stringify(result.data, null, 2)}</pre></div>` : ''}
            ${result.error ? `<div class="data"><strong>Error:</strong> ${result.error}</div>` : ''}
        </div>
    `).join('')}

    <div class="recommendations">
        <h3>🔧 Posibles soluciones:</h3>
        <ul>
            <li><strong>Si Calendar Config falla:</strong> Re-autorizar Google Calendar</li>
            <li><strong>Si Token expiró:</strong> Sistema debería renovar automáticamente</li>
            <li><strong>Si no hay Test Slots:</strong> Revisar horarios de negocio o duración del servicio</li>
            <li><strong>Si Calendar Access falla:</strong> Verificar permisos de Google</li>
        </ul>
    </div>

    <h3>🔧 Detalles completos:</h3>
    <pre>${JSON.stringify(diagnosis, null, 2)}</pre>
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

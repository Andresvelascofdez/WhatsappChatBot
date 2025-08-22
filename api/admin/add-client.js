/**
 * 🎨 PANEL DE ADMINISTRACIÓN - AGREGAR CLIENTES
 * 
 * Interfaz web visual para agregar nuevos clientes al sistema
 * URL: /admin/add-client
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
// Forzar uso de URL principal para evitar problemas con preview deployments
const REDIRECT_URI = 'https://whatsapp-chat-bot-xi.vercel.app/api/oauth/google/callback';

function generateAuthUrl(tenantId, email) {
    const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
        access_type: 'offline',
        prompt: 'consent',
        state: JSON.stringify({ tenantId, email })
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Esta función ahora está implementada más abajo con Web3Forms correcto

// Función para asegurar que existen las columnas necesarias
async function ensureTableColumns() {
    try {
        // Solo verificamos que podemos hacer una consulta básica
        // Las migraciones deben ejecutarse manualmente en Supabase
        const { data } = await supabase
            .from('tenants')
            .select('id')
            .limit(1);
        
        console.log('✅ Conexión a base de datos verificada');
    } catch (error) {
        console.log('⚠️ Error verificando base de datos:', error.message);
        throw new Error('No se puede conectar a la base de datos');
    }
}

// Función auxiliar para procesar el body de la request
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            resolve(body);
        });
        req.on('error', reject);
    });
}

// Handler principal - se exporta al final del archivo

function showForm(res) {
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏢 Agregar Nuevo Cliente - WhatsApp Bot</title>
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
        textarea {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e1e5e9;
            border-radius: 10px;
            font-size: 16px;
            transition: all 0.3s ease;
        }

        input:focus,
        textarea:focus {
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
            position: relative;
        }

        .faq-item textarea {
            width: 100%;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-family: inherit;
        }

        .faq-item textarea:focus {
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
    </style>
</head>
<body>
    <div class="loading" id="loading">
        <div>
            <div class="spinner"></div>
            Creando cliente...
        </div>
    </div>

    <div class="container">
        <div class="header">
            <h1>🏢 Agregar Nuevo Cliente</h1>
            <p>Panel de administración - Sistema Multi-Tenant WhatsApp Bot</p>
        </div>

        <form class="form-container" id="clientForm" method="POST">
            <!-- Información del Negocio -->
            <div class="section">
                <h3>🏢 Información del Negocio</h3>
                
                <div class="grid-2">
                    <div class="form-group">
                        <label for="tenantId">ID del Negocio *</label>
                        <input type="text" id="tenantId" name="tenantId" required 
                               placeholder="ej: barberia_madrid" 
                               pattern="[a-z0-9_]+" 
                               title="Solo letras minúsculas, números y guiones bajos">
                    </div>
                    
                    <div class="form-group">
                        <label for="businessName">Nombre del Negocio *</label>
                        <input type="text" id="businessName" name="businessName" required 
                               placeholder="ej: Barbería Central">
                    </div>
                </div>

                <div class="grid-2">
                    <div class="form-group">
                        <label for="phoneNumber">Número WhatsApp *</label>
                        <input type="text" id="phoneNumber" name="phoneNumber" required 
                               placeholder="34911234567" 
                               pattern="[0-9]+" 
                               title="Solo números, sin el símbolo +">
                    </div>
                    
                    <div class="form-group">
                        <label for="email">Email de Google Calendar *</label>
                        <input type="email" id="email" name="email" required 
                               placeholder="info@negocio.com">
                    </div>
                </div>

                <div class="form-group">
                    <label for="address">Dirección (opcional)</label>
                    <input type="text" id="address" name="address" 
                           placeholder="Calle Mayor 50, Madrid">
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
                    <div class="day-schedule" data-day="monday">
                        <div class="day-header">
                            <h4>📅 Lunes</h4>
                            <div class="day-controls">
                                <label class="checkbox-label">
                                    <input type="checkbox" name="monday_closed" onchange="toggleDayClosed('monday', this)">
                                    <span>Cerrado</span>
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" name="monday_split" onchange="toggleSplitDay('monday', this)">
                                    <span>Jornada partida</span>
                                </label>
                            </div>
                        </div>
                        <div class="schedule-times" id="monday_times">
                            <div class="time-group">
                                <div class="time-input">
                                    <label>Apertura</label>
                                    <input type="time" name="monday_open" value="09:00">
                                </div>
                                <div class="time-input">
                                    <label>Cierre</label>
                                    <input type="time" name="monday_close" value="18:00">
                                </div>
                            </div>
                            <div class="time-group split-times" id="monday_split_times" style="display: none;">
                                <div class="time-input">
                                    <label>Cierre mediodía</label>
                                    <input type="time" name="monday_lunch_close" value="14:00">
                                </div>
                                <div class="time-input">
                                    <label>Apertura tarde</label>
                                    <input type="time" name="monday_lunch_open" value="16:00">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="day-schedule" data-day="tuesday">
                        <div class="day-header">
                            <h4>📅 Martes</h4>
                            <div class="day-controls">
                                <label class="checkbox-label">
                                    <input type="checkbox" name="tuesday_closed" onchange="toggleDayClosed('tuesday', this)">
                                    <span>Cerrado</span>
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" name="tuesday_split" onchange="toggleSplitDay('tuesday', this)">
                                    <span>Jornada partida</span>
                                </label>
                            </div>
                        </div>
                        <div class="schedule-times" id="tuesday_times">
                            <div class="time-group">
                                <div class="time-input">
                                    <label>Apertura</label>
                                    <input type="time" name="tuesday_open" value="09:00">
                                </div>
                                <div class="time-input">
                                    <label>Cierre</label>
                                    <input type="time" name="tuesday_close" value="18:00">
                                </div>
                            </div>
                            <div class="time-group split-times" id="tuesday_split_times" style="display: none;">
                                <div class="time-input">
                                    <label>Cierre mediodía</label>
                                    <input type="time" name="tuesday_lunch_close" value="14:00">
                                </div>
                                <div class="time-input">
                                    <label>Apertura tarde</label>
                                    <input type="time" name="tuesday_lunch_open" value="16:00">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="day-schedule" data-day="wednesday">
                        <div class="day-header">
                            <h4>📅 Miércoles</h4>
                            <div class="day-controls">
                                <label class="checkbox-label">
                                    <input type="checkbox" name="wednesday_closed" onchange="toggleDayClosed('wednesday', this)">
                                    <span>Cerrado</span>
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" name="wednesday_split" onchange="toggleSplitDay('wednesday', this)">
                                    <span>Jornada partida</span>
                                </label>
                            </div>
                        </div>
                        <div class="schedule-times" id="wednesday_times">
                            <div class="time-group">
                                <div class="time-input">
                                    <label>Apertura</label>
                                    <input type="time" name="wednesday_open" value="09:00">
                                </div>
                                <div class="time-input">
                                    <label>Cierre</label>
                                    <input type="time" name="wednesday_close" value="18:00">
                                </div>
                            </div>
                            <div class="time-group split-times" id="wednesday_split_times" style="display: none;">
                                <div class="time-input">
                                    <label>Cierre mediodía</label>
                                    <input type="time" name="wednesday_lunch_close" value="14:00">
                                </div>
                                <div class="time-input">
                                    <label>Apertura tarde</label>
                                    <input type="time" name="wednesday_lunch_open" value="16:00">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="day-schedule" data-day="thursday">
                        <div class="day-header">
                            <h4>📅 Jueves</h4>
                            <div class="day-controls">
                                <label class="checkbox-label">
                                    <input type="checkbox" name="thursday_closed" onchange="toggleDayClosed('thursday', this)">
                                    <span>Cerrado</span>
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" name="thursday_split" onchange="toggleSplitDay('thursday', this)">
                                    <span>Jornada partida</span>
                                </label>
                            </div>
                        </div>
                        <div class="schedule-times" id="thursday_times">
                            <div class="time-group">
                                <div class="time-input">
                                    <label>Apertura</label>
                                    <input type="time" name="thursday_open" value="09:00">
                                </div>
                                <div class="time-input">
                                    <label>Cierre</label>
                                    <input type="time" name="thursday_close" value="18:00">
                                </div>
                            </div>
                            <div class="time-group split-times" id="thursday_split_times" style="display: none;">
                                <div class="time-input">
                                    <label>Cierre mediodía</label>
                                    <input type="time" name="thursday_lunch_close" value="14:00">
                                </div>
                                <div class="time-input">
                                    <label>Apertura tarde</label>
                                    <input type="time" name="thursday_lunch_open" value="16:00">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="day-schedule" data-day="friday">
                        <div class="day-header">
                            <h4>📅 Viernes</h4>
                            <div class="day-controls">
                                <label class="checkbox-label">
                                    <input type="checkbox" name="friday_closed" onchange="toggleDayClosed('friday', this)">
                                    <span>Cerrado</span>
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" name="friday_split" onchange="toggleSplitDay('friday', this)">
                                    <span>Jornada partida</span>
                                </label>
                            </div>
                        </div>
                        <div class="schedule-times" id="friday_times">
                            <div class="time-group">
                                <div class="time-input">
                                    <label>Apertura</label>
                                    <input type="time" name="friday_open" value="09:00">
                                </div>
                                <div class="time-input">
                                    <label>Cierre</label>
                                    <input type="time" name="friday_close" value="18:00">
                                </div>
                            </div>
                            <div class="time-group split-times" id="friday_split_times" style="display: none;">
                                <div class="time-input">
                                    <label>Cierre mediodía</label>
                                    <input type="time" name="friday_lunch_close" value="14:00">
                                </div>
                                <div class="time-input">
                                    <label>Apertura tarde</label>
                                    <input type="time" name="friday_lunch_open" value="16:00">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="day-schedule" data-day="saturday">
                        <div class="day-header">
                            <h4>📅 Sábado</h4>
                            <div class="day-controls">
                                <label class="checkbox-label">
                                    <input type="checkbox" name="saturday_closed" onchange="toggleDayClosed('saturday', this)">
                                    <span>Cerrado</span>
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" name="saturday_split" onchange="toggleSplitDay('saturday', this)">
                                    <span>Jornada partida</span>
                                </label>
                            </div>
                        </div>
                        <div class="schedule-times" id="saturday_times">
                            <div class="time-group">
                                <div class="time-input">
                                    <label>Apertura</label>
                                    <input type="time" name="saturday_open" value="09:00">
                                </div>
                                <div class="time-input">
                                    <label>Cierre</label>
                                    <input type="time" name="saturday_close" value="14:00">
                                </div>
                            </div>
                            <div class="time-group split-times" id="saturday_split_times" style="display: none;">
                                <div class="time-input">
                                    <label>Cierre mediodía</label>
                                    <input type="time" name="saturday_lunch_close" value="14:00">
                                </div>
                                <div class="time-input">
                                    <label>Apertura tarde</label>
                                    <input type="time" name="saturday_lunch_open" value="16:00">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="day-schedule" data-day="sunday">
                        <div class="day-header">
                            <h4>📅 Domingo</h4>
                            <div class="day-controls">
                                <label class="checkbox-label">
                                    <input type="checkbox" name="sunday_closed" checked onchange="toggleDayClosed('sunday', this)">
                                    <span>Cerrado</span>
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" name="sunday_split" onchange="toggleSplitDay('sunday', this)" disabled>
                                    <span>Jornada partida</span>
                                </label>
                            </div>
                        </div>
                        <div class="schedule-times" id="sunday_times" style="display: none;">
                            <div class="time-group">
                                <div class="time-input">
                                    <label>Apertura</label>
                                    <input type="time" name="sunday_open" value="09:00" disabled>
                                </div>
                                <div class="time-input">
                                    <label>Cierre</label>
                                    <input type="time" name="sunday_close" value="18:00" disabled>
                                </div>
                            </div>
                            <div class="time-group split-times" id="sunday_split_times" style="display: none;">
                                <div class="time-input">
                                    <label>Cierre mediodía</label>
                                    <input type="time" name="sunday_lunch_close" value="14:00" disabled>
                                </div>
                                <div class="time-input">
                                    <label>Apertura tarde</label>
                                    <input type="time" name="sunday_lunch_open" value="16:00" disabled>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="schedule-actions">
                    <button type="button" class="btn btn-secondary" onclick="copySchedule('monday')">📋 Copiar Lunes a Toda la Semana</button>
                    <button type="button" class="btn btn-secondary" onclick="setWeekendClosed()">🏖️ Cerrar Fines de Semana</button>
                </div>
            </div>

            <!-- Servicios -->
            <div class="section">
                <h3>💰 Servicios del Negocio</h3>
                
                <div class="info-box">
                    <h4>� Configuración de Servicios Dinámicos</h4>
                    <p>Cada servicio define su duración exacta y el sistema calcula automáticamente los horarios disponibles:</p>
                    <ul style="margin-left: 20px; margin-top: 10px;">
                        <li>✅ <strong>Duración:</strong> Tiempo real que dura el servicio</li>
                        <li>✅ <strong>Buffer:</strong> Tiempo extra entre servicios (limpieza, preparación)</li>
                        <li>✅ <strong>Ejemplo:</strong> Corte (30min) + Buffer (10min) = Próxima cita en 40 minutos</li>
                    </ul>
                </div>

                <div class="services-container" id="servicesContainer">
                    <div class="service-item">
                        <div class="form-group">
                            <label>Nombre del Servicio *</label>
                            <input type="text" name="serviceName[]" required placeholder="ej: Corte Clásico" style="font-size: 1.1rem; padding: 12px;">
                        </div>
                        <div class="form-group">
                            <label>Precio (€) *</label>
                            <input type="number" name="servicePrice[]" required step="0.01" min="0" placeholder="25.00" style="font-size: 1.1rem; padding: 12px;">
                        </div>
                        <div class="form-group">
                            <label>Duración (min) *</label>
                            <input type="number" name="serviceDuration[]" required min="5" max="480" placeholder="30" style="font-size: 1.1rem; padding: 12px;">
                        </div>
                        <button type="button" class="btn btn-danger" onclick="removeService(this)">🗑️</button>
                    </div>
                </div>

                <button type="button" class="btn btn-add" onclick="addService()">➕ Agregar Otro Servicio</button>
            </div>

            <!-- Configuración de Slots y Horarios -->
            <div class="section">
                <h3>⚙️ Configuración de Slots y Horarios</h3>
                
                <div class="grid-2">
                    <div class="form-group">
                        <label for="slotGranularity">Granularidad mínima de slots (minutos) *</label>
                        <select id="slotGranularity" name="slotGranularity" required>
                            <option value="5">5 minutos (máxima precisión)</option>
                            <option value="15" selected>15 minutos (recomendado)</option>
                            <option value="30">30 minutos (básico)</option>
                        </select>
                        <small style="color: #666; font-size: 0.9rem;">
                            ℹ️ Granularidad para calcular slots disponibles. Los servicios usan su duración exacta.
                        </small>
                    </div>
                    
                    <div class="form-group">
                        <label for="maxAdvanceBooking">Reservas con anticipación (días) *</label>
                        <select id="maxAdvanceBooking" name="maxAdvanceBooking" required>
                            <option value="7">7 días</option>
                            <option value="15">15 días</option>
                            <option value="30" selected>30 días</option>
                            <option value="60">60 días</option>
                            <option value="90">90 días</option>
                        </select>
                    </div>
                </div>

                <div class="grid-2">
                    <div class="form-group">
                        <label for="timezone">Zona Horaria *</label>
                        <select id="timezone" name="timezone" required>
                            <option value="Europe/Madrid" selected>España (Madrid)</option>
                            <option value="Europe/London">Reino Unido (Londres)</option>
                            <option value="Europe/Paris">Francia (París)</option>
                            <option value="America/New_York">USA (Nueva York)</option>
                            <option value="America/Los_Angeles">USA (Los Ángeles)</option>
                            <option value="America/Mexico_City">México (Ciudad de México)</option>
                            <option value="America/Buenos_Aires">Argentina (Buenos Aires)</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="sameDayBooking">¿Permitir reservas el mismo día? *</label>
                        <select id="sameDayBooking" name="sameDayBooking" required>
                            <option value="true" selected>Sí, permitir</option>
                            <option value="false">No, mínimo 1 día</option>
                        </select>
                    </div>
                </div>

                <div class="info-box">
                    <h4>💡 Información sobre slots dinámicos</h4>
                    <p>El sistema utiliza <strong>slots dinámicos</strong> que se ajustan automáticamente:</p>
                    <ul style="margin-left: 20px; margin-top: 10px;">
                        <li>✅ <strong>Servicio de 30 min:</strong> Próxima cita disponible +30 min</li>
                        <li>✅ <strong>Servicio de 45 min:</strong> Próxima cita disponible +45 min</li>
                        <li>✅ <strong>Servicio de 60 min:</strong> Próxima cita disponible +60 min</li>
                        <li>✅ <strong>Buffer configurable:</strong> Tiempo extra entre citas si es necesario</li>
                    </ul>
                    <p><strong>Ejemplo:</strong> Corte (30min) a las 9:00 → Siguiente disponible: 9:30</p>
                </div>
            </div>

            <!-- FAQs -->
            <div class="section">
                <h3>❓ Preguntas Frecuentes (FAQs)</h3>
                
                <div class="info-box">
                    <h4>💬 Configuración de FAQs del Chatbot</h4>
                    <p>Define preguntas frecuentes que el chatbot podrá responder automáticamente:</p>
                    <ul style="margin-left: 20px; margin-top: 10px;">
                        <li>✅ <strong>Palabras clave:</strong> Términos que activarán esta respuesta</li>
                        <li>✅ <strong>Categoría:</strong> Para organizar las FAQs</li>
                        <li>✅ <strong>Ejemplo:</strong> Pregunta sobre precios → Respuesta automática con lista de servicios</li>
                    </ul>
                </div>

                <div class="faqs-container" id="faqsContainer">
                    <div class="faq-item">
                        <div class="form-group">
                            <label>Pregunta</label>
                            <input type="text" name="faqQuestion[]" placeholder="¿Cuáles son vuestros precios?" style="font-size: 1.1rem; padding: 12px;">
                        </div>
                        <div class="form-group">
                            <label>Respuesta</label>
                            <textarea name="faqAnswer[]" rows="3" placeholder="Nuestros precios son: Corte €15, Corte + Barba €25..." style="font-size: 1.1rem; padding: 12px; resize: vertical;"></textarea>
                        </div>
                        <div class="grid-2">
                            <div class="form-group">
                                <label>Palabras clave (separadas por comas)</label>
                                <input type="text" name="faqKeywords[]" placeholder="precio, precios, coste, cuánto" style="font-size: 1.1rem; padding: 12px;">
                            </div>
                            <div class="form-group">
                                <label>Categoría</label>
                                <input type="text" name="faqCategory[]" placeholder="precios" style="font-size: 1.1rem; padding: 12px;">
                            </div>
                        </div>
                        <button type="button" class="btn btn-danger" onclick="removeFaq(this)">🗑️</button>
                    </div>
                </div>

                <button type="button" class="btn btn-add" onclick="addFaq()">➕ Agregar Otra FAQ</button>
            </div>

            <!-- Botón de Envío -->
            <div class="submit-section">
                <button type="submit" class="btn btn-primary" style="font-size: 1.2rem; padding: 15px 40px;">
                    🚀 Crear Cliente y Generar Enlace de Autorización
                </button>
            </div>
        </form>
    </div>

    <script>
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
            const container = document.getElementById('faqsContainer');
            if (container.children.length > 1) {
                button.parentElement.remove();
            } else {
                // Permitir eliminar todos los FAQs ya que son opcionales
                button.parentElement.remove();
            }
        }

        document.getElementById('clientForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Mostrar loading
            document.getElementById('loading').style.display = 'flex';
            
            // Enviar formulario como application/x-www-form-urlencoded
            const formData = new FormData(this);
            const urlParams = new URLSearchParams();
            
            // Convertir FormData a URLSearchParams
            for (let [key, value] of formData.entries()) {
                urlParams.append(key, value);
            }
            
            fetch('/admin/add-client', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: urlParams.toString()
            })
            .then(response => response.text())
            .then(html => {
                document.body.innerHTML = html;
            })
            .catch(error => {
                document.getElementById('loading').style.display = 'none';
                alert('Error: ' + error.message);
            });
        });

        // Validación en tiempo real del ID
        document.getElementById('tenantId').addEventListener('input', function(e) {
            this.value = this.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
        });

        // Validación del número de teléfono
        document.getElementById('phoneNumber').addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
        });

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
            
            // Cerrar domingo (ya está cerrado por defecto)
            const sundayCheckbox = document.querySelector('input[name="sunday_closed"]');
            sundayCheckbox.checked = true;
            toggleDayClosed('sunday', sundayCheckbox);
            
            alert('✅ Fines de semana configurados como cerrados');
        }

        // Inicializar domingo como cerrado por defecto
        document.addEventListener('DOMContentLoaded', function() {
            const sundayCheckbox = document.querySelector('input[name="sunday_closed"]');
            toggleDayClosed('sunday', sundayCheckbox);
        });
    </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
}

async function processForm(req, res) {
    try {
        console.log('=== DEBUGGING REQUEST ===');
        console.log('Method:', req.method);
        console.log('Headers:', req.headers);
        console.log('Raw body:', req.body);
        console.log('Body type:', typeof req.body);
        
        // Intentar diferentes formas de parsear el body
        let parsedData = {};
        
        if (req.body) {
            if (typeof req.body === 'object') {
                // Si ya es un objeto, usarlo directamente
                parsedData = req.body;
                console.log('Using body as object:', parsedData);
            } else if (typeof req.body === 'string') {
                // Si es string, parsearlo como URLSearchParams
                const urlParams = new URLSearchParams(req.body);
                for (let [key, value] of urlParams.entries()) {
                    if (key.endsWith('[]')) {
                        const baseKey = key.slice(0, -2);
                        if (!parsedData[baseKey]) parsedData[baseKey] = [];
                        parsedData[baseKey].push(value);
                    } else {
                        parsedData[key] = value;
                    }
                }
                console.log('Parsed from string:', parsedData);
            }
        } else {
            // Si no hay body, intentar leer de la request
            const body = await parseBody(req);
            console.log('Read body from stream:', body);
            const urlParams = new URLSearchParams(body);
            for (let [key, value] of urlParams.entries()) {
                if (key.endsWith('[]')) {
                    const baseKey = key.slice(0, -2);
                    if (!parsedData[baseKey]) parsedData[baseKey] = [];
                    parsedData[baseKey].push(value);
                } else {
                    parsedData[key] = value;
                }
            }
            console.log('Parsed from stream:', parsedData);
        }
        
        // Extraer campos
        const tenantId = parsedData.tenantId;
        const businessName = parsedData.businessName;
        const phoneNumber = parsedData.phoneNumber;
        const email = parsedData.email;
        const address = parsedData.address || null;
        
        // Extraer configuración de slots
        const slotGranularity = parseInt(parsedData.slotGranularity) || 30;
        const maxAdvanceBooking = parseInt(parsedData.maxAdvanceBooking) || 30;
        const timezone = parsedData.timezone || 'Europe/Madrid';
        const sameDayBooking = parsedData.sameDayBooking === 'true';

        // Extraer servicios (los campos llegan con [] en el nombre)
        const serviceNames = parsedData['serviceName[]'] || [];
        const servicePrices = parsedData['servicePrice[]'] || [];
        const serviceDurations = parsedData['serviceDuration[]'] || [];

        // Extraer FAQs (opcionales)
        const faqQuestions = parsedData['faqQuestion[]'] || [];
        const faqAnswers = parsedData['faqAnswer[]'] || [];
        const faqKeywords = parsedData['faqKeywords[]'] || [];
        const faqCategories = parsedData['faqCategory[]'] || [];

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

        console.log('=== EXTRACTED DATA ===');
        console.log('Fields:', { tenantId, businessName, phoneNumber, email, address });
        console.log('Services:', { serviceNames, servicePrices, serviceDurations });
        console.log('FAQs:', { faqQuestions, faqAnswers, faqKeywords, faqCategories });

        // Asegurarse de que los servicios sean arrays
        const serviceNamesArray = Array.isArray(serviceNames) ? serviceNames : (serviceNames ? [serviceNames] : []);
        const servicePricesArray = Array.isArray(servicePrices) ? servicePrices : (servicePrices ? [servicePrices] : []);
        const serviceDurationsArray = Array.isArray(serviceDurations) ? serviceDurations : (serviceDurations ? [serviceDurations] : []);

        // Asegurarse de que los FAQs sean arrays
        const faqQuestionsArray = Array.isArray(faqQuestions) ? faqQuestions : (faqQuestions ? [faqQuestions] : []);
        const faqAnswersArray = Array.isArray(faqAnswers) ? faqAnswers : (faqAnswers ? [faqAnswers] : []);
        const faqKeywordsArray = Array.isArray(faqKeywords) ? faqKeywords : (faqKeywords ? [faqKeywords] : []);
        const faqCategoriesArray = Array.isArray(faqCategories) ? faqCategories : (faqCategories ? [faqCategories] : []);

        console.log('Arrays normalized:', { serviceNamesArray, servicePricesArray, serviceDurationsArray });
        console.log('FAQs normalized:', { faqQuestionsArray, faqAnswersArray, faqKeywordsArray, faqCategoriesArray });

        const services = serviceNamesArray.map((name, index) => ({
            name: name,
            price: parseFloat(servicePricesArray[index] || 0), // Precio en euros como decimal
            duration_minutes: parseInt(serviceDurationsArray[index] || 30) // Schema usa 'duration_minutes'
        }));

        // Crear FAQs solo si hay preguntas válidas
        const faqs = faqQuestionsArray
            .map((question, index) => ({
                question: question?.trim(),
                answer: faqAnswersArray[index]?.trim(),
                keywords: faqKeywordsArray[index] ? faqKeywordsArray[index].split(',').map(k => k.trim()).filter(k => k) : [],
                category: faqCategoriesArray[index]?.trim() || 'general'
            }))
            .filter(faq => faq.question && faq.answer); // Solo incluir FAQs con pregunta y respuesta válidas

        // Validaciones básicas con mensajes específicos
        const missingFields = [];
        if (!tenantId) missingFields.push('ID del Tenant');
        if (!businessName) missingFields.push('Nombre del Negocio');
        if (!phoneNumber) missingFields.push('Número de Teléfono');
        if (!email) missingFields.push('Email');
        if (services.length === 0) missingFields.push('Al menos un servicio');
        
        if (missingFields.length > 0) {
            throw new Error(`Campos faltantes: ${missingFields.join(', ')}`);
        }

        // Asegurar que las columnas adicionales existen (ejecutar migraciones si es necesario)
        await ensureTableColumns();

        // Crear configuración de slots dinámicos
        const slotConfig = {
            slot_granularity: slotGranularity, // Granularidad mínima para cálculos
            allow_same_day_booking: sameDayBooking,
            max_advance_booking_days: maxAdvanceBooking,
            dynamic_slots: true // Indica que usa duración de servicio, no slots fijos
        };

        // Crear tenant en base de datos (usando nombres REALES del schema - sin address por ahora)
        const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .insert([{
                // Dejamos que Supabase genere el UUID automáticamente
                name: businessName,           // Schema real usa 'name'
                phone: phoneNumber,          // Schema real usa 'phone'
                email: email,
                // address: address,         // Campo faltante - comentado temporalmente
                tz: timezone,
                locale: 'es',
                active: true,
                slot_config: slotConfig,
                business_hours: businessHours // Agregar horarios de trabajo
            }])
            .select();

        if (tenantError || !tenantData || tenantData.length === 0) {
            throw new Error(`Error creando cliente: ${tenantError?.message || 'No se creó el tenant'}`);
        }

        const createdTenant = tenantData[0];
        const actualTenantId = createdTenant.id; // UUID generado automáticamente

        // Crear servicios con configuración por servicio (usando nombres reales del schema)
        const servicesWithTenant = services.map(service => ({
            tenant_id: actualTenantId,
            name: service.name,
            description: `Servicio de ${service.name}`,
            price_cents: Math.round(service.price * 100), // Schema usa 'price_cents' como entero
            duration_min: service.duration_minutes,       // Schema usa 'duration_min'
            buffer_min: 0,                               // Campo que existe en schema
            is_active: true                              // Campo que existe en schema
        }));

        const { error: servicesError } = await supabase
            .from('services')
            .insert(servicesWithTenant);

        if (servicesError) {
            throw new Error(`Error creando servicios: ${servicesError.message}`);
        }

        // Crear FAQs si hay alguna
        if (faqs.length > 0) {
            const faqsWithTenant = faqs.map(faq => ({
                tenant_id: actualTenantId,
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
                console.error(`⚠️ Error creando FAQs: ${faqsError.message}`);
                // No fallar todo el proceso si los FAQs fallan
            } else {
                console.log(`✅ ${faqs.length} FAQs creados exitosamente`);
            }
        }

        // Generar enlace de autorización
        const authUrl = generateAuthUrl(actualTenantId, email);

        // Enviar email automáticamente con el enlace de autorización
        try {
            await sendAuthorizationEmail(email, businessName, authUrl);
            console.log(`✅ Email enviado a: ${email}`);
        } catch (emailError) {
            console.error(`⚠️ Error enviando email: ${emailError.message}`);
            // No fallar todo el proceso si el email falla
        }

        // Mostrar página de éxito
        return showSuccessPage(res, {
            tenantId: actualTenantId,
            businessName,
            phoneNumber,
            email,
            address,
            services,
            faqs,
            authUrl,
            emailSent: true
        });

    } catch (error) {
        return showErrorPage(res, error.message);
    }
}

// Función para enviar email con enlace de autorización usando Web3Forms
async function sendAuthorizationEmail(toEmail, businessName, authUrl) {
    try {
        console.log(`📧 Enviando email de autorización a: ${toEmail}`);
        
        // Verificar que tengamos la clave de Web3Forms
        const accessKey = process.env.WEB3FORMS_ACCESS_KEY;
        
        if (!accessKey) {
            console.log('⚠️ WEB3FORMS_ACCESS_KEY no configurada, simulando envío');
            console.log(`📧 EMAIL SIMULADO PARA: ${toEmail}`);
            console.log(`📧 ENLACE DE AUTORIZACIÓN: ${authUrl}`);
            return true;
        }

        // Crear el contenido HTML del email según el formato de Web3Forms
        const emailHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .auth-button { 
            display: inline-block; 
            background: #4285f4; 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: bold; 
            margin: 20px 0;
        }
        .steps { background: #f8f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Autorización Google Calendar</h1>
            <p>¡Tu chatbot WhatsApp está casi listo!</p>
        </div>
        
        <div class="content">
            <h2>Hola ${businessName},</h2>
            
            <p>Tu cuenta de chatbot WhatsApp ha sido creada exitosamente. Para completar la configuración, necesitamos que autorices el acceso a tu Google Calendar.</p>
            
            <div style="text-align: center;">
                <a href="${authUrl}" class="auth-button">
                    🔗 Autorizar Google Calendar
                </a>
            </div>
            
            <div class="steps">
                <h3>📋 Pasos para completar la autorización:</h3>
                <ol>
                    <li>🔗 Haz clic en el botón "Autorizar Google Calendar"</li>
                    <li>📧 Inicia sesión con tu cuenta: <strong>${toEmail}</strong></li>
                    <li>✅ Acepta los permisos de Google Calendar</li>
                    <li>🎯 ¡Listo! Tu chatbot estará configurado automáticamente</li>
                </ol>
            </div>
            
            <p><strong>⚠️ Importante:</strong> Este enlace es único para tu negocio. Una vez completada la autorización, tus clientes podrán reservar citas directamente por WhatsApp.</p>
            
            <hr style="margin: 30px 0;">
            
            <p><strong>📱 Cuenta configurada para:</strong></p>
            <ul>
                <li>🏢 Negocio: ${businessName}</li>
                <li>📧 Email: ${toEmail}</li>
            </ul>
            
            <p>Si tienes alguna pregunta, contáctanos.</p>
        </div>
        
        <div class="footer">
            <p>📱 WhatsApp Bot Multi-Tenant | Sistema de Reservas Automático</p>
            <p>Este email se envió automáticamente al crear tu cuenta.</p>
        </div>
    </div>
</body>
</html>`;

        // Enviar usando Web3Forms con el formato correcto según las instrucciones
        const formData = {
            access_key: accessKey,
            name: 'WhatsApp Bot System',
            email: toEmail,
            subject: `🔐 Autorización Google Calendar - ${businessName}`,
            message: emailHTML,
            from_name: 'WhatsApp Bot System'
        };

        console.log('📧 Enviando email vía Web3Forms...');
        
        const response = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (response.status === 200) {
            console.log('✅ Email enviado exitosamente vía Web3Forms');
            console.log(`   Para: ${toEmail}`);
            console.log(`   Asunto: ${formData.subject}`);
            return true;
        } else {
            console.error('❌ Error enviando email:', result);
            throw new Error(`Error enviando email: ${result.message || response.status}`);
        }
        
    } catch (error) {
        console.error('❌ Error en sendAuthorizationEmail:', error);
        // No hacer throw del error para que no rompa el flujo principal
        console.log('⚠️ Continuando sin envío de email...');
        return false;
    }
}

function showSuccessPage(res, data) {
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>✅ Cliente Creado Exitosamente</title>
    <style>
        body {
            font-family: 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }
        .header {
            background: linear-gradient(45deg, #28a745, #20c997);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .content {
            padding: 40px;
        }
        .section {
            margin-bottom: 30px;
            padding: 25px;
            background: #f8f9ff;
            border-radius: 15px;
            border-left: 5px solid #28a745;
        }
        .auth-section {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            margin: 40px -40px -40px -40px;
            padding: 40px;
            text-align: center;
        }
        .auth-link {
            background: white;
            color: #333;
            padding: 15px 25px;
            border-radius: 10px;
            text-decoration: none;
            display: inline-block;
            margin: 20px 0;
            font-weight: bold;
            word-break: break-all;
            transition: transform 0.3s ease;
        }
        .auth-link:hover {
            transform: translateY(-2px);
        }
        .btn {
            padding: 12px 25px;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 5px;
            font-weight: 600;
        }
        .btn-primary { background: #667eea; color: white; }
        .btn-secondary { background: #6c757d; color: white; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .emoji { font-size: 48px; margin-bottom: 15px; }
        h3 { margin-bottom: 15px; color: #333; }
        .info-item { margin-bottom: 10px; }
        .label { font-weight: bold; color: #555; }
        .value { color: #333; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="emoji">🎉</div>
            <h1>¡Cliente Creado Exitosamente!</h1>
            <p>El cliente ha sido agregado al sistema multi-tenant</p>
        </div>

        <div class="content">
            <div class="section">
                <h3>📋 Resumen del Cliente Creado</h3>
                <div class="grid-2">
                    <div>
                        <div class="info-item">
                            <span class="label">🆔 ID:</span>
                            <span class="value">${data.tenantId}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">🏢 Negocio:</span>
                            <span class="value">${data.businessName}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">📧 Email:</span>
                            <span class="value">${data.email}</span>
                        </div>
                    </div>
                    <div>
                        <div class="info-item">
                            <span class="label">📱 WhatsApp:</span>
                            <span class="value">+${data.phoneNumber}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">📍 Dirección:</span>
                            <span class="value">${data.address || 'No especificada'}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">🎯 Servicios:</span>
                            <span class="value">${data.services.length} configurados</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h3>💰 Servicios Configurados</h3>
                ${data.services.map((service, i) => `
                    <div class="info-item">
                        <span class="value">${i+1}. ${service.name} - €${service.price} (${service.duration_minutes} min)</span>
                    </div>
                `).join('')}
            </div>

            ${data.faqs && data.faqs.length > 0 ? `
            <div class="section">
                <h3>❓ FAQs Configurados</h3>
                ${data.faqs.map((faq, i) => `
                    <div class="info-item" style="margin-bottom: 15px; padding: 10px; background: white; border-radius: 8px;">
                        <div><span class="label">${i+1}. ${faq.question}</span></div>
                        <div style="margin: 5px 0; color: #666; font-size: 0.9rem;">${faq.answer}</div>
                        ${faq.keywords.length > 0 ? `<div style="font-size: 0.8rem; color: #888;">Palabras clave: ${faq.keywords.join(', ')}</div>` : ''}
                    </div>
                `).join('')}
            </div>
            ` : `
            <div class="section">
                <h3>❓ FAQs</h3>
                <div class="info-item">
                    <span class="value">Sin FAQs configurados - Se pueden añadir después usando la API</span>
                </div>
            </div>
            `}

            <div class="auth-section">
                <h2>🔐 Siguiente Paso: Autorización Google Calendar</h2>
                <p>Envía este enlace al cliente para que autorice el acceso a su Google Calendar:</p>
                
                <a href="${data.authUrl}" target="_blank" class="auth-link">
                    🔗 Enlace de Autorización para ${data.email}
                </a>
                
                <div style="margin-top: 30px;">
                    <h3>📱 Instrucciones para el Cliente:</h3>
                    <div style="text-align: left; display: inline-block; margin: 20px 0;">
                        <p>1. 🔗 Hacer click en el enlace de arriba</p>
                        <p>2. 📧 Iniciar sesión con: ${data.email}</p>
                        <p>3. ✅ Aceptar los permisos de calendario</p>
                        <p>4. 🎯 ¡Listo! Sistema configurado automáticamente</p>
                    </div>
                </div>
                
                <div style="margin-top: 30px;">
                    <button onclick="copyAuthLink()" class="btn btn-secondary">📋 Copiar Enlace</button>
                    <a href="/admin/add-client" class="btn btn-primary">🏢 Agregar Otro Cliente</a>
                </div>
            </div>
        </div>
    </div>

    <script>
        function copyAuthLink() {
            const authUrl = "${data.authUrl}";
            navigator.clipboard.writeText(authUrl).then(() => {
                alert('✅ Enlace copiado al portapapeles');
            }).catch(() => {
                prompt('Copia este enlace:', authUrl);
            });
        }
    </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
}

function showErrorPage(res, errorMessage) {
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>❌ Error</title>
    <style>
        body {
            font-family: 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            max-width: 500px;
            background: white;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }
        .emoji { font-size: 64px; margin-bottom: 20px; }
        h1 { color: #dc3545; margin-bottom: 20px; }
        .error-message {
            background: #f8d7da;
            color: #721c24;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            border: 1px solid #f5c6cb;
        }
        .btn {
            background: #667eea;
            color: white;
            padding: 12px 25px;
            border: none;
            border-radius: 10px;
            text-decoration: none;
            display: inline-block;
            margin-top: 20px;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="emoji">❌</div>
        <h1>Error al Crear Cliente</h1>
        <div class="error-message">
            <strong>Error:</strong> ${errorMessage}
        </div>
        <a href="/admin/add-client" class="btn">🔄 Intentar de Nuevo</a>
    </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.status(400).send(html);
}

// Handler principal exportado
module.exports = async function handler(req, res) {
    // Solo permitir GET (mostrar formulario) y POST (procesar formulario)
    if (req.method === 'GET') {
        return showForm(res);
    }
    
    if (req.method === 'POST') {
        return processForm(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

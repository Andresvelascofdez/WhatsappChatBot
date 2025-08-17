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
const REDIRECT_URI = process.env.VERCEL_URL ? 
    `https://${process.env.VERCEL_URL}/api/oauth/google/callback` : 
    'https://whatsapp-chat-bot-xi.vercel.app/api/oauth/google/callback';

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

        console.log('=== EXTRACTED DATA ===');
        console.log('Fields:', { tenantId, businessName, phoneNumber, email, address });
        console.log('Services:', { serviceNames, servicePrices, serviceDurations });

        // Asegurarse de que los servicios sean arrays
        const serviceNamesArray = Array.isArray(serviceNames) ? serviceNames : (serviceNames ? [serviceNames] : []);
        const servicePricesArray = Array.isArray(servicePrices) ? servicePrices : (servicePrices ? [servicePrices] : []);
        const serviceDurationsArray = Array.isArray(serviceDurations) ? serviceDurations : (serviceDurations ? [serviceDurations] : []);

        console.log('Arrays normalized:', { serviceNamesArray, servicePricesArray, serviceDurationsArray });

        const services = serviceNamesArray.map((name, index) => ({
            name: name,
            price_cents: Math.round(parseFloat(servicePricesArray[index] || 0) * 100),
            duration_min: parseInt(serviceDurationsArray[index] || 30),
            slot_granularity_min: slotGranularity, // Granularidad mínima para cálculos
            buffer_min: 0, // Sin buffer por defecto
            is_active: true
        }));

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

        // Crear tenant en base de datos (ajustado a schema real)
        const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .insert([{
                id: tenantId,
                name: businessName,
                phone_masked: phoneNumber,
                tz: timezone,
                locale: 'es',
                active: true,
                email: email,
                slot_config: slotConfig
            }])
            .select();

        if (tenantError) {
            throw new Error(`Error creando cliente: ${tenantError.message}`);
        }

        // Crear servicios con configuración por servicio
        const servicesWithTenant = services.map(service => ({
            tenant_id: tenantId,
            name: service.name,
            duration_min: service.duration_min,
            price_cents: service.price_cents,
            slot_granularity_min: slotGranularity, // Usar la configuración global por defecto
            buffer_min: 0, // Sin buffer por defecto
            is_active: true
        }));

        const { error: servicesError } = await supabase
            .from('services')
            .insert(servicesWithTenant);

        if (servicesError) {
            throw new Error(`Error creando servicios: ${servicesError.message}`);
        }

        // Generar enlace de autorización
        const authUrl = generateAuthUrl(tenantId, email);

        // Mostrar página de éxito
        return showSuccessPage(res, {
            tenantId,
            businessName,
            phoneNumber,
            email,
            address,
            services,
            authUrl
        });

    } catch (error) {
        return showErrorPage(res, error.message);
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

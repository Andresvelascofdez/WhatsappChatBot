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
                    <h4>💡 Configuración de Servicios</h4>
                    <p>Agrega todos los servicios que ofrece el negocio. Puedes agregar más servicios después desde la base de datos.</p>
                </div>

                <div class="services-container" id="servicesContainer">
                    <div class="service-item">
                        <div class="form-group">
                            <label>Nombre del Servicio *</label>
                            <input type="text" name="serviceName[]" required placeholder="ej: Corte Clásico">
                        </div>
                        <div class="form-group">
                            <label>Precio (€) *</label>
                            <input type="number" name="servicePrice[]" required step="0.01" min="0" placeholder="25.00">
                        </div>
                        <div class="form-group">
                            <label>Duración (min) *</label>
                            <input type="number" name="serviceDuration[]" required min="5" max="480" placeholder="30">
                        </div>
                        <button type="button" class="btn btn-danger" onclick="removeService(this)">🗑️</button>
                    </div>
                </div>

                <button type="button" class="btn btn-add" onclick="addService()">➕ Agregar Otro Servicio</button>
            </div>

            <!-- Configuración Automática -->
            <div class="section">
                <h3>⚙️ Configuración Automática</h3>
                
                <div class="info-box">
                    <h4>🚀 Lo que se configurará automáticamente:</h4>
                    <ul style="margin-left: 20px; margin-top: 10px;">
                        <li>✅ Horarios de negocio: Lun-Vie 9:00-18:00, Sáb 9:00-14:00</li>
                        <li>✅ Slots de 30 minutos</li>
                        <li>✅ Reservas hasta 30 días de anticipación</li>
                        <li>✅ Mínimo 2 horas de anticipación</li>
                        <li>✅ Enlace de autorización Google Calendar</li>
                    </ul>
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
                    <input type="text" name="serviceName[]" required placeholder="ej: Corte + Barba">
                </div>
                <div class="form-group">
                    <label>Precio (€) *</label>
                    <input type="number" name="servicePrice[]" required step="0.01" min="0" placeholder="35.00">
                </div>
                <div class="form-group">
                    <label>Duración (min) *</label>
                    <input type="number" name="serviceDuration[]" required min="5" max="480" placeholder="45">
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
            
            // Enviar formulario
            const formData = new FormData(this);
            
            fetch('/admin/add-client', {
                method: 'POST',
                body: formData
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
        // Parsear datos del formulario
        const formData = new URLSearchParams(req.body);
        
        const tenantId = formData.get('tenantId');
        const businessName = formData.get('businessName');
        const phoneNumber = formData.get('phoneNumber');
        const email = formData.get('email');
        const address = formData.get('address') || null;

        // Parsear servicios
        const serviceNames = formData.getAll('serviceName[]');
        const servicePrices = formData.getAll('servicePrice[]');
        const serviceDurations = formData.getAll('serviceDuration[]');

        const services = serviceNames.map((name, index) => ({
            name: name,
            price: parseFloat(servicePrices[index]),
            duration_minutes: parseInt(serviceDurations[index])
        }));

        // Validaciones básicas
        if (!tenantId || !businessName || !phoneNumber || !email || services.length === 0) {
            throw new Error('Todos los campos obligatorios deben estar completos');
        }

        // Crear tenant en base de datos
        const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .insert([{
                id: tenantId,
                business_name: businessName,
                phone_number: phoneNumber,
                email: email,
                address: address,
                business_hours: {
                    monday: { open: "09:00", close: "18:00", closed: false },
                    tuesday: { open: "09:00", close: "18:00", closed: false },
                    wednesday: { open: "09:00", close: "18:00", closed: false },
                    thursday: { open: "09:00", close: "18:00", closed: false },
                    friday: { open: "09:00", close: "18:00", closed: false },
                    saturday: { open: "09:00", close: "14:00", closed: false },
                    sunday: { open: "09:00", close: "14:00", closed: true }
                },
                slot_config: {
                    slot_duration_minutes: 30,
                    booking_advance_days: 30,
                    booking_advance_hours: 2
                }
            }])
            .select();

        if (tenantError) {
            throw new Error(`Error creando cliente: ${tenantError.message}`);
        }

        // Crear servicios
        const servicesWithTenant = services.map(service => ({
            ...service,
            tenant_id: tenantId
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

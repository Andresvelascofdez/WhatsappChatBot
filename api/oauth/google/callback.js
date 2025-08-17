/**
 * 🔄 API ENDPOINT: Google OAuth Callback
 * 
 * Este endpoint recibe la autorización de Google Calendar
 * y actualiza automáticamente la base de datos del cliente
 * 
 * URL: /api/oauth/google/callback
 */

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Configuración de Google OAuth2
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.VERCEL_URL ? 
    `https://${process.env.VERCEL_URL}/api/oauth/google/callback` : 
    'https://tu-app.vercel.app/api/oauth/google/callback';

export default async function handler(req, res) {
    console.log('🔄 Google OAuth Callback recibido');

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { code, state, error } = req.query;

    // Manejar errores de autorización
    if (error) {
        console.error('❌ Error en autorización:', error);
        return res.status(400).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Error de Autorización</title>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                    .error { color: #d32f2f; background: #ffebee; padding: 20px; border-radius: 8px; }
                </style>
            </head>
            <body>
                <div class="error">
                    <h2>❌ Error de Autorización</h2>
                    <p>Hubo un problema al autorizar el acceso a Google Calendar.</p>
                    <p><strong>Error:</strong> ${error}</p>
                    <p>Por favor, contacta con soporte técnico.</p>
                </div>
            </body>
            </html>
        `);
    }

    // Verificar que tenemos el código de autorización
    if (!code) {
        return res.status(400).json({ error: 'Missing authorization code' });
    }

    try {
        // Decodificar el state para obtener tenant_id y email
        let tenantData;
        try {
            tenantData = JSON.parse(state);
        } catch (e) {
            throw new Error('Invalid state parameter');
        }

        const { tenantId, email } = tenantData;

        console.log(`🔐 Procesando autorización para tenant: ${tenantId}, email: ${email}`);

        // Intercambiar código por tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: REDIRECT_URI
            })
        });

        if (!tokenResponse.ok) {
            throw new Error(`Token exchange failed: ${tokenResponse.status}`);
        }

        const tokens = await tokenResponse.json();

        console.log('✅ Tokens obtenidos de Google');

        // Calcular fecha de expiración
        const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000)).toISOString();

        // Preparar configuración del calendario
        const calendarConfig = {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            calendar_id: 'primary',
            expires_at: expiresAt,
            authorized_email: email,
            authorized_at: new Date().toISOString()
        };

        // Actualizar base de datos
        const { data, error: updateError } = await supabase
            .from('tenants')
            .update({ 
                calendar_config: calendarConfig,
                email: email // Actualizar también el email si cambió
            })
            .eq('id', tenantId)
            .select();

        if (updateError) {
            throw new Error(`Database update failed: ${updateError.message}`);
        }

        if (!data || data.length === 0) {
            throw new Error(`Tenant not found: ${tenantId}`);
        }

        console.log(`✅ Base de datos actualizada para tenant: ${tenantId}`);

        // Verificar que la integración funciona haciendo una prueba
        try {
            const testResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary`, {
                headers: {
                    'Authorization': `Bearer ${tokens.access_token}`
                }
            });

            if (testResponse.ok) {
                console.log('✅ Verificación de acceso a Google Calendar exitosa');
            }
        } catch (testError) {
            console.warn('⚠️ Advertencia: No se pudo verificar el acceso al calendario');
        }

        // Página de éxito
        res.status(200).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>✅ Autorización Exitosa</title>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        max-width: 600px; 
                        margin: 50px auto; 
                        padding: 20px; 
                        text-align: center;
                    }
                    .success { 
                        color: #2e7d32; 
                        background: #e8f5e8; 
                        padding: 30px; 
                        border-radius: 12px; 
                        margin-bottom: 20px;
                    }
                    .info { 
                        background: #f5f5f5; 
                        padding: 20px; 
                        border-radius: 8px; 
                        text-align: left;
                    }
                    .emoji { font-size: 48px; margin-bottom: 10px; }
                    h1 { margin: 0 0 15px 0; }
                    p { margin: 10px 0; }
                    .highlight { background: #fff3cd; padding: 2px 6px; border-radius: 4px; }
                </style>
            </head>
            <body>
                <div class="success">
                    <div class="emoji">🎉</div>
                    <h1>¡Autorización Exitosa!</h1>
                    <p>Tu Google Calendar ha sido conectado correctamente con el sistema de reservas.</p>
                </div>
                
                <div class="info">
                    <h3>📋 Detalles de la Configuración:</h3>
                    <p><strong>🏢 Negocio:</strong> <span class="highlight">${tenantId}</span></p>
                    <p><strong>📧 Email autorizado:</strong> <span class="highlight">${email}</span></p>
                    <p><strong>📅 Calendario:</strong> <span class="highlight">Calendario principal</span></p>
                    <p><strong>⏰ Configurado el:</strong> <span class="highlight">${new Date().toLocaleString('es-ES')}</span></p>
                </div>
                
                <div class="info">
                    <h3>✅ ¿Qué puedes hacer ahora?</h3>
                    <p>• Las reservas de WhatsApp se crearán automáticamente en tu Google Calendar</p>
                    <p>• Los horarios disponibles se calcularán en base a tu calendario existente</p>
                    <p>• Recibirás notificaciones de Google para cada nueva cita</p>
                    <p>• Puedes editar o cancelar citas directamente desde Google Calendar</p>
                </div>
                
                <div style="margin-top: 30px; padding: 15px; background: #e3f2fd; border-radius: 8px;">
                    <p><strong>🚀 ¡Tu sistema de reservas está listo!</strong></p>
                    <p>Ya puedes recibir reservas por WhatsApp y se sincronizarán automáticamente.</p>
                </div>
                
                <script>
                    // Auto-cerrar ventana después de 10 segundos si es un popup
                    if (window.opener) {
                        setTimeout(() => {
                            window.close();
                        }, 10000);
                    }
                </script>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('❌ Error procesando callback:', error);

        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>❌ Error de Configuración</title>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                    .error { color: #d32f2f; background: #ffebee; padding: 20px; border-radius: 8px; }
                </style>
            </head>
            <body>
                <div class="error">
                    <h2>❌ Error de Configuración</h2>
                    <p>Hubo un problema al configurar tu Google Calendar.</p>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <p>Por favor, contacta con soporte técnico con los siguientes detalles:</p>
                    <ul>
                        <li>Fecha: ${new Date().toISOString()}</li>
                        <li>Tenant: ${req.query.state || 'No disponible'}</li>
                    </ul>
                </div>
            </body>
            </html>
        `);
    }
}

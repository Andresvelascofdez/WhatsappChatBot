/**
 * 🔍 ENDPOINT DE DIAGNÓSTICO: Verificar configuración OAuth2
 * 
 * URL: /api/admin/debug-oauth
 */

const { requireAuth } = require('./auth-middleware');

async function handler(req, res) {
    const diagnosis = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        variables: {
            GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 
                `✅ Configurado: ${process.env.GOOGLE_CLIENT_ID.substring(0, 10)}...` : 
                '❌ No configurado',
            GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 
                `✅ Configurado: ${process.env.GOOGLE_CLIENT_SECRET.substring(0, 10)}...` : 
                '❌ No configurado',
            VERCEL_URL: process.env.VERCEL_URL ? 
                `✅ ${process.env.VERCEL_URL}` : 
                '❌ No configurado',
            SUPABASE_URL: process.env.SUPABASE_URL ? 
                `✅ Configurado` : 
                '❌ No configurado'
        },
        redirectUri: process.env.VERCEL_URL ? 
            `https://${process.env.VERCEL_URL}/api/oauth/google/callback` : 
            'https://whatsapp-chat-bot-xi.vercel.app/api/oauth/google/callback',
        testAuthUrl: null
    };

    // Generar URL de prueba si las credenciales están configuradas
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        const testParams = new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID,
            redirect_uri: diagnosis.redirectUri,
            response_type: 'code',
            scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
            access_type: 'offline',
            prompt: 'consent',
            state: JSON.stringify({ tenantId: 'test', email: 'test@example.com' })
        });
        diagnosis.testAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${testParams.toString()}`;
    }

    // Respuesta HTML para mejor visualización
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>🔍 Diagnóstico OAuth2</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 20px auto; padding: 20px; }
        .ok { color: #2e7d32; }
        .error { color: #d32f2f; }
        .warning { color: #f57c00; }
        .section { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 8px; }
        .url { word-break: break-all; background: #e3f2fd; padding: 10px; border-radius: 4px; }
        pre { background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>🔍 Diagnóstico de Configuración OAuth2</h1>
    
    <div class="section">
        <h2>📋 Variables de Entorno</h2>
        <ul>
            <li><strong>GOOGLE_CLIENT_ID:</strong> <span class="${process.env.GOOGLE_CLIENT_ID ? 'ok' : 'error'}">${diagnosis.variables.GOOGLE_CLIENT_ID}</span></li>
            <li><strong>GOOGLE_CLIENT_SECRET:</strong> <span class="${process.env.GOOGLE_CLIENT_SECRET ? 'ok' : 'error'}">${diagnosis.variables.GOOGLE_CLIENT_SECRET}</span></li>
            <li><strong>VERCEL_URL:</strong> <span class="${process.env.VERCEL_URL ? 'ok' : 'error'}">${diagnosis.variables.VERCEL_URL}</span></li>
            <li><strong>SUPABASE_URL:</strong> <span class="${process.env.SUPABASE_URL ? 'ok' : 'error'}">${diagnosis.variables.SUPABASE_URL}</span></li>
        </ul>
    </div>

    <div class="section">
        <h2>🔗 URI de Redirección Configurada</h2>
        <div class="url">${diagnosis.redirectUri}</div>
        <p><strong>⚠️ Importante:</strong> Esta URI debe estar exactamente configurada en Google Cloud Console</p>
    </div>

    ${diagnosis.testAuthUrl ? `
    <div class="section">
        <h2>🧪 URL de Prueba</h2>
        <p>Esta URL debería funcionar si todo está bien configurado:</p>
        <div class="url">
            <a href="${diagnosis.testAuthUrl}" target="_blank">🔗 Probar Autorización</a>
        </div>
    </div>
    ` : `
    <div class="section">
        <h2 class="error">❌ No se puede generar URL de prueba</h2>
        <p>Faltan credenciales de Google</p>
    </div>
    `}

    <div class="section">
        <h2>📱 Siguiente Pasos</h2>
        <ol>
            <li>Verificar que todas las variables estén configuradas en Vercel</li>
            <li>Confirmar URI de redirección en Google Cloud Console</li>
            <li>Probar la URL de autorización</li>
        </ol>
    </div>

    <div class="section">
        <h2>🔧 Detalles Técnicos</h2>
        <pre>${JSON.stringify(diagnosis, null, 2)}</pre>
    </div>

    <p><a href="/admin/add-client">🔙 Volver al formulario</a></p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
}

module.exports = requireAuth(handler);;

#!/usr/bin/env node

/**
 * 🔐 SCRIPT PARA AUTORIZAR GOOGLE CALENDAR DE NUEVOS CLIENTES
 * 
 * Uso:
 * node scripts/authorize-client-calendar.js TENANT_ID EMAIL
 * 
 * Ejemplo:
 * node scripts/authorize-client-calendar.js barberia_madrid info@barberia.com
 */

const readline = require('readline');

// Configuración de Google OAuth2
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'TU_CLIENT_ID_AQUI';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'TU_CLIENT_SECRET_AQUI';
const REDIRECT_URI = process.env.VERCEL_URL ? 
    `https://${process.env.VERCEL_URL}/api/oauth/google/callback` : 
    'https://tu-app.vercel.app/api/oauth/google/callback';

const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
];

function generateAuthUrl(tenantId, email) {
    const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: SCOPES.join(' '),
        access_type: 'offline',
        prompt: 'consent',
        state: JSON.stringify({ tenantId, email }) // Incluimos tenant_id y email en el state
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length !== 2) {
        console.error('❌ Uso: node authorize-client-calendar.js TENANT_ID EMAIL');
        console.error('📝 Ejemplo: node authorize-client-calendar.js barberia_madrid info@barberia.com');
        process.exit(1);
    }

    const [tenantId, email] = args;

    console.log('🔐 AUTORIZACIÓN DE GOOGLE CALENDAR');
    console.log('=====================================');
    console.log(`👤 Cliente: ${tenantId}`);
    console.log(`📧 Email: ${email}`);
    console.log('');

    // Verificar configuración
    if (GOOGLE_CLIENT_ID === 'TU_CLIENT_ID_AQUI') {
        console.error('❌ Error: Configura GOOGLE_CLIENT_ID en las variables de entorno');
        console.error('💡 Ejecuta: export GOOGLE_CLIENT_ID="tu-client-id-real"');
        process.exit(1);
    }

    if (GOOGLE_CLIENT_SECRET === 'TU_CLIENT_SECRET_AQUI') {
        console.error('❌ Error: Configura GOOGLE_CLIENT_SECRET en las variables de entorno');
        console.error('💡 Ejecuta: export GOOGLE_CLIENT_SECRET="tu-client-secret-real"');
        process.exit(1);
    }

    // Generar URL de autorización
    const authUrl = generateAuthUrl(tenantId, email);

    console.log('🔗 ENLACE DE AUTORIZACIÓN GENERADO:');
    console.log('=====================================');
    console.log(authUrl);
    console.log('');
    console.log('📱 INSTRUCCIONES PARA EL CLIENTE:');
    console.log('1. Copia y pega el enlace de arriba en tu navegador');
    console.log('2. Inicia sesión con tu cuenta de Gmail: ' + email);
    console.log('3. Acepta los permisos para gestionar tu calendario');
    console.log('4. ¡Listo! Tu calendario se configurará automáticamente');
    console.log('');
    console.log('⚡ ALTERNATIVA AUTOMÁTICA:');
    console.log('También puedes enviar este enlace por WhatsApp o email al cliente');
    console.log('');

    // Preguntar si queremos abrir el navegador automáticamente
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('🌐 ¿Abrir automáticamente en el navegador? (y/n): ', (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            const { exec } = require('child_process');
            
            // Detectar sistema operativo y abrir navegador
            const command = process.platform === 'win32' ? 'start' :
                          process.platform === 'darwin' ? 'open' : 'xdg-open';
            
            exec(`${command} "${authUrl}"`, (error) => {
                if (error) {
                    console.error('❌ Error abriendo navegador:', error.message);
                } else {
                    console.log('✅ Navegador abierto con el enlace de autorización');
                }
                rl.close();
            });
        } else {
            console.log('👍 Enlace generado. Envíalo al cliente para que autorice el acceso.');
            rl.close();
        }
    });
}

// Ejecutar script si se llama directamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { generateAuthUrl };

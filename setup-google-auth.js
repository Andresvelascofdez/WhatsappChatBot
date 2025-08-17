// Script para obtener tokens de Google Calendar OAuth2
// Ejecutar: node setup-google-auth.js

const http = require('http');
const url = require('url');
const { exec } = require('child_process');

// CONFIGURA ESTAS VARIABLES CON TUS CREDENCIALES DE GOOGLE CLOUD
const CLIENT_ID = 'TU_CLIENT_ID_AQUI';
const CLIENT_SECRET = 'TU_CLIENT_SECRET_AQUI';
const REDIRECT_URI = 'http://localhost:3000/auth/callback';

if (CLIENT_ID === 'TU_CLIENT_ID_AQUI' || CLIENT_SECRET === 'TU_CLIENT_SECRET_AQUI') {
  console.log('❌ ERROR: Configura CLIENT_ID y CLIENT_SECRET en este archivo primero');
  console.log('📝 Los obtienes de Google Cloud Console > APIs & Services > Credentials');
  process.exit(1);
}

// Construir URL de autorización manualmente (sin googleapis)
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${CLIENT_ID}&` +
  `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
  `response_type=code&` +
  `scope=${encodeURIComponent('https://www.googleapis.com/auth/calendar')}&` +
  `access_type=offline&` +
  `prompt=consent`;

console.log('🚀 PASO 1: Abre esta URL en tu navegador para autorizar:');
console.log('\n' + authUrl + '\n');

// Abrir automáticamente en el navegador (Windows)
exec(`start "" "${authUrl}"`, (error) => {
  if (error) {
    console.log('💡 Si no se abre automáticamente, copia y pega la URL de arriba');
  }
});

console.log('⏳ Esperando autorización en http://localhost:3000...\n');

// Servidor temporal para capturar el callback
const server = http.createServer(async (req, res) => {
  const queryObject = url.parse(req.url, true).query;
  
  if (queryObject.code) {
    try {
      console.log('✅ Código de autorización recibido');
      
      // Intercambiar código por tokens usando fetch
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code: queryObject.code,
          grant_type: 'authorization_code',
          redirect_uri: REDIRECT_URI,
        }),
      });
      
      const tokens = await tokenResponse.json();
      
      if (tokens.access_token && tokens.refresh_token) {
        console.log('\n🎉 ¡Tokens obtenidos exitosamente!');
        console.log('\n📋 COPIA ESTOS VALORES PARA TU BASE DE DATOS:');
        console.log('='.repeat(50));
        console.log('Access Token:', tokens.access_token);
        console.log('Refresh Token:', tokens.refresh_token);
        console.log('='.repeat(50));
        
        console.log('\n📝 SIGUIENTE PASO:');
        console.log('Ve a Supabase > SQL Editor y ejecuta:');
        console.log(`
UPDATE tenants 
SET calendar_config = '{
    "access_token": "${tokens.access_token}",
    "refresh_token": "${tokens.refresh_token}",
    "calendar_id": "primary",
    "expires_at": "2025-12-31T23:59:59Z"
}'::jsonb
WHERE id = 'default';
        `);
        
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.write(`
          <html>
            <head><title>✅ Autorización Exitosa</title></head>
            <body style="font-family: Arial; padding: 20px;">
              <h1>✅ ¡Autorización Exitosa!</h1>
              <p>Los tokens han sido obtenidos. <strong>Revisa la consola</strong> para copiar los valores.</p>
              <p>Ya puedes cerrar esta ventana.</p>
            </body>
          </html>
        `);
        res.end();
      } else {
        throw new Error('No se recibieron tokens válidos: ' + JSON.stringify(tokens));
      }
      
      server.close();
    } catch (error) {
      console.error('❌ Error obteniendo tokens:', error);
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.write(`
        <html>
          <head><title>❌ Error</title></head>
          <body style="font-family: Arial; padding: 20px;">
            <h1>❌ Error en la autorización</h1>
            <p>Revisa la consola para más detalles.</p>
          </body>
        </html>
      `);
      res.end();
    }
  } else if (queryObject.error) {
    console.error('❌ Error de autorización:', queryObject.error);
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
    res.write(`
      <html>
        <head><title>❌ Error</title></head>
        <body style="font-family: Arial; padding: 20px;">
          <h1>❌ Error: ${queryObject.error}</h1>
          <p>La autorización fue rechazada o falló.</p>
        </body>
      </html>
    `);
    res.end();
  }
});

server.listen(3000, () => {
  console.log('🖥️  Servidor temporal ejecutándose en http://localhost:3000');
  console.log('📱 Una vez autorizado, volverás aquí automáticamente');
});

// Manejar cierre del servidor
process.on('SIGINT', () => {
  console.log('\n👋 Cerrando servidor...');
  server.close();
  process.exit(0);
});

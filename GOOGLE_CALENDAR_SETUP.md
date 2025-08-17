# 📅 Configuración de Google Calendar Integration

## 🚀 Pasos para Configurar Google Calendar

### 1. Crear Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Google Calendar API**:
   - Ve a "APIs & Services" > "Library"
   - Busca "Google Calendar API"
   - Haz clic en "Enable"

### 2. Configurar OAuth2 Credentials

1. Ve a "APIs & Services" > "Credentials"
2. Haz clic en "Create Credentials" > "OAuth client ID"
3. Selecciona "Web application"
4. Configura:
   - **Name**: "WhatsApp Booking Bot"
   - **Authorized redirect URIs**: `http://localhost:3000/auth/google/callback`
5. Guarda el **Client ID** y **Client Secret**

### 3. Obtener Access Token y Refresh Token

#### Opción A: Usando Google OAuth2 Playground

1. Ve a [OAuth2 Playground](https://developers.google.com/oauthplayground/)
2. En la configuración (⚙️), marca "Use your own OAuth credentials"
3. Ingresa tu Client ID y Client Secret
4. En "Step 1", busca "Google Calendar API v3"
5. Selecciona `https://www.googleapis.com/auth/calendar`
6. Haz clic en "Authorize APIs"
7. Autoriza el acceso
8. En "Step 2", haz clic en "Exchange authorization code for tokens"
9. Copia el **access_token** y **refresh_token**

#### Opción B: Script de Node.js (Recomendado)

```javascript
// setup-google-auth.js
const { google } = require('googleapis');
const http = require('http');
const url = require('url');

const CLIENT_ID = 'tu-client-id';
const CLIENT_SECRET = 'tu-client-secret';
const REDIRECT_URI = 'http://localhost:3000/auth/callback';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Generar URL de autorización
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/calendar'],
  prompt: 'consent'
});

console.log('Ve a esta URL para autorizar la aplicación:');
console.log(authUrl);

// Servidor temporal para capturar el callback
const server = http.createServer(async (req, res) => {
  const queryObject = url.parse(req.url, true).query;
  
  if (queryObject.code) {
    try {
      const { tokens } = await oauth2Client.getAccessToken(queryObject.code);
      
      console.log('\\n✅ Tokens obtenidos:');
      console.log('Access Token:', tokens.access_token);
      console.log('Refresh Token:', tokens.refresh_token);
      console.log('\\n📋 Actualiza tu base de datos con estos valores');
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write('<h1>✅ Autorización exitosa</h1><p>Revisa la consola para los tokens.</p>');
      res.end();
      
      server.close();
    } catch (error) {
      console.error('Error obteniendo tokens:', error);
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.write('<h1>❌ Error</h1>');
      res.end();
    }
  }
});

server.listen(3000, () => {
  console.log('Servidor temporal ejecutándose en http://localhost:3000');
});
```

### 4. Configurar en Base de Datos

Una vez que tengas los tokens, ejecuta este SQL:

```sql
-- Actualizar configuración de Google Calendar para el tenant
UPDATE tenants 
SET calendar_config = '{
    "access_token": "tu-access-token-aqui",
    "refresh_token": "tu-refresh-token-aqui",
    "calendar_id": "primary",
    "expires_at": "2025-12-31T23:59:59Z"
}'::jsonb
WHERE id = 'default';
```

### 5. Verificar Configuración

```sql
-- Verificar que el tenant tiene configuración de calendario
SELECT 
    business_name,
    CASE 
        WHEN calendar_config->>'access_token' IS NOT NULL THEN '✅ Configurado'
        ELSE '❌ Sin configurar'
    END as google_calendar_status
FROM tenants 
WHERE id = 'default';
```

## 🔧 Troubleshooting

### Error: "Calendar not configured"
- Verifica que el tenant tenga `calendar_config` en la base de datos
- Asegúrate de que `access_token` y `calendar_id` estén presentes

### Error: "Invalid credentials"
- Revisa que el `access_token` no haya expirado
- El sistema debería renovar automáticamente usando `refresh_token`

### Error: "Calendar not found"
- Verifica que `calendar_id` sea correcto
- Para calendario principal, usa `"primary"`
- Para calendarios específicos, usa el email completo

## 📝 Notas Importantes

1. **Seguridad**: Los tokens se almacenan en la base de datos por tenant
2. **Renovación**: El sistema renueva automáticamente los access tokens
3. **Permisos**: Necesitas permisos de escritura en el calendario
4. **Testing**: Prueba con un calendario de prueba primero

## 🚀 Una vez configurado...

Tu chatbot podrá:
- ✅ Verificar disponibilidad en tiempo real
- ✅ Crear eventos automáticamente al confirmar citas
- ✅ Actualizar/cancelar eventos existentes
- ✅ Sincronizar con otros calendarios del usuario

# 🏢 GUÍA PARA AGREGAR NUEVOS CLIENTES

## 🚀 **Proceso Automático Completo**

Esta guía te permite agregar nuevos clientes al sistema y configurar automáticamente su Google Calendar en 3 pasos simples.

---

## 📋 **Pre-requisitos**

### **1. Configurar Google Cloud (UNA SOLA VEZ)**

```bash
# 1. Ir a: https://console.cloud.google.com/
# 2. Crear proyecto nuevo: "WhatsApp Bot Multi-Tenant"
# 3. Habilitar APIs:
#    - Google Calendar API
#    - Google+ API (opcional)
```

### **2. Crear Credenciales OAuth2**

```bash
# En Google Cloud Console:
# 1. Ir a "APIs y servicios" > "Credenciales"
# 2. Crear credenciales > "ID de cliente de OAuth 2.0"
# 3. Tipo de aplicación: "Aplicación web"
# 4. URIs de redirección autorizados:
#    https://tu-app.vercel.app/api/oauth/google/callback
```

### **3. Configurar Variables de Entorno en Vercel**

```bash
# Agregar estas 2 variables en Vercel Dashboard > Settings > Environment Variables:
GOOGLE_CLIENT_ID=tu-client-id-de-google-cloud
GOOGLE_CLIENT_SECRET=tu-client-secret-de-google-cloud

# ✅ Variables existentes (mantener):
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
TWILIO_ACCOUNT_SID=tu-account-sid
TWILIO_AUTH_TOKEN=tu-auth-token
```

---

## 🛠️ **Verificar Configuración**

Antes de agregar clientes, verifica que todo esté configurado:

```bash
# En tu computadora local, dentro del proyecto:
node scripts/verify-google-config.js

# Esperado: Todo en ✅
# Si algo está en ❌, seguir las instrucciones que aparecen
```

---

## 🏢 **Agregar Nuevo Cliente (AUTOMÁTICO)**

### **Opción A: Script Interactivo (RECOMENDADO)**

```bash
# Ejecutar script guiado:
node scripts/add-new-client.js

# El script te pedirá:
# 🆔 ID del negocio (ej: barberia_madrid)
# 🏢 Nombre del negocio (ej: Barbería Central)
# 📱 Número WhatsApp (ej: 34911234567)
# 📧 Email de Google Calendar (ej: info@barberia.com)
# 📍 Dirección (opcional)
# 💰 Servicios (nombre, precio, duración)

# Al final obtienes:
# ✅ Cliente en base de datos
# 🔗 Enlace de autorización para Google Calendar
```

### **Opción B: Script con Parámetros**

```bash
# Para un solo cliente específico:
node scripts/authorize-client-calendar.js barberia_madrid info@barberia.com

# Genera solo el enlace de autorización
```

---

## 📧 **Enviar Autorización al Cliente**

### **Después del script, envías al cliente:**

```
🎉 ¡Bienvenido a nuestro sistema de reservas WhatsApp!

Para completar la configuración de tu calendario:

1. 🔗 Abre este enlace: [ENLACE_GENERADO_POR_EL_SCRIPT]

2. 📧 Inicia sesión con tu email: info@tunegocio.com

3. ✅ Acepta los permisos para gestionar tu calendario

4. 🎯 ¡Listo! Las reservas se crearán automáticamente

¿Dudas? Contacta con soporte.
```

---

## ✅ **Verificar que Funciona**

### **1. Comprobar Autorización**

```sql
-- En Supabase SQL Editor, verificar que el cliente autorizó:
SELECT 
    id, 
    business_name,
    CASE 
        WHEN calendar_config->>'access_token' IS NOT NULL THEN '✅ Autorizado'
        ELSE '⏳ Pendiente'
    END as calendar_status
FROM tenants 
WHERE id = 'TU_CLIENTE_ID';
```

### **2. Probar Reserva de Prueba**

```bash
# Simular mensaje de WhatsApp al nuevo cliente:
curl -X POST https://tu-app.vercel.app/webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+1234567890&To=whatsapp:+NUMERO_DEL_CLIENTE&Body=precios&MessageSid=test123"

# Esperado: Lista de servicios del nuevo cliente
```

---

## 🏢 **Ejemplos de Configuración**

### **Cliente 1: Barbería**

```bash
# Datos de ejemplo:
ID: barberia_madrid
Nombre: Barbería Central  
WhatsApp: 34911234567
Email: info@barberia-madrid.com
Servicios:
  - Corte Clásico: €18 (25min)
  - Corte + Barba: €25 (40min)
  - Solo Barba: €12 (20min)
```

### **Cliente 2: Salón de Belleza**

```bash
# Datos de ejemplo:
ID: salon_barcelona
Nombre: Salón Estrella
WhatsApp: 34933456789  
Email: citas@salon-estrella.com
Servicios:
  - Corte: €30 (45min)
  - Tinte: €65 (120min)
  - Mechas: €85 (150min)
  - Peinado: €25 (30min)
```

---

## 📱 **Configurar Webhook de WhatsApp**

### **Para cada nuevo cliente en Twilio:**

```bash
# 1. Ir a Twilio Console > WhatsApp > Senders
# 2. Seleccionar el número del cliente
# 3. Configurar webhook:
#    URL: https://tu-app.vercel.app/webhook
#    Method: POST
# 4. Guardar configuración
```

---

## 🔧 **Gestión de Clientes Existentes**

### **Ver Todos los Clientes**

```sql
-- Lista de todos los clientes:
SELECT 
    id,
    business_name,
    phone_number,
    email,
    CASE 
        WHEN calendar_config->>'access_token' IS NOT NULL THEN '✅'
        ELSE '❌'
    END as calendar_configured
FROM tenants
ORDER BY business_name;
```

### **Reautorizar Google Calendar**

```bash
# Si un cliente necesita reautorizar su calendario:
node scripts/authorize-client-calendar.js CLIENTE_ID NUEVO_EMAIL

# Enviar nuevo enlace al cliente
```

### **Actualizar Servicios**

```sql
-- Agregar nuevo servicio:
INSERT INTO services (tenant_id, name, price, duration_minutes) 
VALUES ('cliente_id', 'Nuevo Servicio', 45.00, 60);

-- Actualizar precio:
UPDATE services 
SET price = 35.00 
WHERE tenant_id = 'cliente_id' AND name = 'Corte';
```

---

## 🚨 **Troubleshooting**

### **Error: "No calendar configuration found"**
```bash
# El cliente no ha autorizado Google Calendar
# Solución: Reenviar enlace de autorización
node scripts/authorize-client-calendar.js CLIENTE_ID EMAIL
```

### **Error: "Tenant not found"**
```bash
# El cliente no existe en base de datos
# Solución: Verificar ID en Supabase o crear cliente
node scripts/add-new-client.js
```

### **Error: "Invalid token"**
```bash
# Token de Google Calendar expirado
# Solución: El sistema renovará automáticamente, o reautorizar
```

---

## 📈 **Escalabilidad**

### **Límites Actuales:**
- ✅ **Clientes**: Ilimitados (misma API)
- ✅ **Servicios**: Ilimitados por cliente  
- ✅ **Reservas**: Ilimitadas
- ✅ **Google Calendar**: Límite de 1M requests/día (más que suficiente)

### **Costos por Cliente:**
- 🆓 **API**: $0 (una sola instancia Vercel)
- 🆓 **Base de datos**: $0 (Supabase free tier hasta 500MB)
- 🆓 **Google Calendar**: $0 (API gratuita)
- 💰 **WhatsApp**: $0.005 por mensaje (Twilio)

---

## 🎯 **Resumen del Flujo**

1. **Tú**: Ejecutas `node scripts/add-new-client.js`
2. **Sistema**: Crea cliente en base de datos + genera enlace
3. **Tú**: Envías enlace al cliente
4. **Cliente**: Autoriza Google Calendar (1 click)
5. **Sistema**: Se configura automáticamente
6. **Resultado**: Cliente puede recibir reservas por WhatsApp

**¡Solo 5 minutos por cliente nuevo!** 🚀

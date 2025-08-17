# 🧪 GUÍA COMPLETA PARA PROBAR EL SISTEMA

## 📋 **Checklist Pre-Testing**

### **✅ Variables de Entorno en Vercel**
```bash
# Ir a Vercel Dashboard > Tu Proyecto > Settings > Environment Variables
# Verificar que SOLO tienes estas 4:

SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key-real
TWILIO_ACCOUNT_SID=tu-account-sid-real  
TWILIO_AUTH_TOKEN=tu-auth-token-real

# ❌ ELIMINAR si las tienes:
# TWILIO_PHONE_NUMBER
# GOOGLE_CLIENT_ID
# GOOGLE_CLIENT_SECRET
```

### **✅ Base de Datos Configurada**
```sql
-- 1. En Supabase SQL Editor, ejecutar:
\i database/update_tables_for_calendar.sql

-- 2. ANTES de ejecutar setup_default_tenant.sql:
-- Editar línea 15: '14155238886' → 'TU_NUMERO_WHATSAPP_SIN_PLUS'
-- Ejemplo: '34911234567' para España

-- 3. Ejecutar:
\i database/setup_default_tenant.sql
```

---

## 🚀 **PASOS PARA PROBAR EL SISTEMA**

### **Paso 1: Verificar API Funcionando**

```bash
# Test básico - debe devolver status 200
curl https://tu-app.vercel.app/health

# Esperado:
{
  "status": "ok",
  "timestamp": "2025-08-17T...",
  "service": "WhatsApp Chatbot API",
  "version": "1.0.0"
}
```

### **Paso 2: Verificar Webhook**

```bash
# Test webhook verification
curl "https://tu-app.vercel.app/webhook?hub.mode=subscribe&hub.verify_token=chatbot_verify_2024&hub.challenge=test123"

# Esperado: "test123" (devuelve el challenge)
```

### **Paso 3: Verificar Base de Datos**

```sql
-- En Supabase SQL Editor:

-- 1. Verificar tenant creado
SELECT 
    id, business_name, phone_number,
    CASE 
        WHEN calendar_config->>'access_token' IS NOT NULL THEN '✅ Google Calendar Configurado'
        ELSE '⏳ Google Calendar Pendiente'
    END as calendar_status
FROM tenants 
WHERE id = 'default';

-- 2. Verificar servicios
SELECT name, price, duration_minutes 
FROM services 
WHERE tenant_id = 'default';

-- Esperado: 4 servicios (Corte, Corte+Barba, Tinte, Mechas)
```

### **Paso 4: Simular Mensaje WhatsApp**

```bash
# Simular mensaje entrante (sustituye TU_NUMERO por el número configurado)
curl -X POST https://tu-app.vercel.app/webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+1234567890&To=whatsapp:+TU_NUMERO&Body=hola&MessageSid=test123&ProfileName=TestUser"

# Esperado: status 200
# Revisar logs en Vercel para ver procesamiento
```

### **Paso 5: Probar Comandos Básicos**

Envía estos mensajes vía la simulación de arriba:

```bash
# 1. Saludo
-d "Body=hola"
# Esperado: Mensaje de bienvenida

# 2. Precios  
-d "Body=precios"
# Esperado: Lista de servicios con precios

# 3. Horarios
-d "Body=horarios"
# Esperado: Horarios del negocio

# 4. Disponibilidad
-d "Body=horarios 26/08/2025"
# Esperado: Slots disponibles (sin Google Calendar será limitado)
```

### **Paso 6: Probar Sistema de Reservas**

```bash
# 1. Intentar reserva
-d "Body=reservar corte 26/08/2025 10:00"

# Esperado SIN Google Calendar:
# Error: "No calendar configuration found"

# Esperado CON Google Calendar:
# "🎯 ¡Slot reservado temporalmente!"
```

---

## 📅 **Configurar Google Calendar (OPCIONAL)**

### **Solo si quieres probar la integración completa:**

#### **1. Google Cloud Setup**
```bash
# 1. Ir a: https://console.cloud.google.com/
# 2. Crear proyecto nuevo: "WhatsApp Bot Test"
# 3. Habilitar Google Calendar API
# 4. Crear credenciales OAuth2
```

#### **2. Ejecutar Script de Autorización**
```bash
# 1. Editar setup-google-auth.js (líneas 7-8):
const CLIENT_ID = 'tu-client-id-real';
const CLIENT_SECRET = 'tu-client-secret-real';

# 2. Ejecutar:
node setup-google-auth.js

# 3. Seguir instrucciones en navegador
# 4. Copiar tokens que aparecen en consola
```

#### **3. Actualizar Base de Datos**
```sql
-- Usar tokens obtenidos del script:
UPDATE tenants 
SET calendar_config = '{
    "access_token": "TOKEN_OBTENIDO_DEL_SCRIPT",
    "refresh_token": "REFRESH_TOKEN_OBTENIDO_DEL_SCRIPT",
    "calendar_id": "primary",
    "expires_at": "2025-12-31T23:59:59Z"
}'::jsonb
WHERE id = 'default';
```

---

## 🧪 **Tests de Funcionalidad Completa**

### **Una vez configurado Google Calendar:**

```bash
# 1. Consultar slots disponibles
-d "Body=horarios 26/08/2025"
# Esperado: Lista de slots reales basados en calendario

# 2. Hacer reserva
-d "Body=reservar corte 26/08/2025 10:00"  
# Esperado: "🎯 ¡Slot reservado temporalmente!"

# 3. Confirmar reserva (enviar desde el mismo número)
-d "Body=confirmar"
# Esperado: "✅ ¡Cita confirmada!" + evento en Google Calendar

# 4. Ver citas
-d "Body=mis citas"
# Esperado: Lista de citas confirmadas
```

### **Tests de Validación:**

```bash
# Fecha pasada
-d "Body=reservar corte 15/08/2025 10:00"
# Esperado: Error fecha pasada

# Servicio inexistente  
-d "Body=reservar manicura 26/08/2025 10:00"
# Esperado: Lista de servicios disponibles

# Horario fuera del negocio
-d "Body=reservar corte 26/08/2025 07:00"
# Esperado: Horarios disponibles

# Confirmar sin reserva
-d "Body=confirmar"
# Esperado: "No hay reservas pendientes"
```

---

## 🏢 **Agregar Segundo Negocio (Multi-Tenant)**

### **Para probar funcionalidad multi-tenant:**

```sql
-- 1. Usar plantilla database/add_new_tenant.sql
-- 2. Cambiar todos los valores marcados con 🔥:

INSERT INTO tenants (id, business_name, phone_number, address, email) VALUES 
('barberia_madrid', 'Barbería Central', '34932123456', 'Calle Mayor 50', 'info@barberia.com');

INSERT INTO services (tenant_id, name, price, duration_minutes) VALUES
('barberia_madrid', 'Corte Clásico', 18.00, 25),
('barberia_madrid', 'Barba', 12.00, 20);
```

### **Probar ambos negocios:**

```bash
# Mensaje a primer negocio
-d "To=whatsapp:+TU_PRIMER_NUMERO&Body=precios"

# Mensaje a segundo negocio  
-d "To=whatsapp:+TU_SEGUNDO_NUMERO&Body=precios"

# Cada uno debe mostrar sus propios servicios y precios
```

---

## 🔍 **Debugging**

### **Si algo no funciona:**

#### **1. Verificar Logs en Vercel**
```bash
# Ir a: Vercel Dashboard > Tu Proyecto > Functions > View Function Logs
# Buscar errores en tiempo real
```

#### **2. Verificar Variables de Entorno**
```bash
# API test endpoint:
curl https://tu-app.vercel.app/api/status

# Debe mostrar estado de configuraciones
```

#### **3. Test Manual de Base de Datos**
```sql
-- Verificar tenants
SELECT COUNT(*) as total_tenants FROM tenants;

-- Verificar servicios
SELECT COUNT(*) as total_services FROM services;

-- Verificar appointments
SELECT COUNT(*) as total_appointments FROM appointments;
```

#### **4. Verificar Twilio**
```bash
# En Twilio Console:
# 1. Ir a WhatsApp > Senders
# 2. Verificar que el número está activo
# 3. Verificar webhook URL apunta a tu Vercel app
```

---

## ✅ **Checklist Final**

- [ ] ✅ API responde en `/health`
- [ ] ✅ Webhook verifica correctamente  
- [ ] ✅ Base de datos tiene tenant y servicios
- [ ] ✅ Simulación de mensajes funciona
- [ ] ✅ Comandos básicos responden
- [ ] ✅ Logs en Vercel muestran procesamiento
- [ ] ✅ (Opcional) Google Calendar configurado
- [ ] ✅ (Opcional) Reservas completas funcionan
- [ ] ✅ (Opcional) Multi-tenant probado

### **🎯 Una vez completado:**
**¡Tu sistema está listo para WhatsApp real!**

### **🔗 Configurar Webhook en Twilio:**
```
Webhook URL: https://tu-app.vercel.app/webhook
Method: POST
```

---

## 🆘 **Soporte**

**Si algo no funciona:**
1. 📋 Revisa este checklist paso a paso
2. 📄 Consulta los logs de Vercel
3. 🔍 Verifica la base de datos en Supabase
4. 📧 Contacta para soporte específico

**¡El sistema está diseñado para funcionar sin problemas si sigues estos pasos!**

# 🏢 Sistema Multi-Tenant - WhatsApp Booking Bot

## 📋 Resumen

El sistema ahora soporta **múltiples negocios** (tenants), cada uno con:
- ✅ Su propio **número de WhatsApp Business**
- ✅ Su propia **configuración de Google Calendar**
- ✅ Sus propios **servicios y precios**
- ✅ Su propia **configuración de slots**

## 🔧 Cómo funciona

### **1. Detección Automática del Negocio**
Cuando llega un mensaje de WhatsApp:
```
Mensaje recibido en: whatsapp:+34600123456
Sistema busca en BD: ¿Qué tenant tiene phone_number = '34600123456'?
Respuesta personalizada: Usa configuración del tenant encontrado
```

### **2. Variables de Entorno Simplificadas**
```bash
# ✅ SOLO ESTAS 4 VARIABLES NECESARIAS EN VERCEL:
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
TWILIO_ACCOUNT_SID=tu-account-sid  
TWILIO_AUTH_TOKEN=tu-auth-token

# ❌ YA NO NECESITAS:
# TWILIO_PHONE_NUMBER (se obtiene de la BD por tenant)
# GOOGLE_CLIENT_ID/SECRET (se configuran por tenant)
```

## 🏗️ Configuración por Negocio

### **Tenant por Defecto (Primer Negocio)**
1. Ejecuta `database/update_tables_for_calendar.sql` en Supabase
2. Edita `database/setup_default_tenant.sql`:
   - Cambia `'14155238886'` por tu número WhatsApp Business
   - Cambia nombre del negocio, dirección, etc.
3. Ejecuta el script en Supabase

### **Negocios Adicionales**
1. Usa `database/add_new_tenant.sql` como plantilla
2. Reemplaza todos los valores marcados con 🔥
3. Ejecuta en Supabase
4. Configura Google Calendar por separado para cada negocio

## 📱 Números de WhatsApp

### **Formato Correcto en Base de Datos:**
```sql
-- ✅ CORRECTO: Solo números
phone_number = '34600123456'     -- España
phone_number = '14155238886'     -- USA/Twilio Sandbox

-- ❌ INCORRECTO:
phone_number = '+34600123456'    -- Con +
phone_number = 'whatsapp:+34600123456'  -- Con prefijo
```

### **Cómo obtener tu número:**
1. **Twilio Console** > WhatsApp > Senders
2. Copia el número **sin** el `+` del inicio
3. Ejemplo: Si ves `+1 415 523 8886`, usa `14155238886`

## 🎯 Flujo de Mensajes

```
1. Usuario envía: "hola" a +34600123456
2. Webhook recibe: To="whatsapp:+34600123456"
3. Sistema busca: tenant con phone_number="34600123456"  
4. Respuesta personalizada con: negocio.business_name, servicios, etc.
```

## 📊 Estructura de Base de Datos

### **Tabla `tenants`:**
```sql
id               | VARCHAR    | 'peluqueria_madrid'
business_name    | VARCHAR    | 'Peluquería Bella Vista'
phone_number     | VARCHAR    | '34600123456'
address          | VARCHAR    | 'Calle Mayor 15'
email            | VARCHAR    | 'info@peluqueria.com'
slot_config      | JSONB      | {"slot_granularity": 15, ...}
calendar_config  | JSONB      | {"access_token": "...", ...}
```

### **Tabla `services`:**
```sql
tenant_id        | VARCHAR    | 'peluqueria_madrid'
name             | VARCHAR    | 'Corte de pelo'
price            | DECIMAL    | 25.00
duration_minutes | INTEGER    | 30
```

## 🔍 Resolución de Problemas

### **Error: "No tenant found for phone number"**
```sql
-- Verificar qué tenants tienes:
SELECT id, business_name, phone_number FROM tenants;

-- Verificar formato del número:
SELECT phone_number, LENGTH(phone_number) FROM tenants WHERE id = 'tu_tenant';
```

### **Error: "No services found"**
```sql
-- Verificar servicios por tenant:
SELECT tenant_id, name, price, duration_minutes 
FROM services 
WHERE tenant_id = 'tu_tenant';
```

### **Mensajes no llegan al tenant correcto**
1. Verifica que el número en `tenants.phone_number` coincide exactamente
2. Comprueba logs: "Found tenant: [nombre] (ID: [id])"
3. El número debe estar en formato: solo números, sin `+` ni `whatsapp:`

## 🚀 Ejemplos de Uso

### **Configurar Peluquería en Madrid:**
```sql
INSERT INTO tenants (id, business_name, phone_number, address) VALUES 
('peluqueria_madrid', 'Bella Vista Madrid', '34911234567', 'Gran Vía 1, Madrid');
```

### **Configurar Barbería en Barcelona:**
```sql
INSERT INTO tenants (id, business_name, phone_number, address) VALUES 
('barberia_bcn', 'Barbería Clásica', '34932123456', 'Passeig de Gràcia 100, Barcelona');
```

### **Cada uno tendrá:**
- ✅ Sus propios servicios y precios
- ✅ Su propio Google Calendar
- ✅ Su propia configuración de horarios
- ✅ Su número de WhatsApp Business único

## 📈 Escalabilidad

El sistema puede manejar:
- ✅ **Ilimitados tenants** en la misma base de datos
- ✅ **Una cuenta de Twilio** para todos los números
- ✅ **Calendarios separados** por Google account o compartidos
- ✅ **Configuraciones independientes** por negocio

¡Cada negocio funciona como si fuera su propio chatbot personalizado!

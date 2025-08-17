# 🧪 Guía de Pruebas del Sistema de Reservas

## 📋 Checklist de Pruebas

### ✅ **Pruebas Básicas del Chatbot**

#### 1. **Respuestas Básicas**
```
Envía: "hola"
Esperado: Mensaje de bienvenida con opciones

Envía: "precios"  
Esperado: Lista de servicios y precios

Envía: "horarios"
Esperado: Horarios de apertura/cierre
```

#### 2. **Consulta de Disponibilidad**
```
Envía: "horarios 25/08/2025"
Esperado: Lista de slots disponibles para ese día

Envía: "horarios 18/08/2025" (domingo)  
Esperado: "Cerrado los domingos"
```

#### 3. **Flujo de Reserva Completo**
```
Paso 1: "reservar corte 25/08/2025 10:00"
Esperado: Confirmación de hold temporal (5 min)

Paso 2: "confirmar"
Esperado: ✅ Cita confirmada + evento en Google Calendar

// Alternativamente:
Paso 2b: "cancelar"  
Esperado: ❌ Reserva cancelada
```

#### 4. **Validaciones de Error**
```
"reservar servicio_inexistente 25/08/2025 10:00"
Esperado: ❌ Lista de servicios disponibles

"reservar corte 15/08/2025 10:00" (fecha pasada)
Esperado: ❌ Error fecha inválida

"reservar corte 25/08/2025 08:00" (antes de abrir)
Esperado: ❌ Horarios disponibles
```

---

## 🔧 **Testing Técnico**

### **A. Base de Datos**

```sql
-- 1. Verificar tenant configurado
SELECT * FROM tenants WHERE id = 'default';

-- 2. Verificar servicios
SELECT * FROM services WHERE tenant_id = 'default';

-- 3. Probar función de limpieza
SELECT cleanup_expired_holds();

-- 4. Ver appointments activos
SELECT * FROM appointments WHERE status IN ('hold', 'confirmed');
```

### **B. API Endpoints**

```bash
# 1. Health check
curl https://tu-app.vercel.app/health

# 2. Webhook verification
curl "https://tu-app.vercel.app/webhook?hub.mode=subscribe&hub.verify_token=chatbot_verify_2024&hub.challenge=test123"

# 3. Simular mensaje de WhatsApp
curl -X POST https://tu-app.vercel.app/webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+1234567890&To=whatsapp:+14155238886&Body=hola&MessageSid=test123&ProfileName=Test User"
```

### **C. Google Calendar Integration**

```javascript
// Probar disponibilidad manualmente
const testAvailability = async () => {
  const available = await checkCalendarAvailability(
    'default',
    '2025-08-25T10:00:00Z',
    '2025-08-25T10:30:00Z'
  );
  console.log('Slot disponible:', available);
};

// Probar creación de evento
const testCreateEvent = async () => {
  const event = await createCalendarEvent(
    'default',
    {
      summary: 'Test - Corte de pelo',
      start: '2025-08-25T10:00:00Z',
      end: '2025-08-25T10:30:00Z',
      description: 'Prueba de integración'
    }
  );
  console.log('Evento creado:', event);
};
```

---

## 🐛 **Troubleshooting**

### **Error: "Supabase credentials not configured"**
- ✅ Verifica `.env` tiene `SUPABASE_URL` y `SUPABASE_ANON_KEY`
- ✅ Confirma que las variables están en Vercel (si desplegado)

### **Error: "No calendar configuration found"**
- ✅ Ejecuta `database/setup_default_tenant.sql`
- ✅ Actualiza `calendar_config` con tokens válidos de Google

### **Error: "Twilio credentials missing"**
- ✅ Configura `TWILIO_ACCOUNT_SID` y `TWILIO_AUTH_TOKEN`
- ✅ Verifica `TWILIO_PHONE_NUMBER` formato: `whatsapp:+1234567890`

### **Error: "Service not found"**
- ✅ Confirma que hay servicios en tabla `services`
- ✅ Ejecuta `setup_default_tenant.sql` para crear servicios por defecto

### **Slots no aparecen/Calendar vacío**
- ✅ Verifica horarios de negocio en `tenants.business_hours`
- ✅ Confirma que Google Calendar API está habilitada
- ✅ Verifica tokens de Google Calendar no expirados

---

## 📱 **Mensajes de Prueba para WhatsApp**

### **Flujo Típico de Usuario:**
```
1. "hola" → Bienvenida
2. "precios" → Ver servicios  
3. "horarios mañana" → Ver disponibilidad
4. "reservar corte 26/08/2025 10:00" → Hacer reserva
5. "confirmar" → Confirmar cita
6. "mis citas" → Ver reservas confirmadas
```

### **Casos Edge:**
```
- "reservar" (sin parámetros) → Instrucciones
- "reservar xyz abc def" (formato incorrecto) → Error + formato correcto
- "confirmar" (sin reserva pendiente) → No hay reservas
- "cancelar" después de 5 min → Hold expirado
```

---

## ✅ **Checklist Final**

Antes de considerar el sistema COMPLETO, verifica:

- [ ] Base de datos configurada con `update_tables_for_calendar.sql`
- [ ] Tenant por defecto creado con `setup_default_tenant.sql`  
- [ ] Google Calendar configurado con tokens válidos
- [ ] Variables de entorno configuradas (`.env`)
- [ ] Webhook de WhatsApp funcionando
- [ ] API desplegada y accesible
- [ ] Pruebas de reserva completa exitosas
- [ ] Eventos aparecen en Google Calendar
- [ ] Sistema de hold temporal funciona (5 min)
- [ ] Limpieza automática de holds expirados

### **🎯 Una vez completado el checklist:**
**¡El sistema estará 100% funcional y listo para producción!**

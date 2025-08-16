# 🧪 Guía Completa de Pruebas del Chatbot

## 1. 🏁 Verificación Inicial

### Comprobar que todo compila
```bash
cd c:\Users\Admin\Proyectos\Chatbot
npm run typecheck
npm run test -- tests/booking-api.test.ts
```

### Probar localmente (opcional)
```bash
npm run dev
# El servidor estará en http://localhost:3000
```

## 2. 🚀 Deployment a Vercel

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy inicial
vercel

# 4. Configurar variables de entorno (en Vercel dashboard)
# - SUPABASE_URL
# - SUPABASE_ANON_KEY  
# - SUPABASE_SERVICE_ROLE_KEY
# - WHATSAPP_API_KEY
# - WHATSAPP_WEBHOOK_VERIFY_TOKEN
# - GOOGLE_SERVICE_ACCOUNT_EMAIL
# - GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
# - GOOGLE_CALENDAR_ID

# 5. Deploy final
vercel --prod
```

## 3. 🔧 Configurar WhatsApp Business

### En 360dialog o tu proveedor:
1. **Webhook URL**: `https://tu-proyecto.vercel.app/webhook`
2. **Verify Token**: el mismo que en `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
3. **Eventos**: `messages`, `message_deliveries`

### Verificar webhook:
```bash
curl "https://tu-proyecto.vercel.app/webhook?hub.mode=subscribe&hub.verify_token=tu_token&hub.challenge=test123"
# Debe devolver: test123
```

## 4. 🧪 Pruebas Automáticas

### Ejecutar script de prueba:
```bash
# Configurar URL de tu deployment
export API_URL=https://tu-proyecto.vercel.app

# Ejecutar pruebas
node test-chatbot.js
```

### Qué hace el script:
- ✅ Verifica que el servidor esté funcionando
- ✅ Prueba endpoints de API directamente
- ✅ Simula conversaciones típicas de clientes
- ✅ Muestra las respuestas del chatbot

## 5. 📱 Pruebas con WhatsApp Real

### Como cliente, envía estos mensajes a tu número de negocio:

**Conversación 1: Saludo y consulta**
```
Cliente: "Hola"
Chatbot: [Mensaje de bienvenida con opciones]

Cliente: "Quiero ver disponibilidad"
Chatbot: [Solicita servicio y fecha]

Cliente: "Para mañana"
Chatbot: [Muestra horarios disponibles]
```

**Conversación 2: Reserva completa**
```
Cliente: "Quiero reservar una cita"
Chatbot: [Solicita información completa]

Cliente: "Juan Pérez, 666123456, mañana 10am, corte de pelo"
Chatbot: [Confirma datos y crea reserva temporal]

Cliente: "Sí, confirmo"
Chatbot: [Reserva confirmada]
```

**Conversación 3: Cancelación**
```
Cliente: "Cancelar cita"
Chatbot: [Solicita datos para encontrar la cita]

Cliente: "Mi teléfono es 666123456"
Chatbot: [Encuentra y cancela la cita]
```

**Conversación 4: Información**
```
Cliente: "¿Qué servicios tienen?"
Chatbot: [Lista de servicios y precios]

Cliente: "¿Dónde están?"
Chatbot: [Información de contacto]
```

## 6. 🔍 Verificar que Todo Funciona

### Indicadores de éxito:

✅ **Servidor Healthy**
```bash
curl https://tu-proyecto.vercel.app/health
# Response: {"status":"healthy",...}
```

✅ **Webhook Verificado**
- En 360dialog aparece ✓ verde
- Los mensajes llegan al webhook

✅ **API Endpoints Funcionando**
```bash
# Test availability
curl -X POST https://tu-proyecto.vercel.app/api/availability \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: 123e4567-e89b-12d3-a456-426614174000" \
  -d '{"tenantId":"123e4567-e89b-12d3-a456-426614174000","serviceId":"123e4567-e89b-12d3-a456-426614174001","date":"2025-08-17"}'
```

✅ **Mensajes de WhatsApp Procesados**
- Los mensajes enviados se procesan sin error 500
- Aparecen logs en Vercel dashboard
- El chatbot responde según la intención

✅ **Base de Datos Conectada**
- Las consultas a Supabase funcionan
- Se pueden crear/leer registros

✅ **Google Calendar Integrado**
- Se pueden consultar slots disponibles
- Se crean eventos en el calendario

## 7. 🐛 Troubleshooting

### Error 500 en webhook:
- Revisar logs en Vercel dashboard
- Verificar variables de entorno
- Comprobar conexión a Supabase

### WhatsApp no recibe mensajes:
- Verificar configuración de webhook en 360dialog
- Comprobar que el verify token coincide
- Revisar que el número está verificado

### API endpoints fallan:
- Comprobar headers (x-tenant-id)
- Verificar formato de UUIDs
- Revisar que los servicios existen en BD

### Base de datos no conecta:
- Verificar SUPABASE_URL y keys
- Comprobar que las tablas existen
- Revisar permisos de service role key

## 8. 📊 Monitoreo en Producción

### En Vercel Dashboard:
- **Functions**: Ver logs de ejecución
- **Analytics**: Métricas de uso
- **Speed Insights**: Performance

### Logs importantes a revisar:
```bash
# Ver logs en tiempo real
vercel logs tu-proyecto --follow

# Buscar errores específicos
vercel logs tu-proyecto | grep ERROR
```

### Métricas clave:
- ✅ Tiempo de respuesta < 2s
- ✅ Error rate < 1%
- ✅ Disponibilidad > 99%
- ✅ Mensajes procesados correctamente

¡Tu chatbot estará listo para atender clientes reales! 🎉

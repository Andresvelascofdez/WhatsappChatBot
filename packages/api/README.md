# WhatsApp Booking Chatbot

Este proyecto implementa un chatbot de WhatsApp para reservas de citas usando Hono, Supabase, Google Calendar y la API de WhatsApp Business.

## Características Implementadas

✅ **API de Reservas (booking-api.ts)**
- `POST /api/availability` - Consultar disponibilidad 
- `POST /api/book` - Crear reserva
- `POST /api/confirm` - Confirmar cita
- `DELETE /api/appointment/:id` - Cancelar cita

✅ **Webhook de WhatsApp (webhook.ts)**
- `GET /webhook` - Verificación de webhook
- `POST /webhook` - Procesamiento de mensajes

✅ **Manejador de Mensajes (handlers.ts)**
- Enrutamiento de intenciones
- Respuestas a saludos, consultas, reservas, cancelaciones
- Manejo de FAQs

✅ **Tests Completos**
- Tests unitarios para API de reservas (booking-api.test.ts)
- Tests básicos para webhook (webhook.test.ts)
- Cobertura de casos exitosos y errores

✅ **Configuración**
- Variables de entorno para Supabase, WhatsApp, Google Calendar
- Configuración de tipos TypeScript
- Integración con servicios externos

## Estructura del Proyecto

```
packages/api/
├── src/
│   ├── booking-api.ts    # Endpoints de API REST
│   ├── webhook.ts        # Webhook de WhatsApp
│   ├── handlers.ts       # Lógica de mensajes
│   ├── config.ts         # Configuración de aplicación
│   ├── app.ts           # Aplicación principal
│   └── index.ts         # Exports principales
├── tests/
│   ├── booking-api.test.ts  # Tests de API
│   └── webhook.test.ts      # Tests de webhook
└── package.json
```

## Variables de Entorno Requeridas

```bash
# Supabase Database
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# WhatsApp Business API (360dialog)
WHATSAPP_API_URL=https://waba-v2.360dialog.io
WHATSAPP_API_KEY=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=

# Google Calendar API
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=
GOOGLE_CALENDAR_ID=

# Configuración de aplicación
NODE_ENV=production
DEFAULT_HOLD_DURATION_MINUTES=15
MAX_ADVANCE_BOOKING_DAYS=30
```

## Despliegue

### Vercel
1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Deploy automático

### Cloudflare Workers
1. Configurar `wrangler.toml`
2. Configurar secrets: `wrangler secret put VARIABLE_NAME`
3. Deploy: `wrangler deploy`

## Estado de Implementación

### ✅ Completado
- API endpoints de reservas con validación Zod
- Webhook de WhatsApp con verificación
- Manejador de mensajes con enrutamiento básico
- Tests unitarios para funcionalidades críticas
- Configuración de TypeScript y build
- Integración con BookingService existente

### 🔄 Implementación Básica (Logs por consola)
- Respuestas de WhatsApp (actualmente solo logs)
- Integración con FAQ repository
- Machine de estados para conversaciones

### 📋 Próximos Pasos
1. Integrar WhatsAppClient real para envío de mensajes
2. Implementar máquina de estados para conversaciones multi-paso
3. Agregar middleware de autenticación
4. Implementar rate limiting
5. Agregar métricas y logging estructurado
6. Configurar monitoring y alertas

## Pruebas

```bash
# Ejecutar todos los tests
npm test

# Verificar tipos
npm run typecheck

# Build para producción
npm run build
```

## Protocolo Seguido

Se siguió estrictamente el **protocolo anti-errores**:
- ✅ Implementación incremental con tests primero
- ✅ Validación de tipos con TypeScript estricto
- ✅ Tests unitarios antes de cada feature
- ✅ Compilación exitosa en cada paso
- ✅ Modularización y separation of concerns
- ✅ Integración con arquitectura existente

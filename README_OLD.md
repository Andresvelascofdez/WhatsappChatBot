# 🤖 WhatsApp Booking Chatbot - Sistema Multi-Tenant

**Chatbot inteligente de WhatsApp para reservas de citas con integración completa de Google Calendar**

[![Deploy Status](https://img.shields.io/badge/Deploy-Vercel-brightgreen)](https://whatsapp-chat-bot-xi.vercel.app/health)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

## 🎯 **Características Principales**

- 🏢 **Sistema Multi-Tenant**: Múltiples negocios con sus propios números de WhatsApp
- 📱 **WhatsApp Business API**: Integración completa con Twilio
- 📅 **Google Calendar**: Sincronización automática de citas y verificación de disponibilidad
- 🗄️ **Base de Datos**: PostgreSQL con Supabase y Row Level Security
- ⚡ **Serverless**: Desplegado en Vercel para máximo rendimiento
- 🔄 **Sistema de Holds**: Reservas temporales con confirmación (5 min)
- 🎨 **Slots Consecutivos**: Sin tiempos de buffer - máxima eficiencia
- 🔧 **Configurable**: Servicios, precios y horarios por negocio

## 🏢 **Sistema Multi-Tenant**

Cada negocio tiene:
- ✅ Su propio **número de WhatsApp Business**
- ✅ Su propia **configuración de Google Calendar**
- ✅ Sus propios **servicios, precios y horarios**
- ✅ Su propia **configuración de slots**
- ✅ **Detección automática** por número de WhatsApp

### **Ejemplo de Uso:**
```
Peluquería Madrid: +34 911 123 456
Barbería Barcelona: +34 932 654 321
Spa Valencia: +34 963 987 654
```
**Todos funcionan independientemente en la misma instalación.**

## 🚀 **Demo en Vivo**

- **API Health**: [https://whatsapp-chat-bot-xi.vercel.app/health](https://whatsapp-chat-bot-xi.vercel.app/health)
- **Webhook**: `https://whatsapp-chat-bot-xi.vercel.app/webhook`

## 📋 **Requisitos**

- Node.js 18+
- [Supabase](https://supabase.com) (gratis)
- [Twilio WhatsApp](https://www.twilio.com/whatsapp) 
- [Google Cloud](https://console.cloud.google.com) para Calendar API

## ⚡ **Instalación Rápida**

### 1. **Clonar e Instalar**
```bash
git clone https://github.com/Andresvelascofdez/WhatsappChatBot.git
cd WhatsappChatBot
npm install
```bash
vercel --prod
```

## 🔧 **Configuración**

### **Variables de Entorno Requeridas**

```bash
# Supabase Database
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# WhatsApp Provider (Twilio recomendado)
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=tu_account_sid_de_twilio
TWILIO_AUTH_TOKEN=tu_auth_token_de_twilio
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890

# Google Calendar API
GOOGLE_SERVICE_ACCOUNT_EMAIL=tu-service-account@proyecto.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
GOOGLE_CALENDAR_ID=tu_calendar_id@group.calendar.google.com
```

## 🏗️ **Arquitectura**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   WhatsApp      │────│   Vercel API     │────│   Supabase DB   │
│   (Twilio)      │    │   (Node.js)      │    │   (PostgreSQL)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              │
                       ┌──────────────────┐
                       │  Google Calendar │
                       │      API         │
                       └──────────────────┘
```

## 📱 **Proveedores de WhatsApp Soportados**

| Proveedor | Costo/Mensaje | Setup | Recomendado |
|-----------|---------------|-------|-------------|
| **Twilio** | €0.005 | Fácil | ✅ **SÍ** |
| UltraMsg | €39/mes | Muy fácil | Para pruebas |
| 360dialog | Variable | Medio | Empresas |
| WhatsApp Cloud API | Gratis* | Complejo | Grandes volúmenes |

## 🔗 **Endpoints API**

### **Health Check**
```bash
GET /health
```

### **Webhook WhatsApp**
```bash
POST /webhook
```

### **API de Reservas**
```bash
GET    /api/bookings           # Listar reservas
POST   /api/bookings           # Crear reserva
GET    /api/bookings/:id       # Obtener reserva
PUT    /api/bookings/:id       # Actualizar reserva
DELETE /api/bookings/:id       # Cancelar reserva
```

## 💰 **Modelo de Negocio**

### **Costos de Operación**
- **Hosting**: Gratis (Vercel)
- **Base de datos**: Gratis hasta 50k requests/mes (Supabase)
- **WhatsApp**: €0.005 por mensaje (Twilio)
- **Google Calendar**: Gratis hasta 1M requests/mes

### **Precio de Venta Sugerido**
- **€30-40/mes por cliente**
- **Margen**: 90%+ después de primeros 1000 mensajes/mes

## 🛠️ **Desarrollo**

### **Estructura del Proyecto**
```
├── api/                 # Punto de entrada para Vercel
│   └── chatbot.js      # API principal Node.js
├── packages/           # Arquitectura monorepo
│   ├── api/           # Lógica de la API
│   ├── booking/       # Sistema de reservas
│   ├── db/            # Esquemas de base de datos
│   ├── gcal/          # Integración Google Calendar
│   └── wa/            # Clientes WhatsApp
├── seed/              # Scripts de inicialización de DB
└── vercel.json        # Configuración de deployment
```

### **Comandos Útiles**
```bash
# Desarrollo local
pnpm dev

# Build
pnpm build

# Tests
pnpm test

# Linting
pnpm lint

# Formateo de código
pnpm format
```

## 🔒 **Seguridad**

- ✅ **Multi-tenant**: Separación por `tenantId`
- ✅ **Row Level Security**: Implementado en Supabase
- ✅ **Validación**: Esquemas Zod en todos los endpoints
- ✅ **Rate limiting**: Protección contra spam
- ✅ **Webhook verification**: Validación de firmas Twilio

## 🚀 **Deployment**

### **Vercel (Recomendado)**
```bash
vercel --prod
```

### **Configurar Webhook en Twilio**
1. Ve a Twilio Console → WhatsApp Sandbox
2. Configura webhook URL: `https://tu-app.vercel.app/webhook`
3. Método: POST

## 📚 **Documentación Adicional**

- [Setup Económico](SETUP_ECONOMICO.md) - Configuración de costos
- [Plan de Negocio](PLAN_NEGOCIO.md) - Modelo económico detallado
- [Deployment Guide](DEPLOYMENT.md) - Guía de despliegue
- [WhatsApp Setup](WHATSAPP_SETUP.md) - Configuración WhatsApp

## 🤝 **Contribuir**

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 **Licencia**

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

## ✨ **Autor**

**Andrés Velasco** - [@Andresvelascofdez](https://github.com/Andresvelascofdez)

---

## 🎯 **Estado del Proyecto: ✅ PRODUCCIÓN**

- ✅ **API funcionando**: Desplegada en Vercel
- ✅ **Webhook operativo**: Recibe mensajes WhatsApp
- ✅ **Base de datos**: Configurada en Supabase
- ✅ **Multi-tenant**: Sistema listo para múltiples clientes
- ⚠️ **Pendiente**: Configuración de proveedor WhatsApp para envío

**¿Listo para usar?** Solo necesitas agregar €20 a tu cuenta Twilio para envío de mensajes.

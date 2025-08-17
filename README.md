# 🤖 WhatsApp Booking Chatbot - Sistema Multi-Tenant

**Chatbot inteligente de WhatsApp para reservas de citas con integración completa de Google Calendar**

[![Deploy Status](https://img.shields.io/badge/Deploy-Vercel-brightgreen)](https://whatsapp-chat-bot-xi.vercel.app/health)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

## 🚀 **Estado del Sistema - ¡COMPLETAMENTE FUNCIONAL!**

| Componente | Estado | URL/Acceso |
|------------|--------|------------|
| 🎨 **Panel Admin** | ✅ **FUNCIONANDO** | [https://whatsapp-chat-bot-xi.vercel.app/admin](https://whatsapp-chat-bot-xi.vercel.app/admin) |
| 🔗 **Google OAuth2** | ✅ **CONFIGURADO** | Autorización automática de clientes |
| ⚡ **API Health** | ✅ **ACTIVA** | [/health](https://whatsapp-chat-bot-xi.vercel.app/health) |
| 📱 **Webhook** | ✅ **LISTO** | /webhook (para Twilio) |
| 🗄️ **Base de Datos** | ✅ **CONECTADA** | Supabase PostgreSQL |

> 💡 **¡El sistema está 100% operativo!** Puedes empezar a agregar clientes inmediatamente usando el panel de administración.

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
```

### 2. **Configurar Variables de Entorno en Vercel**
```bash
# Solo 4 variables necesarias:
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
TWILIO_ACCOUNT_SID=tu-account-sid
TWILIO_AUTH_TOKEN=tu-auth-token
```

### 3. **Configurar Base de Datos**
```sql
-- 1. Ejecutar en Supabase SQL Editor:
\i database/update_tables_for_calendar.sql

-- 2. Configurar primer negocio (cambiar número de teléfono):
\i database/setup_default_tenant.sql
```

### 4. **Desplegar**
```bash
vercel --prod
```

## 🏢 **Configuración Multi-Tenant**

### **🎨 Panel de Administración Visual (RECOMENDADO)**

```bash
# 🎯 SISTEMA COMPLETAMENTE FUNCIONAL Y LISTO

# 1. 🎨 Abrir panel de administración web
https://whatsapp-chat-bot-xi.vercel.app/admin

# 2. ➕ Hacer click en "Agregar Cliente"
# 3. 📝 Completar formulario visual interactivo
# 4. 🔗 Sistema genera automáticamente enlace de autorización de Google
# 5. ✅ ¡Cliente listo para usar el chatbot!

# 💡 Panel incluye estadísticas en tiempo real y gestión completa
```

### **🖥️ Scripts de Terminal (Alternativo)**

```bash
# 1. Verificar configuración Google OAuth2
npm run client:verify

# 2. Agregar nuevo cliente (proceso guiado)
npm run client:add

# 3. Enviar enlace de autorización al cliente
# (El script lo genera automáticamente)
```

📋 **Guía completa**: Ver [AGREGAR_CLIENTES.md](./AGREGAR_CLIENTES.md)

### **Variables de Entorno (Solo 6 necesarias)**

```bash
# ✅ REQUERIDAS EN VERCEL
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key_aqui
TWILIO_ACCOUNT_SID=tu_account_sid_de_twilio
TWILIO_AUTH_TOKEN=tu_auth_token_de_twilio

# ✅ PARA AUTORIZACIÓN AUTOMÁTICA DE CLIENTES (CONFIGURADO)
GOOGLE_CLIENT_ID=[CONFIGURADO_EN_VERCEL]
GOOGLE_CLIENT_SECRET=[CONFIGURADO_EN_VERCEL]

# ❌ YA NO NECESITAS:
# TWILIO_PHONE_NUMBER (se configura por negocio en BD)
```

### **Configuración por Negocio (Base de Datos)**

Cada negocio se configura en la tabla `tenants`:

```sql
INSERT INTO tenants (
    id, business_name, phone_number, 
    address, email, slot_config, calendar_config
) VALUES (
    'mi_peluqueria',
    'Peluquería Bella Vista',
    '34911234567',  -- SIN el +, SOLO números
    'Gran Vía 1, Madrid',
    'info@peluqueria.com',
    '{"slot_granularity": 15, "allow_same_day_booking": true}',
    '{"access_token": "...", "calendar_id": "primary"}'
);
```

## 🔧 **Arquitectura del Sistema**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ WhatsApp Negocio│────│   Vercel API     │────│  Supabase DB    │
│ +34911234567    │    │   Multi-Tenant   │    │  Multi-Tenant   │
├─────────────────┤    │                  │    ├─────────────────┤
│ WhatsApp Negocio│────│  ┌─────────────┐ │    │ ┌─────────────┐ │
│ +34932654321    │    │  │ Auto-Detect │ │    │ │   tenants   │ │
├─────────────────┤    │  │   Tenant    │ │    │ │  services   │ │
│ WhatsApp Negocio│────│  │  by Phone   │ │    │ │appointments │ │
│ +34963987654    │    │  └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                       ┌──────────────────┐
                       │ Google Calendar  │
                       │ (Por Negocio)    │
                       └──────────────────┘
```

## 📱 **Flujo Multi-Tenant**

```
1. Mensaje llega a: whatsapp:+34911234567
2. Sistema busca: tenant con phone_number = '34911234567'  
3. Respuesta: Configuración específica del negocio
4. Reserva: Se guarda en calendario del negocio
5. Confirmación: Desde el número del negocio
```

## 🔗 **API Endpoints**

### **Health Check**
```bash
GET /health                    # Estado del sistema
GET /api/status                # Estado detallado
```

### **Webhook WhatsApp**
```bash
GET  /webhook                  # Verificación webhook
POST /webhook                  # Procesamiento mensajes
```

## 📖 **Comandos del Chatbot**

### **Comandos Básicos**
```
hola                          # Mensaje de bienvenida
precios                       # Lista de servicios y precios  
horarios                      # Horarios del negocio
horarios DD/MM/YYYY          # Disponibilidad fecha específica
```

### **Sistema de Reservas**
```
reservar [servicio] DD/MM/YYYY HH:MM    # Hacer reserva
confirmar                               # Confirmar reserva temporal
cancelar                                # Cancelar reserva temporal
mis citas                              # Ver citas confirmadas
```

### **Ejemplos**
```
reservar corte 25/08/2025 10:00        # Reserva corte de pelo
reservar tinte 26/08/2025 14:30        # Reserva tinte
horarios 25/08/2025                    # Ver disponibilidad
```

## 🛠️ **Configuración Avanzada**

### **Agregar Nuevos Negocios**
```sql
-- Usar plantilla database/add_new_tenant.sql
-- Cambiar todos los valores marcados con 🔥
-- Ejecutar en Supabase SQL Editor
```

### **Configurar Google Calendar**
```bash
# 1. Seguir guía: GOOGLE_CALENDAR_SETUP.md
# 2. Ejecutar: node setup-google-auth.js
# 3. Actualizar BD con tokens obtenidos
```

### **Testing Completo**
```bash
# Seguir guía: TESTING_COMPLETE.md
# Incluye todos los casos de prueba
```

## 💰 **Modelo de Negocio**

### **Costos Operativos**
- **Hosting**: Gratis (Vercel)
- **Base de Datos**: Gratis hasta 50k requests/mes (Supabase)
- **WhatsApp**: €0.005 por mensaje (Twilio)
- **Google Calendar**: Gratis hasta 1M requests/mes

### **Escalabilidad**
- ✅ **Ilimitados negocios** en la misma instalación
- ✅ **Una cuenta Twilio** para todos los números
- ✅ **Configuración independiente** por negocio
- ✅ **Rendimiento optimizado** con índices de BD

## 🛠️ **Desarrollo**

### **Estructura del Proyecto**
```
├── api/                      # Vercel Serverless API
│   └── chatbot.js           # Endpoint principal
├── database/                # Scripts SQL
│   ├── update_tables_for_calendar.sql
│   ├── setup_default_tenant.sql
│   └── add_new_tenant.sql
├── GOOGLE_CALENDAR_SETUP.md # Guía configuración
├── MULTI_TENANT_GUIDE.md    # Guía sistema multi-tenant
├── TESTING_COMPLETE.md      # Guía testing completa
└── setup-google-auth.js     # Script OAuth2 Google
```

### **Comandos de Desarrollo**
```bash
# Desarrollo local
npm run dev

# Deploy a Vercel
vercel --prod

# Testing API
curl https://whatsapp-chat-bot-xi.vercel.app/health
```

## 📚 **Documentación Adicional**

- 📋 [**MULTI_TENANT_GUIDE.md**](MULTI_TENANT_GUIDE.md) - Sistema multi-tenant completo
- 📅 [**GOOGLE_CALENDAR_SETUP.md**](GOOGLE_CALENDAR_SETUP.md) - Configuración Google Calendar
- 🧪 [**TESTING_COMPLETE.md**](TESTING_COMPLETE.md) - Guía de testing completa

## 🤝 **Contribuir**

1. Fork el proyecto
2. Crea tu branch (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push al branch (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 **Licencia**

Este proyecto está bajo la Licencia MIT - ver [LICENSE](LICENSE) para más detalles.

## 🆘 **Soporte**

- 📧 **Email**: andresvelascofdez@gmail.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/Andresvelascofdez/WhatsappChatBot/issues)
- 📖 **Documentación**: Ver archivos `.md` en el proyecto

---

⭐ **¡Dale una estrella si este proyecto te ayuda!**

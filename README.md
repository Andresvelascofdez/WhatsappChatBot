# 🤖 WhatsApp Booking Chatbot - Sistema Multi-Tenant

**Chatbot inteligente de WhatsApp para reservas de citas con integración completa de Google Calendar**

[![Deploy Status](https://img.shields.io/badge/Deploy-Vercel-brightgreen)](https://whatsapp-chat-bot-xi.vercel.app/health)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

## 🚀 **Estado del Sistema - ¡COMPLETAMENTE FUNCIONAL!** ✨

| Componente | Estado | Funcionalidad |
|------------|--------|---------------|
| 🎨 **Panel Admin Completo** | ✅ **FUNCIONANDO** | Gestión completa de clientes con interfaz moderna |
| 👥 **Gestión de Clientes** | ✅ **COMPLETO** | Agregar, editar, ver, activar/desactivar clientes |
| 🕒 **Horarios de Trabajo** | ✅ **AVANZADO** | Configuración por día, jornada partida, días cerrados |
| 💼 **Gestión de Servicios** | ✅ **DINÁMICO** | Servicios con precios, duración, agregar/eliminar |
| ❓ **Sistema de FAQs** | ✅ **INTELIGENTE** | Respuestas automáticas por palabras clave |
| ⚙️ **Configuración Slots** | ✅ **PERSONALIZABLE** | Duración, días máximos, reservas mismo día |
| 🔗 **Google OAuth2** | ✅ **AUTOMATIZADO** | Enlaces de autorización automáticos |
| ⚡ **API Health** | ✅ **MONITOREADA** | [/health](https://whatsapp-chat-bot-xi.vercel.app/health) |
| 📱 **Webhook WhatsApp** | ✅ **ACTIVO** | /webhook (Twilio integrado) |
| 🗄️ **Base de Datos** | ✅ **OPTIMIZADA** | Supabase PostgreSQL con RLS |

> 💡 **¡Panel de Administración 100% Completo!** Sistema profesional listo para producción con todas las funcionalidades implementadas.

## 🎯 **Características Principales**

### � **Panel de Administración Profesional**
- 🏠 **Dashboard Principal**: Vista general con estadísticas en tiempo real
- 👥 **Gestión Completa de Clientes**: Agregar, editar, ver detalles, activar/desactivar
- 📊 **Interfaz Moderna**: Diseño responsive con gradientes y animaciones
- 🔍 **Vista Detallada**: Información completa de cada cliente con métricas

### 🏢 **Sistema Multi-Tenant Avanzado**
- 🔄 **Detección Automática**: Por número de WhatsApp entrante
- ⚙️ **Configuración Individual**: Horarios, servicios, FAQs por negocio
- � **OAuth2 Automático**: Enlaces de autorización Google generados automáticamente
- �📱 **WhatsApp Business API**: Integración completa con Twilio

### 🕒 **Gestión de Horarios Inteligente**
- 📅 **Configuración Semanal**: Horarios diferentes por día
- 🔄 **Jornada Partida**: Configuración mañana/tarde independiente
- 🚫 **Días Cerrados**: Manejo de días no laborables
- ⏰ **Validación Automática**: Solo reservas en horarios disponibles

### 💼 **Sistema de Servicios Dinámico**
- ➕ **Agregar/Eliminar**: Servicios en tiempo real
- 💰 **Precios Flexibles**: Configuración en euros con decimales
- ⏱️ **Duración Variable**: Por servicio (5-480 minutos)
- 🎯 **Validación**: Mínimo un servicio por cliente

### ❓ **FAQs Inteligentes**
- 🔍 **Palabras Clave**: Detección automática de consultas
- 📂 **Categorización**: Organización por temas
- 🤖 **Respuestas Automáticas**: Bot responde instantáneamente
- 📝 **Gestión Dinámica**: Agregar/editar/eliminar FAQs fácilmente

### 🔧 **Configuración Avanzada de Slots**
- ⏰ **Granularidad**: 15, 30 o 60 minutos
- 📆 **Días Máximos**: Configurar anticipación máxima (1-365 días)
- 🚀 **Mismo Día**: Permitir/bloquear reservas el mismo día
- 🎯 **Slots Consecutivos**: Sin buffers - máxima eficiencia

### 📅 **Integración Google Calendar**
- 🔄 **Sincronización Automática**: Citas bidireccionales
- ✅ **Verificación Disponibilidad**: Evita conflictos automáticamente
- 🔔 **Notificaciones**: Confirmaciones y recordatorios
- 🗄️ **Base de Datos**: PostgreSQL con Supabase y Row Level Security

### ⚡ **Arquitectura Serverless**
- 🚀 **Vercel**: Desplegado para máximo rendimiento
- 🔄 **Sistema de Holds**: Reservas temporales con confirmación (5 min)
- 📊 **Monitoreo**: Health checks y logging completo
- � **Seguridad**: RLS en base de datos y validaciones completas

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

## 🚀 **Demo en Vivo y Accesos**

### 🎨 **Panel de Administración**
- **URL Principal**: [https://whatsapp-chat-bot-xi.vercel.app/admin](https://whatsapp-chat-bot-xi.vercel.app/admin)
- **Gestión de Clientes**: [/admin/manage-clients](https://whatsapp-chat-bot-xi.vercel.app/admin/manage-clients)
- **Agregar Cliente**: [/admin/add-client](https://whatsapp-chat-bot-xi.vercel.app/admin/add-client)

### 🔧 **APIs y Monitoreo**
- **API Health**: [https://whatsapp-chat-bot-xi.vercel.app/health](https://whatsapp-chat-bot-xi.vercel.app/health)
- **Webhook WhatsApp**: `https://whatsapp-chat-bot-xi.vercel.app/webhook`
- **Autorización Google**: `/admin/google-auth-callback`

### 📱 **Funcionalidades del Panel**
- ✅ **Dashboard**: Vista general con estadísticas en tiempo real
- ✅ **Lista de Clientes**: Tabla responsive con filtros y acciones
- ✅ **Agregar Cliente**: Formulario completo con validaciones
- ✅ **Editar Cliente**: Modificación completa de todos los datos
- ✅ **Ver Detalles**: Información completa del cliente
- ✅ **Activar/Desactivar**: Control de estado de clientes
- ✅ **Horarios Avanzados**: Configuración semanal con jornada partida
- ✅ **Gestión de Servicios**: Agregar/editar/eliminar dinámicamente
- ✅ **Sistema de FAQs**: Respuestas automáticas inteligentes

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
# 3. 📝 Completar formulario interactivo completo:
#    • Información del negocio
#    • Horarios de trabajo (por día, jornada partida)
#    • Servicios con precios y duración
#    • FAQs con palabras clave
#    • Configuración de slots personalizada
# 4. 🔗 Sistema genera automáticamente enlace de autorización Google
# 5. ✅ ¡Cliente listo para usar el chatbot!

# 💡 Panel incluye gestión completa:
#    • Lista de clientes con filtros
#    • Edición completa de datos
#    • Vista detallada con métricas
#    • Activar/desactivar clientes
#    • Estadísticas en tiempo real
```

### **🖼️ Funcionalidades del Panel**

#### 📊 **Dashboard Principal**
- Vista general con métricas en tiempo real
- Acceso directo a todas las funciones
- Diseño moderno y responsive

#### 👥 **Gestión de Clientes**
- **Lista Completa**: Tabla con todos los clientes
- **Agregar Nuevo**: Formulario completo paso a paso
- **Editar Cliente**: Modificación de todos los datos
- **Ver Detalles**: Información completa y métricas
- **Control de Estado**: Activar/desactivar clientes

#### 🕒 **Configuración de Horarios**
- **Por Día**: Configuración individual de cada día
- **Jornada Partida**: Configuración mañana/tarde
- **Días Cerrados**: Manejo de días no laborables
- **Copiar Horarios**: Duplicar configuración entre días
- **Cerrar Fines de Semana**: Función automática

#### 💼 **Gestión de Servicios**
- **Agregar Dinámico**: Añadir servicios en tiempo real
- **Configuración Completa**: Nombre, precio, duración
- **Validaciones**: Precios en euros, duraciones lógicas
- **Eliminar**: Remover servicios no necesarios

#### ❓ **Sistema de FAQs**
- **Preguntas/Respuestas**: Configuración completa
- **Palabras Clave**: Para detección automática
- **Categorización**: Organización por temas
- **Gestión Dinámica**: Agregar/editar/eliminar

#### ⚙️ **Configuración Avanzada**
- **Granularidad de Slots**: 15, 30 o 60 minutos
- **Días Máximos**: Anticipación para reservas
- **Mismo Día**: Permitir/bloquear reservas
- **Zona Horaria**: Configuración por cliente
- **Estado Activo**: Control de disponibilidad

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
├── api/                           # Vercel Serverless API
│   ├── index.js                   # Endpoint principal del chatbot
│   ├── health.js                  # Health check API
│   ├── webhook.js                 # Webhook WhatsApp (Twilio)
│   └── admin/                     # Panel de Administración Completo
│       ├── index.js               # Dashboard principal del admin
│       ├── manage-clients.js      # Lista y gestión de clientes
│       ├── add-client.js          # Formulario agregar cliente
│       ├── client-edit.js         # Formulario editar cliente (COMPLETO)
│       ├── client-view.js         # Vista detallada del cliente
│       ├── toggle-client.js       # Activar/desactivar cliente
│       └── google-auth-callback.js # Callback OAuth2 Google
├── database/                      # Scripts SQL y Migraciones
│   ├── update_tables_for_calendar.sql
│   ├── setup_default_tenant.sql
│   ├── add_new_tenant.sql
│   └── README.md
├── scripts/                       # Scripts de automatización
│   ├── add-client.js             # Script CLI agregar cliente
│   ├── verify-google-config.js   # Verificar configuración Google
│   └── setup-google-auth.js      # Configuración OAuth2
├── docs/                          # Documentación completa
│   ├── MULTI_TENANT_GUIDE.md     # Guía sistema multi-tenant
│   ├── GOOGLE_CALENDAR_SETUP.md  # Configuración Google Calendar
│   ├── TESTING_COMPLETE.md       # Guía testing completa
│   └── AGREGAR_CLIENTES.md       # Guía agregar clientes
├── vercel.json                    # Configuración Vercel
├── package.json                   # Dependencias Node.js
└── README.md                      # Este archivo
```

### **Panel de Administración (api/admin/)**
- 🏠 **index.js**: Dashboard con estadísticas y navegación
- 📋 **manage-clients.js**: Lista completa de clientes con filtros
- ➕ **add-client.js**: Formulario completo para agregar clientes
- ✏️ **client-edit.js**: Formulario completo para editar clientes
- 👁️ **client-view.js**: Vista detallada con toda la información
- 🔄 **toggle-client.js**: Activar/desactivar clientes
- 🔗 **google-auth-callback.js**: Manejo de autorización Google

### **Comandos de Desarrollo**
```bash
# Iniciar aplicación (producción)
npm start

# Deploy a Vercel
vercel --prod

# Testing API y Panel Admin
curl https://whatsapp-chat-bot-xi.vercel.app/health
curl https://whatsapp-chat-bot-xi.vercel.app/admin

# Scripts de gestión de clientes
npm run client:add      # Agregar cliente vía CLI
npm run client:verify   # Verificar configuración Google
```

### **URLs del Sistema Desplegado**
```bash
# Panel de Administración
https://whatsapp-chat-bot-xi.vercel.app/admin
https://whatsapp-chat-bot-xi.vercel.app/admin/manage-clients
https://whatsapp-chat-bot-xi.vercel.app/admin/add-client

# APIs del Sistema
https://whatsapp-chat-bot-xi.vercel.app/health
https://whatsapp-chat-bot-xi.vercel.app/webhook

# Autorización Google (automática)
https://whatsapp-chat-bot-xi.vercel.app/admin/google-auth-callback
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

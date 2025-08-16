# 🚀 Configuración Multi-Cliente con WhatsApp Cloud API (Meta)

## ¿Por qué WhatsApp Cloud API?
- ✅ **GRATIS** hasta 1000 conversaciones/mes por negocio
- ✅ **Multi-tenant** nativo de Meta
- ✅ **Escalable** - pagas solo por uso
- ✅ **Oficial** - Sin riesgo de bloqueo
- ✅ **Tu costo**: €5-20/mes para TODOS los clientes
- ✅ **Tu ganancia**: €30-40/mes × número de clientes

## Cálculo de Rentabilidad

### Escenario Conservador:
- 10 clientes × €35/mes = €350/mes ingresos
- Tu costo total: €15/mes
- **Ganancia neta: €335/mes** 💰

### Escenario Optimista:
- 25 clientes × €35/mes = €875/mes ingresos  
- Tu costo total: €40/mes
- **Ganancia neta: €835/mes** 🚀

## Configuración Paso a Paso

### 1. Crear App en Meta Developers
1. Ve a https://developers.facebook.com/
2. Crear nueva App → Business
3. Agregar producto "WhatsApp Business Platform"
4. Obtener:
   - Phone Number ID
   - Access Token (permanente)
   - Webhook Verify Token

### 2. Configurar Variables Multi-Cliente
```bash
# En lugar de una API key, usarás:
WHATSAPP_CLOUD_ACCESS_TOKEN=tu_token_permanente
WHATSAPP_VERIFY_TOKEN=tu_verify_token
WHATSAPP_PHONE_NUMBER_ID=tu_phone_id

# Multi-tenant: cada cliente tendrá su propio phone_number_id
```

### 3. Precios de WhatsApp Cloud API
- **Primeras 1000 conversaciones/mes**: GRATIS
- **Después**: €0.005-0.025 por conversación
- **Resultado**: €0-15/mes por cliente típico de peluquería

### 4. Tu Margen de Ganancia
- Cliente paga: €35/mes
- Tu costo real: €0-2/mes por cliente
- **Margen: 95%+** 📈

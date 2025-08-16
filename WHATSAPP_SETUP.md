# Configuración de WhatsApp Business API (360dialog)

## 1. Crear cuenta en 360dialog
- Regístrate en https://hub.360dialog.com/
- Verifica tu número de teléfono de negocio
- Obtén tu API key

## 2. Configurar Webhook
En el panel de 360dialog:
- URL del webhook: `https://tu-proyecto.vercel.app/webhook`
- Verify Token: el mismo que pusiste en `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- Eventos a suscribir: `messages`, `message_deliveries`

## 3. Verificar configuración
```bash
# Probar webhook verification
curl "https://tu-proyecto.vercel.app/webhook?hub.mode=subscribe&hub.verify_token=mi_token_secreto_123&hub.challenge=test123"
# Debería devolver: test123
```

## 4. Probar API de salud
```bash
curl https://tu-proyecto.vercel.app/health
# Debería devolver status: healthy
```

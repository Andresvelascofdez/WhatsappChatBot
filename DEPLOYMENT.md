# Guía de Deployment en Vercel

## Paso 1: Preparar el proyecto
```bash
cd c:\Users\Admin\Proyectos\Chatbot
npm run build
npm run typecheck
```

## Paso 2: Instalar Vercel CLI
```bash
npm i -g vercel
```

## Paso 3: Login y configurar
```bash
vercel login
vercel
```

## Paso 4: Configurar variables de entorno en Vercel
En el dashboard de Vercel o via CLI:
```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add WHATSAPP_API_KEY
vercel env add WHATSAPP_WEBHOOK_VERIFY_TOKEN
vercel env add GOOGLE_SERVICE_ACCOUNT_EMAIL
vercel env add GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
vercel env add GOOGLE_CALENDAR_ID
```

## Paso 5: Deploy
```bash
vercel --prod
```

Tu API estará disponible en: https://tu-proyecto.vercel.app

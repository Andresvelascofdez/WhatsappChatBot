#!/usr/bin/env node

/**
 * 🔧 DIAGNÓSTICO Y CORRECCIÓN DE PROBLEMAS OAUTH2
 * 
 * Este script ayuda a diagnosticar y corregir problemas comunes
 * con la configuración de Google OAuth2
 */

console.log('🔧 DIAGNÓSTICO DE PROBLEMAS OAUTH2');
console.log('================================\n');

// Cargar variables de entorno locales si existen
require('dotenv').config({ path: '.env.local' });

function checkGoogleCredentials() {
    console.log('🔐 VERIFICANDO CREDENCIALES GOOGLE OAUTH2');
    console.log('==========================================');
    
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
        console.log('❌ PROBLEMA ENCONTRADO: Credenciales no configuradas');
        console.log('\n💡 SOLUCIÓN:');
        console.log('1. Ve a https://console.cloud.google.com/');
        console.log('2. Crea un proyecto o selecciona uno existente');
        console.log('3. Habilita Google Calendar API');
        console.log('4. Ve a "Credenciales" > "Crear credenciales" > "ID de cliente OAuth 2.0"');
        console.log('5. Tipo de aplicación: "Aplicación web"');
        console.log('6. URIs de redirección autorizados:');
        console.log('   - https://whatsapp-chat-bot-xi.vercel.app/api/oauth/google/callback');
        console.log('   - https://tu-dominio.vercel.app/api/oauth/google/callback (si tienes dominio propio)');
        console.log('\n7. Copia el Client ID y Client Secret al archivo .env.local');
        return false;
    }
    
    console.log('✅ Credenciales encontradas');
    
    // Verificar formato del Client ID
    if (!clientId.includes('.apps.googleusercontent.com')) {
        console.log('⚠️ ADVERTENCIA: Client ID no tiene formato esperado');
        console.log(`   Actual: ${clientId.substring(0, 20)}...`);
        console.log('   Esperado: algo como 123456-abcdef.apps.googleusercontent.com');
    } else {
        console.log('✅ Client ID tiene formato correcto');
    }
    
    // Verificar longitud del secret
    if (clientSecret.length < 20) {
        console.log('⚠️ ADVERTENCIA: Client Secret parece muy corto');
        console.log('   Verifica que copiaste el valor completo');
    } else {
        console.log('✅ Client Secret tiene longitud adecuada');
    }
    
    return true;
}

function generateTestAuthUrl() {
    console.log('\n🔗 GENERANDO URL DE PRUEBA');
    console.log('==========================');
    
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
        console.log('❌ No se puede generar URL sin Client ID');
        return;
    }
    
    const redirectUri = process.env.VERCEL_URL ? 
        `https://${process.env.VERCEL_URL}/api/oauth/google/callback` : 
        'https://whatsapp-chat-bot-xi.vercel.app/api/oauth/google/callback';
    
    const testUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent('https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events')}&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${encodeURIComponent(JSON.stringify({ tenantId: 'test', email: 'test@example.com' }))}`;
    
    console.log('🔗 URL de autorización de prueba:');
    console.log(testUrl);
    
    console.log('\n💡 PRUEBA MANUAL:');
    console.log('1. Copia la URL de arriba');
    console.log('2. Ábrela en un navegador');
    console.log('3. Si aparece "Error 401: invalid_client", las credenciales están mal');
    console.log('4. Si aparece la pantalla de Google para autorizar, ¡está bien!');
    
    return testUrl;
}

function checkRedirectUri() {
    console.log('\n🌐 VERIFICANDO URI DE REDIRECCIÓN');
    console.log('=================================');
    
    const vercelUrl = process.env.VERCEL_URL;
    const redirectUri = vercelUrl ? 
        `https://${vercelUrl}/api/oauth/google/callback` : 
        'https://whatsapp-chat-bot-xi.vercel.app/api/oauth/google/callback';
    
    console.log(`📍 URI de redirección actual: ${redirectUri}`);
    
    console.log('\n💡 VERIFICAR EN GOOGLE CLOUD:');
    console.log('1. Ve a https://console.cloud.google.com/');
    console.log('2. Selecciona tu proyecto');
    console.log('3. Ve a "APIs y servicios" > "Credenciales"');
    console.log('4. Haz clic en tu Client ID OAuth 2.0');
    console.log('5. En "URIs de redirección autorizados" debe estar:');
    console.log(`   ${redirectUri}`);
    console.log('\n6. Si no está, agrégalo y guarda los cambios');
}

function provideSolutions() {
    console.log('\n🚀 SOLUCIONES PASO A PASO');
    console.log('========================');
    
    console.log('\n📋 OPCIÓN A: Configuración Nueva');
    console.log('1. Ve a https://console.cloud.google.com/');
    console.log('2. Crea un proyecto nuevo: "WhatsApp-Bot-OAuth"');
    console.log('3. Habilita APIs: Ve a "APIs y servicios" > "Biblioteca"');
    console.log('4. Busca y habilita "Google Calendar API"');
    console.log('5. Ve a "Credenciales" > "Crear credenciales" > "ID de cliente OAuth 2.0"');
    console.log('6. Tipo: "Aplicación web"');
    console.log('7. Nombre: "WhatsApp Bot Authorization"');
    console.log('8. URI autorizado: https://whatsapp-chat-bot-xi.vercel.app/api/oauth/google/callback');
    console.log('9. Copia Client ID y Secret al archivo .env.local');
    
    console.log('\n🔧 OPCIÓN B: Verificar Configuración Existente');
    console.log('1. Ir a Google Cloud Console');
    console.log('2. Verificar que el proyecto tiene Google Calendar API habilitada');
    console.log('3. Verificar URI de redirección en las credenciales OAuth2');
    console.log('4. Copiar credenciales correctas al .env.local');
    
    console.log('\n📝 ARCHIVO .env.local EJEMPLO:');
    console.log('GOOGLE_CLIENT_ID=123456789-abcdefgh.apps.googleusercontent.com');
    console.log('GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz');
    console.log('VERCEL_URL=whatsapp-chat-bot-xi.vercel.app');
}

function main() {
    const credentialsOk = checkGoogleCredentials();
    
    if (credentialsOk) {
        generateTestAuthUrl();
        checkRedirectUri();
    }
    
    provideSolutions();
    
    console.log('\n🎯 SIGUIENTE PASO:');
    if (!credentialsOk) {
        console.log('1. Configurar credenciales en .env.local');
        console.log('2. Ejecutar este script de nuevo: node scripts/fix-oauth2.js');
    } else {
        console.log('1. Probar la URL de autorización generada arriba');
        console.log('2. Si funciona, configurar las mismas credenciales en Vercel');
    }
}

if (require.main === module) {
    main();
}

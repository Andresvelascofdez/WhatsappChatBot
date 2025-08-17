#!/usr/bin/env node

/**
 * 🔍 SCRIPT DE VERIFICACIÓN DE CONFIGURACIÓN GOOGLE OAUTH2
 * 
 * Verifica que todas las configuraciones necesarias estén en su lugar
 * para autorizar clientes de Google Calendar
 * 
 * Uso:
 * node scripts/verify-google-config.js
 */

const { createClient } = require('@supabase/supabase-js');

async function verifyEnvironmentVariables() {
    console.log('🔍 VERIFICANDO VARIABLES DE ENTORNO');
    console.log('====================================');
    
    const checks = [
        { name: 'SUPABASE_URL', value: process.env.SUPABASE_URL },
        { name: 'SUPABASE_ANON_KEY', value: process.env.SUPABASE_ANON_KEY },
        { name: 'GOOGLE_CLIENT_ID', value: process.env.GOOGLE_CLIENT_ID },
        { name: 'GOOGLE_CLIENT_SECRET', value: process.env.GOOGLE_CLIENT_SECRET },
        { name: 'TWILIO_ACCOUNT_SID', value: process.env.TWILIO_ACCOUNT_SID },
        { name: 'TWILIO_AUTH_TOKEN', value: process.env.TWILIO_AUTH_TOKEN }
    ];

    let allConfigured = true;

    checks.forEach(check => {
        const status = check.value ? '✅' : '❌';
        const value = check.value ? 
            (check.name.includes('SECRET') || check.name.includes('TOKEN') || check.name.includes('KEY') ? 
                `${check.value.substring(0, 8)}...` : check.value) : 
            'No configurada';
        
        console.log(`${status} ${check.name}: ${value}`);
        
        if (!check.value) allConfigured = false;
    });

    return allConfigured;
}

async function verifySupabaseConnection() {
    console.log('\n🗄️ VERIFICANDO CONEXIÓN A SUPABASE');
    console.log('===================================');

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        console.log('❌ Variables de Supabase no configuradas');
        return false;
    }

    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );

        // Verificar conexión listando tenants
        const { data, error } = await supabase
            .from('tenants')
            .select('id, business_name')
            .limit(5);

        if (error) {
            console.log('❌ Error conectando a Supabase:', error.message);
            return false;
        }

        console.log('✅ Conexión a Supabase exitosa');
        console.log(`📊 Tenants encontrados: ${data.length}`);
        
        if (data.length > 0) {
            console.log('📋 Tenants existentes:');
            data.forEach(tenant => {
                console.log(`   - ${tenant.id}: ${tenant.business_name}`);
            });
        }

        return true;
    } catch (error) {
        console.log('❌ Error verificando Supabase:', error.message);
        return false;
    }
}

async function verifyGoogleOAuthConfig() {
    console.log('\n🔐 VERIFICANDO CONFIGURACIÓN GOOGLE OAUTH2');
    console.log('==========================================');

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.log('❌ Credenciales de Google OAuth2 no configuradas');
        console.log('💡 Configura GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET');
        return false;
    }

    // Verificar formato básico del Client ID
    if (!clientId.includes('.googleusercontent.com')) {
        console.log('⚠️ Advertencia: GOOGLE_CLIENT_ID no parece tener el formato correcto');
        console.log('   Debería terminar en .googleusercontent.com');
    } else {
        console.log('✅ GOOGLE_CLIENT_ID tiene formato correcto');
    }

    // Verificar longitud del Client Secret
    if (clientSecret.length < 20) {
        console.log('⚠️ Advertencia: GOOGLE_CLIENT_SECRET parece muy corto');
    } else {
        console.log('✅ GOOGLE_CLIENT_SECRET tiene longitud adecuada');
    }

    // Generar URL de ejemplo
    const redirectUri = process.env.VERCEL_URL ? 
        `https://${process.env.VERCEL_URL}/api/oauth/google/callback` : 
        'https://tu-app.vercel.app/api/oauth/google/callback';

    console.log(`🔗 URL de redirección: ${redirectUri}`);
    
    return true;
}

async function verifyAPIEndpoint() {
    console.log('\n🌐 VERIFICANDO API ENDPOINT');
    console.log('===========================');

    const baseUrl = process.env.VERCEL_URL ? 
        `https://${process.env.VERCEL_URL}` : 
        'https://tu-app.vercel.app';

    try {
        console.log(`🔄 Probando: ${baseUrl}/health`);
        
        const response = await fetch(`${baseUrl}/health`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API responde correctamente');
            console.log(`📊 Status: ${data.status}`);
            console.log(`🎯 Service: ${data.service}`);
        } else {
            console.log(`❌ API responde con error: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log('❌ Error conectando a API:', error.message);
        console.log('💡 Verifica que la aplicación esté desplegada en Vercel');
        return false;
    }

    return true;
}

function showNextSteps(allConfigured) {
    console.log('\n🚀 PRÓXIMOS PASOS');
    console.log('=================');

    if (!allConfigured) {
        console.log('❌ Configuración incompleta. Completar lo siguiente:');
        console.log('');
        console.log('1. 📋 Configurar variables de entorno faltantes');
        console.log('2. 🌐 Verificar que Google Cloud está configurado:');
        console.log('   - Proyecto creado en https://console.cloud.google.com/');
        console.log('   - Google Calendar API habilitada');
        console.log('   - Credenciales OAuth2 creadas');
        console.log('   - URL de redirección configurada');
        console.log('3. 🚀 Re-ejecutar este script');
    } else {
        console.log('✅ Todo configurado correctamente. Puedes:');
        console.log('');
        console.log('1. 🏢 Agregar nuevo cliente:');
        console.log('   node scripts/add-new-client.js');
        console.log('');
        console.log('2. 🔐 Generar enlace de autorización:');
        console.log('   node scripts/authorize-client-calendar.js TENANT_ID EMAIL');
        console.log('');
        console.log('3. 🧪 Probar el sistema completo siguiendo TESTING_STEPS.md');
    }
}

async function main() {
    console.log('🔍 VERIFICADOR DE CONFIGURACIÓN GOOGLE OAUTH2');
    console.log('==============================================');
    console.log('');

    const envOk = await verifyEnvironmentVariables();
    const supabaseOk = await verifySupabaseConnection();
    const googleOk = await verifyGoogleOAuthConfig();
    const apiOk = await verifyAPIEndpoint();

    const allConfigured = envOk && supabaseOk && googleOk && apiOk;

    console.log('\n📊 RESUMEN');
    console.log('==========');
    console.log(`${envOk ? '✅' : '❌'} Variables de entorno`);
    console.log(`${supabaseOk ? '✅' : '❌'} Conexión a Supabase`);
    console.log(`${googleOk ? '✅' : '❌'} Configuración Google OAuth2`);
    console.log(`${apiOk ? '✅' : '❌'} API Endpoint`);
    console.log('');
    console.log(`🎯 Estado general: ${allConfigured ? '✅ Todo listo' : '❌ Requiere configuración'}`);

    showNextSteps(allConfigured);
}

// Ejecutar script si se llama directamente
if (require.main === module) {
    main().catch(console.error);
}

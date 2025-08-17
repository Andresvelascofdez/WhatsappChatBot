#!/usr/bin/env node

/**
 * 🏢 SCRIPT PARA AGREGAR NUEVO CLIENTE COMPLETO
 * 
 * Este script:
 * 1. Agrega el cliente a la base de datos
 * 2. Genera el enlace de autorización de Google Calendar
 * 3. Opcionalmente envía el enlace por email/WhatsApp
 * 
 * Uso:
 * node scripts/add-new-client.js
 */

const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');
const { generateAuthUrl } = require('./authorize-client-calendar.js');

// Configuración
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function main() {
    console.log('🏢 AGREGAR NUEVO CLIENTE AL SISTEMA');
    console.log('=====================================');
    console.log('');

    // Verificar configuración
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('❌ Error: Configura las variables de entorno de Supabase');
        console.error('💡 Variables necesarias: SUPABASE_URL, SUPABASE_ANON_KEY');
        process.exit(1);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    try {
        // Recopilar información del cliente
        console.log('📝 INFORMACIÓN DEL NEGOCIO:');
        const tenantId = await question('🆔 ID del negocio (ej: barberia_madrid): ');
        const businessName = await question('🏢 Nombre del negocio: ');
        const phoneNumber = await question('📱 Número de WhatsApp (sin +, ej: 34911234567): ');
        const email = await question('📧 Email de Google Calendar: ');
        const address = await question('📍 Dirección (opcional): ') || null;

        console.log('');
        console.log('💰 SERVICIOS DEL NEGOCIO:');
        console.log('Agrega los servicios uno por uno. Escribe "fin" para terminar.');
        
        const services = [];
        let serviceIndex = 1;
        
        while (true) {
            console.log(`\n--- Servicio ${serviceIndex} ---`);
            const serviceName = await question('🎯 Nombre del servicio (o "fin" para terminar): ');
            
            if (serviceName.toLowerCase() === 'fin') break;
            
            const price = parseFloat(await question('💰 Precio (ej: 25.50): '));
            const duration = parseInt(await question('⏰ Duración en minutos (ej: 30): '));
            
            services.push({
                name: serviceName,
                price: price,
                duration_minutes: duration
            });
            
            serviceIndex++;
        }

        // Mostrar resumen
        console.log('\n📋 RESUMEN DEL CLIENTE:');
        console.log('========================');
        console.log(`🆔 ID: ${tenantId}`);
        console.log(`🏢 Negocio: ${businessName}`);
        console.log(`📱 WhatsApp: +${phoneNumber}`);
        console.log(`📧 Email: ${email}`);
        console.log(`📍 Dirección: ${address || 'No especificada'}`);
        console.log(`🎯 Servicios: ${services.length}`);
        services.forEach((service, i) => {
            console.log(`   ${i+1}. ${service.name} - €${service.price} (${service.duration_minutes}min)`);
        });

        const confirm = await question('\n✅ ¿Confirmar creación del cliente? (y/n): ');
        if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
            console.log('❌ Operación cancelada');
            process.exit(0);
        }

        // Crear tenant en base de datos
        console.log('\n💾 Guardando en base de datos...');
        
        const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .insert([{
                id: tenantId,
                business_name: businessName,
                phone_number: phoneNumber,
                email: email,
                address: address,
                business_hours: {
                    monday: { open: "09:00", close: "18:00", closed: false },
                    tuesday: { open: "09:00", close: "18:00", closed: false },
                    wednesday: { open: "09:00", close: "18:00", closed: false },
                    thursday: { open: "09:00", close: "18:00", closed: false },
                    friday: { open: "09:00", close: "18:00", closed: false },
                    saturday: { open: "09:00", close: "14:00", closed: false },
                    sunday: { open: "09:00", close: "14:00", closed: true }
                },
                slot_config: {
                    slot_duration_minutes: 30,
                    booking_advance_days: 30,
                    booking_advance_hours: 2
                }
            }])
            .select();

        if (tenantError) {
            throw new Error(`Error creando tenant: ${tenantError.message}`);
        }

        console.log('✅ Cliente creado en base de datos');

        // Crear servicios
        console.log('💾 Guardando servicios...');
        
        const servicesWithTenant = services.map(service => ({
            ...service,
            tenant_id: tenantId
        }));

        const { error: servicesError } = await supabase
            .from('services')
            .insert(servicesWithTenant);

        if (servicesError) {
            throw new Error(`Error creando servicios: ${servicesError.message}`);
        }

        console.log(`✅ ${services.length} servicios creados`);

        // Generar enlace de autorización de Google Calendar
        console.log('\n🔐 Generando enlace de autorización...');
        
        const authUrl = generateAuthUrl(tenantId, email);

        console.log('\n🎉 ¡CLIENTE CREADO EXITOSAMENTE!');
        console.log('================================');
        console.log('');
        console.log('🔗 ENLACE DE AUTORIZACIÓN DE GOOGLE CALENDAR:');
        console.log('==============================================');
        console.log(authUrl);
        console.log('');
        console.log('📱 INSTRUCCIONES PARA EL CLIENTE:');
        console.log('1. Copia el enlace de arriba');
        console.log('2. Ábrelo en tu navegador');
        console.log('3. Inicia sesión con: ' + email);
        console.log('4. Acepta los permisos');
        console.log('5. ¡Listo! El calendario se configurará automáticamente');
        console.log('');

        // Preguntar si enviar por email
        const sendEmail = await question('📧 ¿Enviar enlace por email al cliente? (y/n): ');
        if (sendEmail.toLowerCase() === 'y' || sendEmail.toLowerCase() === 'yes') {
            console.log('📧 Funcionalidad de envío de email pendiente de implementar');
            console.log('💡 Por ahora, copia el enlace manualmente y envíalo al cliente');
        }

        // Preguntar si abrir navegador
        const openBrowser = await question('🌐 ¿Abrir enlace en navegador para probar? (y/n): ');
        if (openBrowser.toLowerCase() === 'y' || openBrowser.toLowerCase() === 'yes') {
            const { exec } = require('child_process');
            const command = process.platform === 'win32' ? 'start' :
                          process.platform === 'darwin' ? 'open' : 'xdg-open';
            
            exec(`${command} "${authUrl}"`, (error) => {
                if (error) {
                    console.error('❌ Error abriendo navegador:', error.message);
                } else {
                    console.log('✅ Navegador abierto con el enlace de autorización');
                }
            });
        }

        console.log('\n🚀 PRÓXIMOS PASOS:');
        console.log('==================');
        console.log('1. ✅ Cliente agregado a la base de datos');
        console.log('2. 🔐 Enviar enlace de autorización al cliente');
        console.log('3. ⏳ Esperar a que el cliente autorice Google Calendar');
        console.log('4. 🎯 Configurar webhook de WhatsApp en Twilio');
        console.log('5. 🚀 ¡Sistema listo para recibir reservas!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

// Ejecutar script si se llama directamente
if (require.main === module) {
    main().catch(console.error);
}

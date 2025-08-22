// Test simple de Web3Forms para diagnóstico
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    console.log('📄 Cargando variables de entorno...');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    envLines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
                process.env[key] = valueParts.join('=');
            }
        }
    });
}

async function testSimpleEmail() {
    console.log('🧪 TEST SIMPLE DE WEB3FORMS');
    console.log('================================\n');
    
    const accessKey = process.env.WEB3FORMS_ACCESS_KEY;
    const fromEmail = process.env.DEFAULT_FROM_EMAIL;
    const toEmail = 'lukovskyfc@gmail.com';
    
    console.log('📧 Configuración:');
    console.log(`   Access Key: ${accessKey ? accessKey.substring(0, 10) + '...' : 'NO CONFIGURADA'}`);
    console.log(`   From Email: ${fromEmail}`);
    console.log(`   To Email: ${toEmail}\n`);
    
    // Test 1: Email texto plano muy simple
    console.log('🧪 TEST 1: Email texto plano simple');
    try {
        const simpleFormData = {
            access_key: accessKey,
            name: 'Test Sistema',
            email: toEmail,
            subject: 'TEST SIMPLE - WhatsApp Bot',
            message: 'Este es un mensaje de prueba muy simple del sistema WhatsApp Bot.'
        };

        const response1 = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(simpleFormData)
        });

        const result1 = await response1.json();
        console.log(`   Status: ${response1.status}`);
        console.log(`   Success: ${result1.success}`);
        console.log(`   Message: ${result1.message}`);
        console.log(`   Resultado: ${result1.success ? '✅ ÉXITO' : '❌ ERROR'}\n`);
        
    } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}\n`);
    }
    
    // Test 2: Con from_email específico
    console.log('🧪 TEST 2: Con from_email específico');
    try {
        const withFromEmailData = {
            access_key: accessKey,
            name: 'Test Sistema',
            email: toEmail,
            subject: 'TEST CON FROM_EMAIL - WhatsApp Bot',
            message: 'Este es un mensaje de prueba con from_email específico.',
            from_email: fromEmail
        };

        const response2 = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(withFromEmailData)
        });

        const result2 = await response2.json();
        console.log(`   Status: ${response2.status}`);
        console.log(`   Success: ${result2.success}`);
        console.log(`   Message: ${result2.message}`);
        console.log(`   Resultado: ${result2.success ? '✅ ÉXITO' : '❌ ERROR'}\n`);
        
    } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}\n`);
    }
    
    // Test 3: Verificar la configuración de Web3Forms
    console.log('🧪 TEST 3: Verificar configuración de Web3Forms');
    try {
        const verifyResponse = await fetch(`https://api.web3forms.com/forms/${accessKey}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (verifyResponse.ok) {
            const formConfig = await verifyResponse.json();
            console.log('   ✅ Configuración de Web3Forms encontrada:');
            console.log(`   Form ID: ${formConfig.id || 'N/A'}`);
            console.log(`   Status: ${formConfig.status || 'N/A'}`);
            console.log(`   Created: ${formConfig.created_at || 'N/A'}`);
            console.log(`   Emails enviados: ${formConfig.emails_sent || 0}`);
        } else {
            console.log(`   ❌ Error verificando configuración: ${verifyResponse.status}`);
        }
    } catch (error) {
        console.log(`   ❌ Error verificando configuración: ${error.message}`);
    }
    
    console.log('\n================================');
    console.log('🔍 DIAGNÓSTICO COMPLETADO');
    console.log('================================');
    
    console.log('\n💡 RECOMENDACIONES:');
    console.log('1. Revisa TODAS las carpetas de Gmail (Bandeja, Spam, Promociones, etc.)');
    console.log('2. Busca por "WhatsApp Bot" o "Test Sistema" en Gmail');
    console.log('3. Si Web3Forms muestra éxito pero no llegan, puede ser problema de entrega');
    console.log('4. Considera verificar tu dominio en Web3Forms para mejor entrega');
}

testSimpleEmail().catch(console.error);

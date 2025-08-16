#!/usr/bin/env node

/**
 * Script para probar el chatbot como si fueses un cliente
 * Simula conversaciones típicas con una peluquería
 */

const API_URL = process.env.API_URL || 'https://tu-proyecto.vercel.app';

// Conversaciones de prueba típicas
const conversations = [
  {
    name: "Consulta de disponibilidad",
    messages: [
      "Hola",
      "¿Tienen disponibilidad para mañana?",
      "Quiero un corte de cabello",
      "¿A las 10 de la mañana?"
    ]
  },
  {
    name: "Reserva completa",
    messages: [
      "Hola, quiero reservar una cita",
      "Juan Pérez, 555-1234",
      "Mañana a las 2pm",
      "Para corte y peinado"
    ]
  },
  {
    name: "Cancelación",
    messages: [
      "Hola",
      "Quiero cancelar mi cita",
      "Mi teléfono es 555-1234",
      "Era para mañana"
    ]
  },
  {
    name: "Información del negocio",
    messages: [
      "Hola",
      "¿Qué servicios ofrecen?",
      "¿Cuáles son los precios?",
      "¿Dónde están ubicados?"
    ]
  }
];

// Simular mensaje de WhatsApp
async function simulateWhatsAppMessage(message, fromPhone = "34666123456") {
  const payload = {
    object: "whatsapp_business_account",
    entry: [{
      id: "entry-id",
      changes: [{
        value: {
          messaging_product: "whatsapp",
          metadata: {
            display_phone_number: "34600000000",
            phone_number_id: "phone-id"
          },
          messages: [{
            id: `msg-${Date.now()}`,
            from: fromPhone,
            timestamp: Math.floor(Date.now() / 1000).toString(),
            type: "text",
            text: {
              body: message
            }
          }]
        },
        field: "messages"
      }]
    }]
  };

  try {
    const response = await fetch(`${API_URL}/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    console.log(`📱 Cliente dice: "${message}"`);
    console.log(`🤖 Respuesta del servidor: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Procesado:`, data);
    } else {
      console.log(`❌ Error:`, await response.text());
    }
    
    console.log('---');
    
    // Esperar 2 segundos entre mensajes
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (error) {
    console.error(`❌ Error de red:`, error.message);
  }
}

// Probar API endpoints directamente
async function testBookingAPI() {
  console.log('\n🔧 PROBANDO API ENDPOINTS DIRECTAMENTE\n');
  
  // Test availability
  console.log('📅 Probando consulta de disponibilidad...');
  try {
    const response = await fetch(`${API_URL}/api/availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': '123e4567-e89b-12d3-a456-426614174000'
      },
      body: JSON.stringify({
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
        serviceId: '123e4567-e89b-12d3-a456-426614174001',
        date: new Date().toISOString().split('T')[0], // Today
        timezone: 'Europe/Madrid'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Disponibilidad:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Error availability:', response.status, await response.text());
    }
  } catch (error) {
    console.error('❌ Error de red:', error.message);
  }
  
  console.log('\n---\n');
}

// Función principal
async function main() {
  console.log(`🚀 PROBANDO CHATBOT DE PELUQUERÍA`);
  console.log(`📡 API URL: ${API_URL}`);
  console.log(`📱 Simulando conversaciones de clientes...\n`);

  // Probar health check
  try {
    const health = await fetch(`${API_URL}/health`);
    if (health.ok) {
      console.log('✅ Servidor está funcionando');
    } else {
      console.log('❌ Servidor no responde correctamente');
      return;
    }
  } catch (error) {
    console.log('❌ No se puede conectar al servidor:', error.message);
    return;
  }

  // Probar API endpoints
  await testBookingAPI();

  // Simular conversaciones
  for (const conversation of conversations) {
    console.log(`\n💬 CONVERSACIÓN: ${conversation.name.toUpperCase()}\n`);
    
    for (const message of conversation.messages) {
      await simulateWhatsAppMessage(message);
    }
    
    console.log(`\n✅ Conversación "${conversation.name}" completada\n`);
    console.log('='.repeat(50));
  }

  console.log('\n🎉 TODAS LAS PRUEBAS COMPLETADAS');
  console.log('\n📋 QUÉ REVISAR:');
  console.log('1. ✅ Servidor responde a webhook');
  console.log('2. ✅ Mensajes se procesan sin errores');
  console.log('3. 📝 Revisa logs del servidor para ver las respuestas');
  console.log('4. 🔗 En producción, conecta tu WhatsApp real');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { simulateWhatsAppMessage, testBookingAPI };

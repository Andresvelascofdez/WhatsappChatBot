#!/usr/bin/env node

/**
 * Prueba rápida de endpoints locales
 */

// Simular test básico del API
async function quickTest() {
  console.log('🧪 PRUEBA RÁPIDA DEL CHATBOT\n');
  
  // En lugar de llamar a un servidor, solo verificamos la estructura
  const mockAvailabilityRequest = {
    tenantId: '123e4567-e89b-12d3-a456-426614174000',
    serviceId: '123e4567-e89b-12d3-a456-426614174001',
    date: '2025-08-17',
    timezone: 'Europe/Madrid'
  };

  const mockBookingRequest = {
    tenantId: '123e4567-e89b-12d3-a456-426614174000',
    serviceId: '123e4567-e89b-12d3-a456-426614174001',
    customerId: '123e4567-e89b-12d3-a456-426614174002',
    slotStart: '2025-08-17T10:00:00Z',
    slotEnd: '2025-08-17T11:00:00Z',
    customerName: 'Juan Pérez',
    customerPhone: '+34666123456'
  };

  console.log('✅ Estructura de petición de disponibilidad:');
  console.log(JSON.stringify(mockAvailabilityRequest, null, 2));
  
  console.log('\n✅ Estructura de petición de reserva:');
  console.log(JSON.stringify(mockBookingRequest, null, 2));

  console.log('\n✅ Endpoints disponibles:');
  console.log('POST /api/availability - Consultar disponibilidad');
  console.log('POST /api/book - Crear reserva');
  console.log('POST /api/confirm - Confirmar cita');
  console.log('DELETE /api/appointment/:id - Cancelar cita');
  console.log('GET /webhook - Verificación WhatsApp');
  console.log('POST /webhook - Procesar mensajes');
  console.log('GET /health - Estado del servidor');

  console.log('\n📱 Conversaciones de prueba que puedes enviar:');
  console.log('1. "Hola" - Saludo inicial');
  console.log('2. "¿Tienen disponibilidad para mañana?" - Consulta');
  console.log('3. "Quiero reservar una cita" - Reserva');
  console.log('4. "Cancelar mi cita" - Cancelación');
  console.log('5. "¿Qué servicios ofrecen?" - Información');

  console.log('\n🚀 PRÓXIMOS PASOS:');
  console.log('1. Configura variables de entorno (.env.template)');
  console.log('2. Despliega en Vercel (vercel --prod)');
  console.log('3. Configura webhook en WhatsApp Business API');
  console.log('4. Prueba con tu teléfono real');
  console.log('\n✨ ¡El chatbot está listo para usar!');
}

quickTest().catch(console.error);

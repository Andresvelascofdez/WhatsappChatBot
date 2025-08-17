// WhatsApp Chatbot API for Vercel
// Updated for customer management and appointment_date field
module.exports = async (req, res) => {
  const { method, url } = req;
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Parse URL path
    const urlPath = url.split('?')[0];
    
    // Route handling
    switch (true) {
      case urlPath === '/' && method === 'GET':
        return res.status(200).json({
          message: 'WhatsApp Chatbot API is running!',
          endpoints: ['/health', '/api/status', '/webhook'],
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        });
        
      case urlPath === '/health' && method === 'GET':
        return res.status(200).json({
          status: 'ok',
          timestamp: new Date().toISOString(),
          service: 'WhatsApp Chatbot API',
          version: '1.0.0'
        });
        
      case urlPath === '/api/status' && method === 'GET':
        return res.status(200).json({
          status: 'API is working',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'production'
        });
        
      case urlPath === '/webhook' && method === 'POST':
        // Parse request body
        let body = '';
        
        if (req.body) {
          body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        } else {
          // Read body stream for raw requests
          const chunks = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          body = Buffer.concat(chunks).toString();
        }
        
        console.log('Webhook received:', {
          method,
          url,
          headers: req.headers,
          body: body.substring(0, 500) // Log first 500 chars
        });
        
        // Process WhatsApp message
        try {
          // Intentar parsear como JSON primero (formato genérico)
          let webhookData;
          try {
            webhookData = JSON.parse(body);
          } catch (jsonError) {
            // Si no es JSON, parsear como form-data de Twilio
            webhookData = parseFormData(body);
          }
          
          await processWhatsAppMessage(webhookData);
        } catch (parseError) {
          console.error('Error parsing webhook data:', parseError);
        }
        
        return res.status(200).json({
          status: 'received',
          timestamp: new Date().toISOString(),
          message: 'Webhook processed successfully',
          bodyLength: body.length
        });
        
      case urlPath === '/webhook' && method === 'GET':
        // Webhook verification (for WhatsApp setup)
        const mode = req.query?.['hub.mode'];
        const token = req.query?.['hub.verify_token'];
        const challenge = req.query?.['hub.challenge'];
        
        console.log('Webhook verification:', { mode, token, challenge });
        
        // Si no hay parámetros de verificación, mostrar información del webhook
        if (!mode && !token && !challenge) {
          return res.status(200).json({
            status: 'Webhook endpoint active',
            message: 'This endpoint is ready to receive WhatsApp webhooks',
            usage: 'Configure this URL in your WhatsApp provider dashboard',
            url: `${req.headers.host || 'whatsapp-chat-bot-xi.vercel.app'}/webhook`,
            timestamp: new Date().toISOString()
          });
        }
        
        // Verificación de WhatsApp
        const expectedToken = process.env.WEBHOOK_VERIFY_TOKEN || 'chatbot_verify_2024';
        
        if (mode === 'subscribe' && (token === expectedToken || !process.env.WEBHOOK_VERIFY_TOKEN)) {
          console.log('✅ Webhook verification successful');
          return res.status(200).send(challenge);
        } else {
          console.log('❌ Webhook verification failed:', { mode, token, expectedToken });
          return res.status(403).json({
            error: 'Forbidden',
            message: 'Invalid verification token',
            expected: expectedToken ? 'Token configured' : 'No token set',
            received: token || 'No token provided',
            hint: 'Configure WEBHOOK_VERIFY_TOKEN environment variable'
          });
        }
        
      default:
        return res.status(404).json({
          error: 'Not Found',
          message: `Endpoint ${method} ${urlPath} not found`,
          availableEndpoints: ['GET /', 'GET /health', 'GET /api/status', 'POST /webhook', 'GET /webhook'],
          timestamp: new Date().toISOString()
        });
    }
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Función para parsear datos de formulario (Twilio format)
function parseFormData(body) {
  const params = new URLSearchParams(body);
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
}

// Función para procesar mensajes de WhatsApp
async function processWhatsAppMessage(webhookData) {
  try {
    console.log('Processing WhatsApp message:', JSON.stringify(webhookData, null, 2));
    
    // Detectar si es formato Twilio (form-data) o formato genérico (JSON)
    if (webhookData.MessageSid && webhookData.Body && webhookData.From) {
      // Formato Twilio
      await processTwilioMessage(webhookData);
    } else if (webhookData.entry && Array.isArray(webhookData.entry)) {
      // Formato genérico
      await processGenericWebhook(webhookData);
    } else {
      console.log('Unknown webhook format');
    }
  } catch (error) {
    console.error('Error processing WhatsApp message:', error);
  }
}

// Función para procesar mensajes de Twilio
async function processTwilioMessage(data) {
  try {
    const { From, To, Body, ProfileName, WaId, MessageSid } = data;
    
    // Extraer números de teléfono (remover 'whatsapp:+' del inicio)
    const customerPhoneNumber = From.replace('whatsapp:+', '');
    const businessPhoneNumber = To.replace('whatsapp:+', '');
    const contactName = ProfileName || 'Usuario';
    
    console.log(`Mensaje de ${contactName} (${customerPhoneNumber}) para negocio (${businessPhoneNumber}):`, {
      body: Body,
      messageId: MessageSid
    });
    
    // Buscar configuración del tenant por número de teléfono
    const tenantConfig = await getTenantByPhoneNumber(businessPhoneNumber);
    
    if (!tenantConfig) {
      console.error(`No se encontró tenant para el número: ${businessPhoneNumber}`);
      return;
    }
    
    // Generar respuesta personalizada según el tenant
    const response = await generateResponse(
      Body.toLowerCase().trim(), 
      customerPhoneNumber, 
      contactName, 
      tenantConfig
    );
    
    if (response) {
      await sendWhatsAppMessage(customerPhoneNumber, response, tenantConfig);
    }
  } catch (error) {
    console.error('Error processing Twilio message:', error);
  }
}

// Función para procesar webhooks genéricos
async function processGenericWebhook(webhookData) {
  try {
    for (const entry of webhookData.entry) {
      if (!entry.changes || !Array.isArray(entry.changes)) {
        continue;
      }
      
      for (const change of entry.changes) {
        if (change.field === 'messages' && change.value) {
          await handleMessagesChange(change.value);
        }
      }
    }
  } catch (error) {
    console.error('Error processing generic webhook:', error);
  }
}

// Función para manejar cambios de mensajes
async function handleMessagesChange(messageData) {
  try {
    // Procesar mensajes entrantes
    if (messageData.messages && Array.isArray(messageData.messages)) {
      for (const message of messageData.messages) {
        await processIncomingMessage(message, messageData.contacts || []);
      }
    }
    
    // Procesar estados de mensajes (entregado, leído, etc.)
    if (messageData.statuses && Array.isArray(messageData.statuses)) {
      for (const status of messageData.statuses) {
        console.log('Message status update:', status);
      }
    }
  } catch (error) {
    console.error('Error handling messages change:', error);
  }
}

// Función para procesar mensaje entrante
async function processIncomingMessage(message, contacts) {
  try {
    const { from, type, text, timestamp } = message;
    
    // Buscar información del contacto
    const contact = contacts.find(c => c.wa_id === from);
    const contactName = contact?.profile?.name || 'Usuario';
    
    // NOTA: En webhooks genéricos, necesitamos obtener el número de destino del contexto
    // Por ahora usaremos un tenant por defecto hasta implementar la identificación completa
    const businessPhoneNumber = '14155238886'; // Fallback para webhooks genéricos
    
    console.log(`Mensaje de ${contactName} (${from}) para negocio (${businessPhoneNumber}):`, {
      type,
      text: text?.body,
      timestamp
    });
    
    // Buscar configuración del tenant por número de teléfono
    const tenantConfig = await getTenantByPhoneNumber(businessPhoneNumber);
    
    if (!tenantConfig) {
      console.error(`No se encontró tenant para el número: ${businessPhoneNumber}`);
      return;
    }
    
    // Solo procesar mensajes de texto por ahora
    if (type === 'text' && text?.body) {
      const messageText = text.body.toLowerCase().trim();
      const response = await generateResponse(messageText, from, contactName, tenantConfig);
      
      if (response) {
        await sendWhatsAppMessage(from, response, tenantConfig);
      }
    }
  } catch (error) {
    console.error('Error processing incoming message:', error);
  }
}

// Función para buscar tenant por número de teléfono
async function getTenantByPhoneNumber(phoneNumber) {
  try {
    // Normalizar número de teléfono (quitar + y otros caracteres)
    const normalizedPhone = phoneNumber.replace(/[^0-9]/g, '');
    
    console.log(`🔍 Buscando tenant para número: ${phoneNumber} -> normalizado: ${normalizedPhone}`);
    
    // Configuración de Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not configured');
      // Retornar configuración por defecto para desarrollo
      return getDefaultTenantConfig();
    }
    
    // Buscar tenant por número de teléfono normalizado
    const response = await fetch(`${supabaseUrl}/rest/v1/tenants?phone=eq.${normalizedPhone}&select=*`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('Error fetching tenant:', await response.text());
      return getDefaultTenantConfig();
    }
    
    const tenants = await response.json();
    
    if (tenants.length === 0) {
      console.log(`No tenant found for phone number: ${phoneNumber}`);
      return getDefaultTenantConfig();
    }
    
    const tenant = tenants[0];
    console.log(`Found tenant: ${tenant.name} (ID: ${tenant.id})`);

    // Cargar servicios del tenant con configuraciones de slots
    const servicesResponse = await fetch(`${supabaseUrl}/rest/v1/services?tenant_id=eq.${tenant.id}&select=*`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    let services = [];
    if (servicesResponse.ok) {
      services = await servicesResponse.json();
    }
    
    // Cargar FAQs del tenant
    const faqsResponse = await fetch(`${supabaseUrl}/rest/v1/faqs?tenant_id=eq.${tenant.id}&is_active=eq.true&order=priority.desc,created_at.desc`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    let faqs = [];
    if (faqsResponse.ok) {
      faqs = await faqsResponse.json();
    }
    
    return {
      ...tenant,
      services: services,
      faqs: faqs
    };
    
  } catch (error) {
    console.error('Error getting tenant by phone number:', error);
    return getDefaultTenantConfig();
  }
}

// Función para obtener configuración por defecto
function getDefaultTenantConfig() {
  return {
    id: 'default',
    name: 'Peluquería Bella Vista',
    phone: '14155238886',
    address: 'Calle Principal 123',
    business_hours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '09:00', close: '15:00' },
      sunday: { closed: true }
    },
    slot_config: {
      slot_granularity: 15, // Slots cada 15 minutos
      allow_same_day_booking: true,
      max_advance_booking_days: 30
    },
    services: [
      { 
        id: 1, 
        name: 'Corte de pelo', 
        price: 15, 
        duration_minutes: 30,
        custom_slot_duration: null // Usar duration_minutes
      },
      { 
        id: 2, 
        name: 'Corte + Barba', 
        price: 25, 
        duration_minutes: 45, // 15 min más que corte solo
        custom_slot_duration: null
      },
      { 
        id: 3, 
        name: 'Tinte', 
        price: 35, 
        duration_minutes: 60,
        custom_slot_duration: null
      },
      { 
        id: 4, 
        name: 'Mechas', 
        price: 45, 
        duration_minutes: 90, // Servicio largo
        custom_slot_duration: null
      }
    ],
    faqs: [
      {
        id: 1,
        question: '¿Cuáles son nuestros precios?',
        answer: 'Nuestros precios son: Corte €15, Corte + Barba €25, Tinte €35, Mechas €45',
        keywords: ['precio', 'precios', 'coste', 'costo', 'cuanto', 'cuánto'],
        category: 'precios'
      },
      {
        id: 2,
        question: '¿Cuáles son nuestros horarios?',
        answer: 'Abrimos de Lunes a Viernes de 9:00 a 18:00, Sábados de 9:00 a 15:00. Domingos cerrado.',
        keywords: ['horario', 'horarios', 'abierto', 'cerrado', 'horas'],
        category: 'horarios'
      }
    ]
  };
}

// Función para buscar FAQ relevante
function findRelevantFAQ(messageText, faqs) {
  if (!faqs || faqs.length === 0) return null;
  
  const words = messageText.toLowerCase().split(' ').filter(word => word.length > 2);
  let bestMatch = null;
  let bestScore = 0;
  
  faqs.forEach(faq => {
    let score = 0;
    
    // Buscar coincidencias en keywords
    if (faq.keywords && Array.isArray(faq.keywords)) {
      faq.keywords.forEach(keyword => {
        if (messageText.includes(keyword.toLowerCase())) {
          score += 10; // Alta puntuación para keywords exactas
        }
      });
    }
    
    // Buscar coincidencias en la pregunta
    words.forEach(word => {
      if (faq.question.toLowerCase().includes(word)) {
        score += 5;
      }
    });
    
    // Buscar coincidencias en la respuesta
    words.forEach(word => {
      if (faq.answer.toLowerCase().includes(word)) {
        score += 2;
      }
    });
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = faq;
    }
  });
  
  // Solo devolver si hay una coincidencia razonable (score >= 8)
  return bestScore >= 8 ? bestMatch : null;
}

// Función para generar respuesta basada en el mensaje
async function generateResponse(messageText, phoneNumber, contactName, tenantConfig) {
  try {
    const businessName = tenantConfig.business_name || 'nuestra empresa';
    const services = tenantConfig.services || [];
    const faqs = tenantConfig.faqs || [];
    
    // Saludos
    if (messageText.match(/^(hola|hello|hi|buenas|buenos días|buenas tardes|buenas noches)$/)) {
      return `¡Hola ${contactName}! 👋 Bienvenido/a a ${businessName}. 

¿En qué puedo ayudarte hoy?

📅 *reservar* - Hacer una cita
📋 *servicios* - Ver nuestros servicios
🕒 *horarios* - Ver horarios disponibles
❓ *ayuda* - Más opciones`;
    }
    
    // Buscar en FAQs antes que las respuestas hardcodeadas
    const relevantFAQ = findRelevantFAQ(messageText, faqs);
    if (relevantFAQ) {
      return `💡 *${relevantFAQ.question}*

${relevantFAQ.answer}

¿Te ha sido útil esta información? ¿Necesitas algo más?`;
    }
    
    // Hacer reserva - Detectar diferentes formatos
    if (messageText.includes('reservar') || messageText.includes('cita') || messageText.includes('reserva')) {
      // Intentar parsear comando completo: "reservar [servicio] [fecha] [hora]"
      const reserveMatch = messageText.match(/reservar\s+(.+?)\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}:\d{2})/);
      
      if (reserveMatch) {
        const [, serviceName, dateStr, timeStr] = reserveMatch;
        return await processFullReservationCommand(serviceName, dateStr, timeStr, phoneNumber, contactName, tenantConfig);
      }
      
      // Si no tiene formato completo, mostrar instrucciones
      let servicesText = '';
      services.forEach((service, index) => {
        servicesText += `   ${index + 1}. ${service.name} - €${service.price} (${service.duration_minutes || 30} min)\n`;
      });
      
      return `📅 *Hacer una Reserva*

Para realizar tu reserva, puedes:

🔢 *Opción 1: Comando completo*
Escribe: *reservar [servicio] [fecha] [hora]*
Ejemplo: reservar corte 25/08/2025 10:00

🔢 *Opción 2: Paso a paso*
Responde con el número del servicio:

${servicesText}
Ejemplo: escribe *1* para Corte de pelo

💡 *Tip*: Usa el formato DD/MM/YYYY para fechas`;
    }
    
    // Procesar selección de servicio por número
    if (messageText.match(/^[1-9]$/)) {
      const serviceIndex = parseInt(messageText) - 1;
      if (serviceIndex >= 0 && serviceIndex < services.length) {
        const selectedService = services[serviceIndex];
        
        return `✅ *Servicio seleccionado: ${selectedService.name}*
💰 Precio: €${selectedService.price}
⏱️ Duración: ${selectedService.duration_minutes || 30} minutos

📅 *Ahora elige la fecha*
Escribe la fecha en formato DD/MM/YYYY
Ejemplo: 25/08/2025

💡 Horarios disponibles: ${getBusinessHoursText(tenantConfig.business_hours)}`;
      }
    }
    
    // Procesar fecha (formato DD/MM/YYYY)
    const dateMatch = messageText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dateMatch) {
      const [, day, month, year] = dateMatch;
      const requestedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      
      // Aquí necesitaríamos mantener estado de la conversación
      // Por simplicidad, vamos a pedir que usen el comando completo
      return `📅 *Fecha recibida: ${day}/${month}/${year}*

Para continuar, usa el comando completo:
*reservar [servicio] ${day}/${month}/${year} [hora]*

Ejemplo: reservar corte ${day}/${month}/${year} 10:00

⏰ Horarios disponibles: ${getBusinessHoursText(tenantConfig.business_hours)}`;
    }
    
    // Confirmar cita
    if (messageText === 'confirmar') {
      return await processAppointmentConfirmation(phoneNumber, contactName, tenantConfig);
    }
    
    // Cancelar cita
    if (messageText === 'cancelar') {
      return await processAppointmentCancellation(phoneNumber, tenantConfig);
    }
    
    // Ver servicios
    if (messageText.includes('servicios') || messageText.includes('precios') || messageText.includes('precio')) {
      let servicesText = `💇‍♀️ *Nuestros Servicios*\n\n`;
      
      services.forEach(service => {
        const duration = service.duration_minutes ? ` (${service.duration_minutes} min)` : '';
        servicesText += `✂️ *${service.name}* - €${service.price}${duration}\n`;
        if (service.description) {
          servicesText += `   ${service.description}\n`;
        }
        servicesText += '\n';
      });
      
      servicesText += '¿Te interesa algún servicio? Escribe *reservar* para hacer tu cita.';
      return servicesText;
    }
    
    // Ver horarios
    if (messageText.includes('horarios') || messageText.includes('horario') || messageText.includes('disponibles')) {
      const hoursText = getBusinessHoursText(tenantConfig.business_hours);
      
      return `🕒 *Horarios Disponibles*

${hoursText}

⏰ *Turnos cada 30 minutos*
⏱️ *Duración promedio*:
${services.map(s => `   • ${s.name}: ${s.duration_minutes || 30} min`).join('\n')}

Para verificar disponibilidad en una fecha específica, escribe *reservar*.`;
    }
    
    // Ayuda
    if (messageText.includes('ayuda') || messageText.includes('help') || messageText.includes('opciones')) {
      let helpText = `❓ *Centro de Ayuda*

📱 *Comandos disponibles:*
• *reservar* - Hacer una cita
• *servicios* - Ver servicios y precios
• *horarios* - Ver horarios disponibles
• *contacto* - Información de contacto
• *ubicacion* - Cómo llegar

💬 *También puedes escribir libremente*
Te ayudaré a resolver cualquier duda sobre nuestros servicios.`;

      // Agregar FAQs populares si existen
      if (faqs.length > 0) {
        helpText += `\n\n🔍 *Preguntas frecuentes:*\n`;
        faqs.slice(0, 3).forEach((faq, index) => {
          helpText += `${index + 1}. ${faq.question}\n`;
        });
      }

      helpText += '\n¿En qué más puedo ayudarte?';
      return helpText;
    }
    
    // Contacto
    if (messageText.includes('contacto') || messageText.includes('teléfono') || messageText.includes('telefono')) {
      return `📞 *Información de Contacto*

🏪 *${businessName}*
📍 Dirección: ${tenantConfig.address || 'Dirección no disponible'}
📞 Teléfono: +${tenantConfig.phone}
${tenantConfig.email ? `📧 Email: ${tenantConfig.email}\n` : ''}
🕒 *Horarios de Atención*
${getBusinessHoursText(tenantConfig.business_hours)}

¿Necesitas algo más?`;
    }
    
    // Ubicación
    if (messageText.includes('ubicacion') || messageText.includes('ubicación') || messageText.includes('dirección') || messageText.includes('direccion') || messageText.includes('llegar')) {
      return `📍 *Cómo Llegar*

🏪 *${businessName}*
📍 ${tenantConfig.address || 'Dirección no disponible'}

🚗 *En coche*: Parking disponible
🚌 *Transporte público*: Consulta líneas locales
🚶‍♀️ *A pie*: Centro de la ciudad

🗺️ Busca "${businessName}" en Google Maps

¿Necesitas más información?`;
    }
    
    // Respuesta por defecto para mensajes no reconocidos
    let defaultResponse = `Gracias por tu mensaje, ${contactName}. 

No estoy seguro de cómo ayudarte con eso. Aquí tienes las opciones disponibles:

📅 *reservar* - Hacer una cita
📋 *servicios* - Ver servicios y precios  
🕒 *horarios* - Ver horarios disponibles
📞 *contacto* - Información de contacto
❓ *ayuda* - Más opciones`;

    // Sugerir FAQs si no encontramos coincidencia exacta
    if (faqs.length > 0) {
      defaultResponse += `\n\n🔍 *¿Te refieres a alguna de estas preguntas?*\n`;
      faqs.slice(0, 3).forEach((faq, index) => {
        defaultResponse += `${index + 1}. ${faq.question}\n`;
      });
    }

    defaultResponse += '\n¿Qué te gustaría hacer?';
    return defaultResponse;
    
  } catch (error) {
    console.error('Error generating response:', error);
    return 'Disculpa, ha ocurrido un error. Por favor, intenta de nuevo.';
  }
}

// ==================== RESERVATION FLOW HANDLERS ====================

// Función para procesar comando completo de reserva
async function processFullReservationCommand(serviceName, dateStr, timeStr, phoneNumber, contactName, tenantConfig) {
  try {
    // Buscar servicio por nombre
    const service = tenantConfig.services.find(s => 
      s.name.toLowerCase().includes(serviceName.toLowerCase())
    );
    
    if (!service) {
      const availableServices = tenantConfig.services.map(s => `• ${s.name}`).join('\n');
      return `❌ *Servicio no encontrado*

Servicios disponibles:
${availableServices}

Intenta de nuevo: *reservar [servicio] ${dateStr} ${timeStr}*`;
    }
    
    // Validar fecha
    const [day, month, year] = dateStr.split('/');
    const requestedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (requestedDate < today) {
      return `❌ *Fecha inválida*

No puedes reservar en el pasado. 
Intenta con una fecha futura: *reservar ${serviceName} [DD/MM/YYYY] ${timeStr}*`;
    }
    
    // Validar hora
    const [hour, minute] = timeStr.split(':');
    const requestedDateTime = new Date(requestedDate);
    requestedDateTime.setHours(parseInt(hour), parseInt(minute), 0, 0);
    
    // Crear fecha/hora de fin
    const endDateTime = new Date(requestedDateTime.getTime() + (service.duration_minutes || 30) * 60000);
    
    // Generar slots disponibles para ese día
    const slotsResult = await generateAvailableSlots(tenantConfig, service.id, `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    
    if (!slotsResult.success) {
      return `❌ *${slotsResult.error}*

Intenta con otro día: *reservar ${serviceName} [DD/MM/YYYY] ${timeStr}*`;
    }
    
    // Verificar si el horario solicitado está disponible
    console.log(`🔍 Buscando slot para ${hour}:${minute.padStart(2, '0')}. Slots disponibles:`, slotsResult.slots.map(slot => {
      const slotStart = new Date(slot.startTime);
      return `${slotStart.getHours()}:${slotStart.getMinutes().toString().padStart(2, '0')} (display: ${slot.displayTime})`;
    }));
    
    const requestedSlot = slotsResult.slots.find(slot => {
      const slotStart = new Date(slot.startTime);
      const slotHour = slotStart.getHours();
      const slotMinute = slotStart.getMinutes();
      const requestedHour = parseInt(hour);
      const requestedMinute = parseInt(minute);
      
      console.log(`🔍 Comparando slot ${slotHour}:${slotMinute.toString().padStart(2, '0')} con solicitado ${requestedHour}:${requestedMinute.toString().padStart(2, '0')}`);
      return slotHour === requestedHour && slotMinute === requestedMinute;
    });
    
    console.log(`🔍 Slot encontrado:`, requestedSlot ? `SÍ - ${requestedSlot.displayTime}` : 'NO');
    
    if (!requestedSlot) {
      let availableSlotsText = '';
      slotsResult.slots.forEach((slot, index) => {
        const duration = `${slot.serviceDuration} min`;
        availableSlotsText += `${index + 1}. ${slot.displayTime} - ${duration}\n`;
      });
      
      if (availableSlotsText === '') {
        return `❌ *No hay horarios disponibles para ${dateStr}*

Intenta con otro día: *reservar ${serviceName} [DD/MM/YYYY] ${timeStr}*`;
      }
      
      return `❌ *Horario ${timeStr} no disponible para ${dateStr}*

⏰ *Horarios disponibles:*
${availableSlotsText}
💡 *Slots cada ${slotsResult.slotConfig.granularity} min, servicio dura ${slotsResult.slotConfig.serviceDuration} min*

Para reservar: *reservar ${serviceName} ${dateStr} [hora]*
Ejemplo: *reservar ${serviceName} ${dateStr} ${slotsResult.slots[0]?.displayTime}*`;
    }
    
    // Crear hold temporal usando exactamente la duración del servicio
    const holdResult = await createAppointmentHold(
      tenantConfig.id,
      phoneNumber,
      service.id,
      requestedSlot.startTime,
      requestedSlot.endTime,
      {
        serviceDuration: requestedSlot.serviceDuration
      }
    );
    
    if (!holdResult.success) {
      return `❌ *Error al reservar slot*

${holdResult.error}
Intenta de nuevo en unos momentos.`;
    }
    
    // Enviar confirmación con hold
    return `🎯 *¡Slot reservado temporalmente!*

📋 *Detalles de tu reserva:*
👤 Cliente: ${contactName}
💇‍♀️ Servicio: ${service.name}
📅 Fecha: ${dateStr}
🕐 Hora: ${timeStr}
⏱️ Duración: ${service.duration_minutes || 30} min
💰 Precio: €${service.price}

⏰ *Este slot está reservado por 5 minutos*

Para CONFIRMAR tu cita, responde: *confirmar*
Para CANCELAR, responde: *cancelar*

ID de reserva: ${holdResult.appointmentId}`;
    
  } catch (error) {
    console.error('Error processing reservation command:', error);
    return `❌ *Error procesando reserva*

Intenta de nuevo: *reservar [servicio] [DD/MM/YYYY] [HH:MM]*
Ejemplo: *reservar corte 25/08/2025 10:00*`;
  }
}

// Función para procesar confirmación de cita
async function processAppointmentConfirmation(phoneNumber, contactName, tenantConfig) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }
    
    // Buscar hold activo para este cliente
    const response = await fetch(`${supabaseUrl}/rest/v1/appointments?tenant_id=eq.${tenantConfig.id}&customer_phone=eq.${phoneNumber}&status=eq.hold&hold_expires_at=gte.${new Date().toISOString()}&order=created_at.desc&limit=1&select=*,services(*)`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Error fetching appointment hold');
    }
    
    const appointments = await response.json();
    if (appointments.length === 0) {
      return `❌ *No hay reservas pendientes*

No tienes ninguna reserva temporal activa.
Para hacer una nueva reserva: *reservar [servicio] [DD/MM/YYYY] [HH:MM]*`;
    }
    
    const appointment = appointments[0];
    
    // Confirmar la cita
    const confirmResult = await confirmAppointment(appointment.id, {
      phone: phoneNumber,
      name: contactName
    });
    
    if (!confirmResult.success) {
      return `❌ *Error confirmando cita*

${confirmResult.error}
Intenta de nuevo o contacta directamente.`;
    }
    
    const appointmentDate = new Date(appointment.start_time);
    const formattedDate = appointmentDate.toLocaleDateString('es-ES');
    const formattedTime = appointmentDate.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return `✅ *¡Cita confirmada!*

📋 *Detalles confirmados:*
👤 Cliente: ${contactName}
💇‍♀️ Servicio: ${appointment.services.name}
📅 Fecha: ${formattedDate}
🕐 Hora: ${formattedTime}
⏱️ Duración: ${appointment.services.duration_minutes || 30} min
💰 Precio: €${appointment.services.price}

📧 *Se ha creado un evento en el calendario*
🔗 ${confirmResult.eventLink || 'Revisa tu calendario'}

📞 Para cancelar o reprogramar, contacta directamente.
ID de cita: ${confirmResult.appointmentId}`;
    
  } catch (error) {
    console.error('Error confirming appointment:', error);
    return `❌ *Error confirmando cita*

Intenta de nuevo en unos momentos.`;
  }
}

// Función para procesar cancelación de cita  
async function processAppointmentCancellation(phoneNumber, tenantConfig) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }
    
    // Buscar hold activo para cancelar
    const response = await fetch(`${supabaseUrl}/rest/v1/appointments?tenant_id=eq.${tenantConfig.id}&customer_phone=eq.${phoneNumber}&status=eq.hold&hold_expires_at=gte.${new Date().toISOString()}&order=created_at.desc&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Error fetching appointment hold');
    }
    
    const appointments = await response.json();
    if (appointments.length === 0) {
      return `❌ *No hay reservas para cancelar*

No tienes ninguna reserva temporal activa.`;
    }
    
    const appointment = appointments[0];
    
    // Cancelar el hold (eliminar de la base de datos)
    const cancelResponse = await fetch(`${supabaseUrl}/rest/v1/appointments?id=eq.${appointment.id}`, {
      method: 'DELETE',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!cancelResponse.ok) {
      throw new Error('Error canceling appointment hold');
    }
    
    return `✅ *Reserva cancelada*

Tu reserva temporal ha sido cancelada exitosamente.
El slot está ahora disponible para otros clientes.

Para hacer una nueva reserva: *reservar [servicio] [DD/MM/YYYY] [HH:MM]*`;
    
  } catch (error) {
    console.error('Error canceling appointment:', error);
    return `❌ *Error cancelando reserva*

Intenta de nuevo en unos momentos.`;
  }
}

// Función auxiliar para formatear horarios de negocio
function getBusinessHoursText(businessHours) {
  // Si no hay horarios, usar horarios por defecto
  if (!businessHours) {
    businessHours = {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '14:00', closed: false },
      sunday: { open: '09:00', close: '18:00', closed: true }
    };
  }
  
  const days = {
    monday: 'Lunes',
    tuesday: 'Martes', 
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };
  
  let hoursText = '';
  Object.entries(days).forEach(([key, dayName]) => {
    const dayHours = businessHours[key];
    if (dayHours) {
      if (dayHours.closed) {
        hoursText += `📅 *${dayName}*: Cerrado\n`;
      } else {
        hoursText += `📅 *${dayName}*: ${dayHours.open} - ${dayHours.close}\n`;
      }
    }
  });
  
  return hoursText.trim();
}

// ==================== GOOGLE CALENDAR INTEGRATION ====================

// Función para obtener token de acceso de Google Calendar
async function getGoogleCalendarToken(tenantId) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }
    
    // Buscar credenciales de Google Calendar para el tenant
    const response = await fetch(`${supabaseUrl}/rest/v1/tenants?id=eq.${tenantId}&select=calendar_config`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Error fetching tenant calendar config');
    }
    
    const tenants = await response.json();
    if (tenants.length === 0 || !tenants[0].calendar_config) {
      throw new Error('No calendar configuration found for tenant');
    }
    
    return tenants[0].calendar_config;
  } catch (error) {
    console.error('Error getting Google Calendar token:', error);
    throw error;
  }
}

// Función para verificar disponibilidad en Google Calendar
async function checkCalendarAvailability(tenantId, startDateTime, endDateTime) {
  try {
    const calendarConfig = await getGoogleCalendarToken(tenantId);
    const { access_token, calendar_id } = calendarConfig;
    
    if (!access_token || !calendar_id) {
      console.log(`⚠️ Calendar not configured for tenant ${tenantId}`);
      throw new Error('Calendar access token or calendar ID not configured');
    }
    
    const url = `https://www.googleapis.com/calendar/v3/freeBusy`;
    
    const requestBody = {
      timeMin: startDateTime,
      timeMax: endDateTime,
      items: [{ id: calendar_id }]
    };
    
    console.log(`📅 Checking calendar availability:`, {
      tenant: tenantId,
      startDateTime,
      endDateTime,
      calendarId: calendar_id
    });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      console.log(`❌ Calendar API error for tenant ${tenantId}: ${response.status}`);
      throw new Error(`Calendar API error: ${response.status}`);
    }
    
    const result = await response.json();
    const busyTimes = result.calendars?.[calendar_id]?.busy || [];
    
    // Si hay conflictos, el slot no está disponible
    const isAvailable = busyTimes.length === 0;
    console.log(`📅 Calendar result for ${startDateTime}: ${isAvailable ? 'AVAILABLE' : 'BUSY'} (${busyTimes.length} conflicts)`, busyTimes);
    return isAvailable;
  } catch (error) {
    console.error('Error checking calendar availability:', error);
    return false; // En caso de error, no permitir la reserva
  }
}

// Función para crear evento en Google Calendar
async function createCalendarEvent(tenantId, eventDetails) {
  try {
    const calendarConfig = await getGoogleCalendarToken(tenantId);
    const { access_token, calendar_id } = calendarConfig;
    
    if (!access_token || !calendar_id) {
      throw new Error('Calendar access token or calendar ID not configured');
    }
    
    const url = `https://www.googleapis.com/calendar/v3/calendars/${calendar_id}/events`;
    
    const event = {
      summary: eventDetails.summary,
      description: eventDetails.description,
      start: {
        dateTime: eventDetails.startDateTime,
        timeZone: eventDetails.timeZone || 'Europe/Madrid'
      },
      end: {
        dateTime: eventDetails.endDateTime,
        timeZone: eventDetails.timeZone || 'Europe/Madrid'
      },
      attendees: eventDetails.attendees || []
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });
    
    if (!response.ok) {
      throw new Error(`Calendar API error: ${response.status}`);
    }
    
    const result = await response.json();
    return {
      success: true,
      eventId: result.id,
      eventLink: result.htmlLink
    };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return { success: false, error: error.message };
  }
}

// Función para cancelar evento en Google Calendar
async function cancelCalendarEvent(tenantId, eventId) {
  try {
    const calendarConfig = await getGoogleCalendarToken(tenantId);
    const { access_token, calendar_id } = calendarConfig;
    
    if (!access_token || !calendar_id) {
      throw new Error('Calendar access token or calendar ID not configured');
    }
    
    const url = `https://www.googleapis.com/calendar/v3/calendars/${calendar_id}/events/${eventId}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    if (!response.ok && response.status !== 404) {
      throw new Error(`Calendar API error: ${response.status}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error canceling calendar event:', error);
    return { success: false, error: error.message };
  }
}

// ==================== APPOINTMENT MANAGEMENT ====================

// Función para crear hold temporal de slot
async function createAppointmentHold(tenantId, customerPhone, serviceId, startDateTime, endDateTime, slotMetadata = {}) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }
    
    // Crear o buscar customer
    let customerId = null;
    
    // Primero buscar si el customer ya existe
    const existingCustomerResponse = await fetch(`${supabaseUrl}/rest/v1/customers?tenant_id=eq.${tenantId}&phone_number=eq.${customerPhone}&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (existingCustomerResponse.ok) {
      const existingCustomers = await existingCustomerResponse.json();
      if (existingCustomers.length > 0) {
        customerId = existingCustomers[0].id;
        console.log('📱 Customer encontrado:', customerId);
      }
    }
    
    // Si no existe, crear nuevo customer
    if (!customerId) {
      console.log('📱 Creando nuevo customer...');
      const customerResponse = await fetch(`${supabaseUrl}/rest/v1/customers`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          phone_number: customerPhone,
          name: 'Cliente WhatsApp', // Nombre temporal
          created_at: new Date().toISOString()
        })
      });
      
      if (customerResponse.ok) {
        const customerResult = await customerResponse.json();
        customerId = customerResult[0].id;
        console.log('📱 Customer creado:', customerId);
      } else {
        const errorText = await customerResponse.text();
        console.log('📱 Error creando customer:', errorText);
        throw new Error(`Error creating customer: ${customerResponse.status} - ${errorText}`);
      }
    }
    
    // Crear hold temporal (5 minutos)
    const holdExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    
    // Extraer solo la fecha de startDateTime para appointment_date
    const appointmentDate = new Date(startDateTime).toISOString().split('T')[0];
    
    const holdData = {
      tenant_id: tenantId,
      customer_id: customerId,
      customer_phone: customerPhone,
      service_id: serviceId,
      start_time: startDateTime,
      end_time: endDateTime,
      appointment_date: appointmentDate,
      status: 'hold',
      hold_expires_at: holdExpiresAt,
      slot_metadata: slotMetadata
    };
    
    console.log('📝 Creating appointment hold with data:', holdData);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/appointments`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(holdData)
    });
    
    console.log('📝 Database response:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('📝 Database error details:', errorText);
      
      // Intentar parsear el error para más detalles
      try {
        const errorData = JSON.parse(errorText);
        console.log('📝 Parsed error:', errorData);
        throw new Error(`Database error: ${response.status} - ${errorData.message || errorText}`);
      } catch (parseError) {
        throw new Error(`Database error: ${response.status} - ${errorText}`);
      }
    }
    
    const result = await response.json();
    console.log('📝 Appointment hold created successfully:', result);
    return {
      success: true,
      appointmentId: result[0].id,
      holdExpiresAt
    };
  } catch (error) {
    console.error('Error creating appointment hold:', error);
    return { success: false, error: error.message };
  }
}

// Función para confirmar cita
async function confirmAppointment(appointmentId, customerData) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }
    
    // Primero, obtener datos de la cita
    const appointmentResponse = await fetch(`${supabaseUrl}/rest/v1/appointments?id=eq.${appointmentId}&select=*,services(*)`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!appointmentResponse.ok) {
      throw new Error('Error fetching appointment');
    }
    
    const appointments = await appointmentResponse.json();
    if (appointments.length === 0) {
      throw new Error('Appointment not found');
    }
    
    const appointment = appointments[0];
    
    // Verificar que el hold no haya expirado
    if (new Date() > new Date(appointment.hold_expires_at)) {
      throw new Error('Hold has expired');
    }
    
    // Crear/actualizar cliente
    const customerResponse = await fetch(`${supabaseUrl}/rest/v1/customers`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        tenant_id: appointment.tenant_id,
        phone_number: customerData.phone,
        name: customerData.name,
        created_at: new Date().toISOString()
      })
    });
    
    let customerId;
    if (customerResponse.ok) {
      const customerResult = await customerResponse.json();
      customerId = customerResult[0].id;
    } else {
      // Cliente ya existe, buscarlo
      const existingCustomerResponse = await fetch(`${supabaseUrl}/rest/v1/customers?tenant_id=eq.${appointment.tenant_id}&phone_number=eq.${customerData.phone}`, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (existingCustomerResponse.ok) {
        const existingCustomers = await existingCustomerResponse.json();
        if (existingCustomers.length > 0) {
          customerId = existingCustomers[0].id;
        }
      }
    }
    
    // Crear evento en Google Calendar
    const eventDetails = {
      summary: `${appointment.services.name} - ${customerData.name}`,
      description: `Servicio: ${appointment.services.name}\nCliente: ${customerData.name}\nTeléfono: ${customerData.phone}`,
      startDateTime: appointment.start_time,
      endDateTime: appointment.end_time
    };
    
    const calendarResult = await createCalendarEvent(appointment.tenant_id, eventDetails);
    
    if (!calendarResult.success) {
      throw new Error(`Calendar error: ${calendarResult.error}`);
    }
    
    // Actualizar cita a confirmada
    const updateData = {
      customer_id: customerId,
      status: 'confirmed',
      calendar_event_id: calendarResult.eventId,
      confirmed_at: new Date().toISOString()
    };
    
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/appointments?id=eq.${appointmentId}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    if (!updateResponse.ok) {
      throw new Error('Error updating appointment');
    }
    
    return {
      success: true,
      appointmentId,
      calendarEventId: calendarResult.eventId,
      eventLink: calendarResult.eventLink
    };
  } catch (error) {
    console.error('Error confirming appointment:', error);
    return { success: false, error: error.message };
  }
}

// Función para generar slots disponibles
async function generateAvailableSlots(tenantConfig, serviceId, requestedDate) {
  try {
    const service = tenantConfig.services.find(s => s.id === serviceId);
    if (!service) {
      console.log(`Service not found. ServiceId: ${serviceId}, Available services:`, tenantConfig.services.map(s => ({id: s.id, name: s.name})));
      throw new Error('Service not found');
    }
    
    // Crear fecha usando formato YYYY-MM-DD para evitar problemas de zona horaria
    let requestedDateObj;
    if (requestedDate.includes('-')) {
      // Formato YYYY-MM-DD
      const [year, month, day] = requestedDate.split('-');
      requestedDateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
      // Fallback para ISO string
      requestedDateObj = new Date(requestedDate);
    }
    
    console.log(`📅 Processing date: ${requestedDate} -> ${requestedDateObj.toDateString()}`);
    
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][requestedDateObj.getDay()];
    
    // Obtener configuración de slots del tenant
    const slotConfig = tenantConfig.slot_config || {
      slot_granularity: 15,
      allow_same_day_booking: true,
      max_advance_booking_days: 30
    };
    
    // Buscar horarios de negocio - primero en slot_config, luego en business_hours, finalmente por defecto
    const businessHours = slotConfig.business_hours?.[dayOfWeek] || 
                         tenantConfig.business_hours?.[dayOfWeek] || 
                         { open: '09:00', close: '18:00', closed: false };
                         
    if (businessHours.closed) {
      return { success: false, error: 'Business closed on this day' };
    }
    
    const openTime = businessHours.open || '09:00';
    const closeTime = businessHours.close || '18:00';
    
    // Usar duración del servicio directamente (custom_slot_duration o duration_min)
    const serviceDuration = service.custom_slot_duration || service.duration_min || service.duration_minutes || 30;
    const slotGranularity = slotConfig.slot_granularity || 15;
    
    const slots = [];
    const startHour = parseInt(openTime.split(':')[0]);
    const startMinute = parseInt(openTime.split(':')[1]);
    const endHour = parseInt(closeTime.split(':')[0]);
    const endMinute = parseInt(closeTime.split(':')[1]);
    
    let currentTime = new Date(requestedDateObj);
    currentTime.setHours(startHour, startMinute, 0, 0);
    
    const endTime = new Date(requestedDateObj);
    endTime.setHours(endHour, endMinute, 0, 0);
    
    while (currentTime < endTime) {
      // El slot es exactamente la duración del servicio
      const slotEnd = new Date(currentTime.getTime() + serviceDuration * 60000);
      
      // Verificar que el servicio termine antes del cierre
      if (slotEnd <= endTime) {
        // Verificar disponibilidad en calendario para la duración exacta del servicio
        const isAvailable = await checkCalendarAvailability(
          tenantConfig.id,
          currentTime.toISOString(),
          slotEnd.toISOString()
        );
        
        if (isAvailable) {
          slots.push({
            startTime: currentTime.toISOString(),
            endTime: slotEnd.toISOString(),
            displayTime: currentTime.toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit'
            }),
            serviceDuration
          });
        }
      }
      
      // Avanzar según la granularidad configurada
      currentTime = new Date(currentTime.getTime() + slotGranularity * 60000);
    }
    
    return {
      success: true,
      slots: slots, // Mostrar todos los slots disponibles
      slotConfig: {
        granularity: slotGranularity,
        serviceDuration
      }
    };
  } catch (error) {
    console.error('Error generating available slots:', error);
    return { success: false, error: error.message };
  }
}

// Función para enviar mensaje de WhatsApp
async function sendWhatsAppMessage(to, message, tenantConfig = null) {
  try {
    // Limpiar variables de entorno eliminando caracteres de salto de línea
    const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
    
    // Usar número del tenant si está disponible, sino usar fallback hardcoded
    let fromPhoneNumber;
    if (tenantConfig?.phone_number) {
      fromPhoneNumber = `whatsapp:+${tenantConfig.phone_number}`;
    } else {
      fromPhoneNumber = 'whatsapp:+14155238886'; // Fallback para desarrollo/testing
    }
    
    console.log('Twilio credentials check:', {
      accountSid: accountSid ? `${accountSid.substring(0, 8)}...` : 'MISSING',
      authToken: authToken ? `${authToken.substring(0, 8)}...` : 'MISSING',
      fromNumber: fromPhoneNumber,
      tenant: tenantConfig?.business_name || 'Default'
    });
    
    if (!accountSid || !authToken) {
      console.error('Twilio credentials not configured');
      return { success: false, error: 'Twilio credentials missing' };
    }
    
    // Construir URL de la API de Twilio
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    // Asegurar formato correcto para From y To
    const fromNumber = fromPhoneNumber.startsWith('whatsapp:') ? fromPhoneNumber : `whatsapp:${fromPhoneNumber}`;
    const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:+${to}`;
    
    // Preparar datos del mensaje
    const body = new URLSearchParams({
      From: fromNumber,
      To: toNumber,
      Body: message
    });
    
    // Crear header de autenticación
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    
    console.log(`Sending message from ${fromNumber} to ${toNumber} via Twilio`);
    
    // Enviar mensaje usando fetch
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString()
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Message sent successfully:', result.sid);
      return {
        success: true,
        message_id: result.sid,
        to,
        status: result.status
      };
    } else {
      console.error('Twilio API error:', result);
      return { 
        success: false, 
        error: result.message || 'Failed to send message',
        code: result.code
      };
    }
    
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return { success: false, error: error.message };
  }
}

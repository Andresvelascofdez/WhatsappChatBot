// WhatsApp Chatbot API for Vercel
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
      await sendWhatsAppMessage(customerPhoneNumber, response);
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
    const businessPhoneNumber = process.env.DEFAULT_BUSINESS_PHONE || '14155238886';
    
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
        await sendWhatsAppMessage(from, response);
      }
    }
  } catch (error) {
    console.error('Error processing incoming message:', error);
  }
}

// Función para buscar tenant por número de teléfono
async function getTenantByPhoneNumber(phoneNumber) {
  try {
    // Configuración de Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not configured');
      // Retornar configuración por defecto para desarrollo
      return getDefaultTenantConfig();
    }
    
    // Buscar tenant por número de teléfono
    const response = await fetch(`${supabaseUrl}/rest/v1/tenants?phone_number=eq.${phoneNumber}`, {
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
    console.log(`Found tenant: ${tenant.business_name} (ID: ${tenant.id})`);
    
    // Cargar servicios del tenant
    const servicesResponse = await fetch(`${supabaseUrl}/rest/v1/services?tenant_id=eq.${tenant.id}`, {
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
    business_name: 'Peluquería Bella Vista',
    phone_number: '14155238886',
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
    services: [
      { id: 1, name: 'Corte de pelo', price: 15, duration_minutes: 30 },
      { id: 2, name: 'Tinte', price: 25, duration_minutes: 60 },
      { id: 3, name: 'Mechas', price: 35, duration_minutes: 90 },
      { id: 4, name: 'Corte + Tinte', price: 35, duration_minutes: 90 }
    ],
    faqs: [
      {
        id: 1,
        question: '¿Cuáles son nuestros precios?',
        answer: 'Nuestros precios son: Corte €15, Tinte €25, Mechas €35, Corte + Tinte €35',
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
    
    // Hacer reserva
    if (messageText.includes('reservar') || messageText.includes('cita') || messageText.includes('reserva')) {
      let servicesText = '';
      services.forEach((service, index) => {
        servicesText += `   • ${service.name} - €${service.price}\n`;
      });
      
      return `📅 *Hacer una Reserva*

Para realizar tu reserva, necesito algunos datos:

1️⃣ ¿Qué servicio necesitas?
${servicesText}
2️⃣ ¿Qué día prefieres?
   (Formato: DD/MM/YYYY)

3️⃣ ¿En qué horario?
   • Horarios disponibles: ${getBusinessHoursText(tenantConfig.business_hours)}

Escribe: *reservar [servicio] [fecha] [hora]*
Ejemplo: reservar corte 25/08/2025 10:00`;
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
📞 Teléfono: +${tenantConfig.phone_number}
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

// Función auxiliar para formatear horarios de negocio
function getBusinessHoursText(businessHours) {
  if (!businessHours) {
    return '📅 *Consulta horarios*: Contacta directamente';
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

// Función para enviar mensaje de WhatsApp
async function sendWhatsAppMessage(to, message) {
  try {
    // Limpiar variables de entorno eliminando caracteres de salto de línea
    const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
    const twilioWhatsAppNumber = (process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886').trim();
    
    console.log('Twilio credentials check:', {
      accountSid: accountSid ? `${accountSid.substring(0, 8)}...` : 'MISSING',
      authToken: authToken ? `${authToken.substring(0, 8)}...` : 'MISSING',
      twilioNumber: twilioWhatsAppNumber
    });
    
    if (!accountSid || !authToken) {
      console.error('Twilio credentials not configured');
      return { success: false, error: 'Twilio credentials missing' };
    }
    
    // Construir URL de la API de Twilio
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    // Asegurar formato correcto para From y To
    const fromNumber = twilioWhatsAppNumber.startsWith('whatsapp:') ? twilioWhatsAppNumber : `whatsapp:${twilioWhatsAppNumber}`;
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

// WhatsApp Chatbot API for Vercel
// Updated for customer management and appointment_date field
// Added automatic Google Calendar token refresh system
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

      case urlPath === '/admin' && method === 'GET':
      case urlPath === '/admin/' && method === 'GET':
        return res.status(200).json({
          message: 'Admin Panel API',
          version: '1.0.0',
          endpoints: [
            'GET /admin/manage-clients',
            'GET /admin/client-view',
            'GET /admin/client-edit',
            'POST /admin/client-edit',
            'GET /admin/clients',
            'POST /admin/clients', 
            'PUT /admin/clients/:id',
            'GET /admin/clients/:id',
            'PUT /admin/clients/:id/business-hours',
            'POST /admin/clients/:id/faqs',
            'POST /admin/clients/:id/services'
          ],
          timestamp: new Date().toISOString()
        });
        
      case urlPath === '/admin/manage-clients' && method === 'GET':
        // Redirect to dedicated manage clients handler
        const manageClientsHandler = require('./admin/manage-clients.js');
        return await manageClientsHandler(req, res);
        
      case urlPath === '/admin/client-view' && method === 'GET':
        // Redirect to dedicated client view handler
        const clientViewHandler = require('./admin/client-view.js');
        return await clientViewHandler(req, res);
        
      case urlPath === '/admin/client-edit' && (method === 'GET' || method === 'POST'):
        // Redirect to dedicated client edit handler
        const clientEditHandler = require('./admin/client-edit.js');
        return await clientEditHandler(req, res);
        
      case urlPath === '/admin/clients' && method === 'GET':
        return await handleAdminGetClients(req, res);
        
      case urlPath === '/admin/clients' && method === 'POST':
        return await handleAdminCreateClient(req, res);
        
      case urlPath.startsWith('/admin/clients/') && method === 'PUT':
        const clientId = urlPath.split('/')[3];
        return await handleAdminUpdateClient(req, res, clientId);
        
      case urlPath.startsWith('/admin/clients/') && method === 'GET':
        const getClientId = urlPath.split('/')[3];
        return await handleAdminGetClient(req, res, getClientId);
        
      case urlPath.startsWith('/admin/clients/') && urlPath.endsWith('/business-hours') && method === 'PUT':
        const businessHoursClientId = urlPath.split('/')[3];
        return await handleAdminUpdateBusinessHours(req, res, businessHoursClientId);
        
      case urlPath.startsWith('/admin/clients/') && urlPath.endsWith('/faqs') && method === 'POST':
        const faqClientId = urlPath.split('/')[3];
        return await handleAdminCreateFAQ(req, res, faqClientId);
        
      case urlPath.startsWith('/admin/clients/') && urlPath.endsWith('/services') && method === 'POST':
        const serviceClientId = urlPath.split('/')[3];
        return await handleAdminCreateService(req, res, serviceClientId);
        
      case urlPath === '/admin/stats' && method === 'GET':
        return await handleAdminStats(req, res);
        
      case urlPath.startsWith('/admin/clients/') && urlPath.endsWith('/delete-all') && method === 'DELETE':
        const deleteClientId = urlPath.split('/')[3];
        return await handleAdminDeleteClient(req, res, deleteClientId);
        
      default:
        return res.status(404).json({
          error: 'Not Found',
          message: `Endpoint ${method} ${urlPath} not found`,
          availableEndpoints: [
            'GET /', 
            'GET /health', 
            'GET /api/status', 
            'POST /webhook', 
            'GET /webhook', 
            'GET /admin',
            'GET /admin/',
            'GET /admin/clients', 
            'POST /admin/clients', 
            'PUT /admin/clients/:id', 
            'GET /admin/clients/:id',
            'PUT /admin/clients/:id/business-hours',
            'POST /admin/clients/:id/faqs',
            'POST /admin/clients/:id/services',
            'GET /admin/stats',
            'DELETE /admin/clients/:id/delete-all'
          ],
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
    
    // Verificar si el cliente está activo
    if (tenantConfig.active === false) {
      console.log(`⚠️ Cliente ${tenantConfig.name} (${tenantConfig.id}) está inactivo - ignorando mensaje`);
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
    
    // Verificar si el cliente está activo
    if (tenantConfig.active === false) {
      console.log(`⚠️ Cliente ${tenantConfig.name} (${tenantConfig.id}) está inactivo - ignorando mensaje`);
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
    const response = await fetch(`${supabaseUrl}/rest/v1/tenants?phone=eq.${normalizedPhone}&select=*,services(*),faqs(*)`, {
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

    // Normalizar estructura de datos para compatibilidad
    const normalizedTenant = {
      ...tenant,
      business_name: tenant.name, // Mapear name a business_name
      business_hours: tenant.business_hours || {
        monday: { open: '09:00', close: '18:00' },
        tuesday: { open: '09:00', close: '18:00' },
        wednesday: { open: '09:00', close: '18:00' },
        thursday: { open: '09:00', close: '18:00' },
        friday: { open: '09:00', close: '18:00' },
        saturday: { open: '09:00', close: '14:00' },
        sunday: { closed: true }
      },
      // Normalizar servicios con precios en euros
      services: (tenant.services || []).map(service => ({
        ...service,
        price: service.price_cents ? (service.price_cents / 100) : (service.price || 0),
        duration_minutes: service.duration_min || service.duration_minutes || 30
      })),
      faqs: tenant.faqs || []
    };
    
    return normalizedTenant;
    
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
    console.log(`🎯 GENERATE_RESPONSE: Procesando mensaje: "${messageText}"`);
    console.log(`🎯 GENERATE_RESPONSE: MessageText toLowerCase: "${messageText.toLowerCase()}"`);
    
    const businessName = tenantConfig.business_name || tenantConfig.name || 'nuestra empresa';
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
      // Intentar parsear comando completo: "reservar [servicio] DD/MM HH:MM" (sin año)
      const reserveMatch = messageText.match(/reservar\s+(.+?)\s+(\d{1,2}\/\d{1,2})\s+(\d{1,2}:\d{2})/);
      
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
Escribe: *reservar [servicio] DD/MM HH:MM*
Ejemplo: reservar corte 25/08 10:00

🔢 *Opción 2: Paso a paso*
Responde con el número del servicio:

${servicesText}
Ejemplo: escribe *1* para Corte de pelo

💡 *Tip*: Usa el formato DD/MM para fechas (sin año)`;
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
Escribe la fecha en formato DD/MM
Ejemplo: 25/08

💡 Horarios disponibles: ${getBusinessHoursText(tenantConfig.business_hours)}`;
      }
    }
    
    // Consultar huecos disponibles para un día - DEBE IR ANTES QUE EL BLOQUE DE FECHA
    console.log(`🔍 REGEX_TEST: Probando regex para huecos en: "${messageText}"`);
    const huecosMatch = messageText.match(/huecos?\s+(d[ií]a|día|dia)\s+(\d{1,2})\/(\d{1,2})/);
    console.log(`🔍 REGEX_TEST: Resultado del match:`, huecosMatch);
    
    if (huecosMatch) {
      const [, , day, month] = huecosMatch; // Saltamos el segundo capture group
      console.log(`🔍 HUECOS: Usuario solicitó huecos para día ${day}/${month}`);
      console.log(`🔍 HUECOS: Tenant config:`, {
        tenantId: tenantConfig.id,
        name: tenantConfig.name,
        servicesCount: tenantConfig.services?.length || 0,
        services: tenantConfig.services?.map(s => ({id: s.id, name: s.name})) || []
      });
      
      // Debug: Verificar que processAvailableSlotsQuery se va a ejecutar
      console.log(`🔧 HUECOS: Llamando a processAvailableSlotsQuery con day=${day}, month=${month}`);
      
      const result = await processAvailableSlotsQuery(day, month, tenantConfig);
      console.log(`📋 HUECOS: Resultado de processAvailableSlotsQuery:`, {
        resultLength: result?.length || 0,
        resultPreview: result?.substring(0, 200) || 'No result'
      });
      
      return result;
    }
    
    // Procesar fecha (formato DD/MM sin año) - AHORA VA DESPUÉS DE HUECOS
    const dateMatch = messageText.match(/(\d{1,2})\/(\d{1,2})$/);
    if (dateMatch) {
      const [, day, month] = dateMatch;
      const targetYear = determineTargetYear(parseInt(month));
      const requestedDate = `${targetYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      
      // Aquí necesitaríamos mantener estado de la conversación
      // Por simplicidad, vamos a pedir que usen el comando completo
      return `📅 *Fecha recibida: ${day}/${month}/${targetYear}*

Para continuar, usa el comando completo:
*reservar [servicio] ${day}/${month} [hora]*

Ejemplo: reservar corte ${day}/${month} 10:00

⏰ Horarios disponibles: ${getBusinessHoursText(tenantConfig.business_hours)}

💡 Para ver slots disponibles: *huecos dia ${day}/${month}*`;
    }

    // Ayuda
    if (messageText.includes('ayuda') || messageText.includes('help') || messageText.includes('opciones')) {
      let helpText = `❓ *Centro de Ayuda*

📱 *Comandos disponibles:*
• *reservar [servicio] DD/MM HH:MM* - Hacer una cita
• *huecos dia DD/MM* - Ver slots disponibles
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
      const address = tenantConfig.address || 'Dirección no disponible';
      const displayAddress = typeof address === 'string' ? address : 
                           (address.full_address || `${address.street || ''} ${address.city || ''}`.trim());
      
      return `📞 *Información de Contacto*

🏪 *${businessName}*
📍 Dirección: ${displayAddress}
📞 Teléfono: +${tenantConfig.phone}
${tenantConfig.email ? `📧 Email: ${tenantConfig.email}\n` : ''}
🕒 *Horarios de Atención*
${getBusinessHoursText(tenantConfig.business_hours)}

¿Necesitas algo más?`;
    }
    
    // Ubicación
    if (messageText.includes('ubicacion') || messageText.includes('ubicación') || messageText.includes('dirección') || messageText.includes('direccion') || messageText.includes('llegar')) {
      const address = tenantConfig.address || 'Dirección no disponible';
      const displayAddress = typeof address === 'string' ? address : 
                           (address.full_address || `${address.street || ''} ${address.city || ''}`.trim());
      
      return `📍 *Cómo Llegar*

🏪 *${businessName}*
📍 ${displayAddress}

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

// ==================== WHATSAPP MESSAGING ====================

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

// ==================== UTILITY FUNCTIONS ====================

// Función para determinar el año correcto basado en el mes solicitado
function determineTargetYear(requestedMonth) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // getMonth() es 0-based
  const currentYear = now.getFullYear();
  
  // Si estamos en los últimos meses del año (Oct, Nov, Dic) 
  // y se solicita un mes de principio de año (Ene, Feb, Mar, Abr)
  // asumir que se refiere al año siguiente
  if (currentMonth >= 10 && requestedMonth <= 4) {
    return currentYear + 1;
  }
  
  // Si estamos en los primeros meses del año (Ene, Feb, Mar)
  // y se solicita un mes de final del año anterior (Oct, Nov, Dic)
  // asumir que se refiere al año actual (no permitir citas en el pasado)
  if (currentMonth <= 3 && requestedMonth >= 10) {
    return currentYear;
  }
  
  // En cualquier otro caso, usar el año actual
  return currentYear;
}

// Función para procesar consulta de slots disponibles
async function processAvailableSlotsQuery(day, month, tenantConfig) {
  try {
    const targetYear = determineTargetYear(parseInt(month));
    const requestedDate = `${targetYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    console.log(`🔍 Consultando huecos para ${day}/${month}/${targetYear}`);
    
    // Validar que la fecha no sea en el pasado
    const requestedDateObj = new Date(requestedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (requestedDateObj < today) {
      return `❌ *Fecha en el pasado*

No se pueden consultar huecos para ${day}/${month}/${targetYear}.
Intenta con una fecha futura.`;
    }
    
    // Obtener nombre del día de la semana en español
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayName = dayNames[requestedDateObj.getDay()];
    
    console.log(`📅 Día de la semana: ${dayName} para fecha ${requestedDate}`);
    
    let response = `📅 *Huecos libres para ${dayName} ${day}/${month}/${targetYear}*\n\n`;
    
    // Verificar si hay servicios configurados
    if (!tenantConfig.services || tenantConfig.services.length === 0) {
      return response + `❌ No hay servicios configurados.`;
    }
    
    console.log(`🔧 Generando slots para ${tenantConfig.services.length} servicios`);
    
    let hasAvailableSlots = false;
    let allSlots = [];
    
    // Generar slots para cada servicio y recopilar todos los horarios únicos
    for (const service of tenantConfig.services) {
      console.log(`🔧 HUECOS: Procesando servicio: ${service.name} (${service.duration_minutes || 30} min)`);
      console.log(`🔧 HUECOS: Llamando generateAvailableSlots con:`, {
        tenantId: tenantConfig.id,
        serviceId: service.id,
        requestedDate: requestedDate
      });
      
      const slotsResult = await generateAvailableSlots(tenantConfig, service.id, requestedDate);
      
      console.log(`📊 HUECOS: Resultado slots para ${service.name}:`, {
        success: slotsResult.success,
        slotsCount: slotsResult.slots ? slotsResult.slots.length : 0,
        error: slotsResult.error,
        firstSlot: slotsResult.slots?.[0] || null
      });
      
      if (slotsResult.success && slotsResult.slots.length > 0) {
        hasAvailableSlots = true;
        
        // Mostrar slots específicos para este servicio
        response += `💇‍♀️ *${service.name}* (${service.duration_minutes || 30} min)\n`;
        
        const slotsText = slotsResult.slots.map(slot => slot.displayTime).join(', ');
        response += `   ⏰ ${slotsText}\n\n`;
        
        console.log(`✅ HUECOS: Agregado ${slotsResult.slots.length} slots para ${service.name}`);
        
        // Agregar a la lista general de slots
        slotsResult.slots.forEach(slot => {
          if (!allSlots.find(s => s.displayTime === slot.displayTime)) {
            allSlots.push(slot);
          }
        });
      } else {
        console.log(`❌ HUECOS: Sin slots para ${service.name}: ${slotsResult.error || 'Sin motivo específico'}`);
        console.log(`❌ HUECOS: Detalle del error para ${service.name}:`, slotsResult);
      }
    }
    
    // Respuesta final según disponibilidad
    if (!hasAvailableSlots) {
      response += `❌ No hay huecos libres para el ${day}/${month}.\n\n`;
      response += `� Puedes consultar otros días escribiendo "huecos dia X/Y" (ejemplo: "huecos dia 26/08")`;
    } else {
      response += `Para reservar, escribe: *reservar SERVICIO dia ${day}/${month} hora HORA*\n`;
      response += `Ejemplo: "reservar corte dia ${day}/${month} hora 10:00"`;
    }
    
    console.log(`📋 Respuesta final de huecos:`, {
      date: `${day}/${month}`,
      hasSlots: hasAvailableSlots,
      totalUniqueSlots: allSlots.length,
      servicesProcessed: tenantConfig.services.length
    });
    
    return response;
    
  } catch (error) {
    console.error('❌ Error en processAvailableSlotsQuery:', error);
    return 'Lo siento, hubo un error al consultar los huecos disponibles. Por favor, inténtalo de nuevo.';
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
    
    // Validar fecha (ahora puede ser DD/MM o DD/MM/YYYY)
    let day, month, year;
    const dateParts = dateStr.split('/');
    
    if (dateParts.length === 2) {
      // Formato DD/MM - determinar año automáticamente
      [day, month] = dateParts;
      year = determineTargetYear(parseInt(month)).toString();
    } else if (dateParts.length === 3) {
      // Formato DD/MM/YYYY - usar año especificado
      [day, month, year] = dateParts;
    } else {
      return `❌ *Formato de fecha inválido*

Usa: DD/MM o DD/MM/YYYY
Intenta de nuevo: *reservar ${serviceName} [DD/MM] ${timeStr}*`;
    }
    
    const requestedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (requestedDate < today) {
      return `❌ *Fecha inválida*

No puedes reservar en el pasado. 
Intenta con una fecha futura: *reservar ${serviceName} [DD/MM] ${timeStr}*`;
    }
    
    // Validar hora - crear fecha en UTC para evitar problemas de zona horaria
    const [hour, minute] = timeStr.split(':');
    
    // Crear fechas UTC directamente
    const requestedDateTime = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), 0, 0));
    
    // Crear fecha/hora de fin
    const endDateTime = new Date(requestedDateTime.getTime() + (service.duration_minutes || 30) * 60000);
    
    console.log(`🔍 Requested time: ${timeStr} -> UTC: ${requestedDateTime.toISOString()}`);
    
    // Usar las fechas directamente en ISO sin manipular timezone
    const startTimeISO = requestedDateTime.toISOString();
    const endTimeISO = endDateTime.toISOString();
    
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
      
      return `❌ *Horario ${timeStr} no disponible para ${day}/${month}/${year}*

⏰ *Horarios disponibles:*
${availableSlotsText}
💡 *Slots cada ${slotsResult.slotConfig.granularity} min, servicio dura ${slotsResult.slotConfig.serviceDuration} min*

Para reservar: *reservar ${serviceName} ${day}/${month} [hora]*
Ejemplo: *reservar ${serviceName} ${day}/${month} ${slotsResult.slots[0]?.displayTime}*`;
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
📅 Fecha: ${day}/${month}/${year}
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

Intenta de nuevo: *reservar [servicio] [DD/MM] [HH:MM]*
Ejemplo: *reservar corte 25/08 10:00*`;
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
    const response = await fetch(`${supabaseUrl}/rest/v1/appointments?tenant_id=eq.${tenantConfig.id}&customer_phone=eq.${phoneNumber}&status=eq.pending&hold_expires_at=gte.${new Date().toISOString()}&order=created_at.desc&limit=1&select=*,services(*)`, {
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
    
    // Calcular precio correctamente
    const servicePrice = appointment.services.price_cents ? 
                        (appointment.services.price_cents / 100) : 
                        (appointment.services.price || 0);
    
    return `✅ *¡Cita confirmada!*

📋 *Detalles confirmados:*
👤 Cliente: ${contactName}
💇‍♀️ Servicio: ${appointment.services.name}
📅 Fecha: ${formattedDate}
🕐 Hora: ${formattedTime}
⏱️ Duración: ${appointment.services.duration_minutes || appointment.services.duration_min || 30} min
💰 Precio: €${servicePrice}

📧 *Se ha creado un evento en el calendario*

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
    const response = await fetch(`${supabaseUrl}/rest/v1/appointments?tenant_id=eq.${tenantConfig.id}&customer_phone=eq.${phoneNumber}&status=eq.pending&hold_expires_at=gte.${new Date().toISOString()}&order=created_at.desc&limit=1`, {
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
        hoursText += `📅 ${dayName}: Cerrado\n`;
      } else if (dayHours.morning && dayHours.afternoon) {
        // Jornada partida
        const morningOpen = dayHours.morning.open || '09:00';
        const morningClose = dayHours.morning.close || '14:00';
        const afternoonOpen = dayHours.afternoon.open || '16:00';
        const afternoonClose = dayHours.afternoon.close || '18:00';
        hoursText += `📅 ${dayName}: ${morningOpen} - ${morningClose} y ${afternoonOpen} - ${afternoonClose}\n`;
      } else {
        // Jornada normal
        const openTime = dayHours.open || '09:00';
        const closeTime = dayHours.close || '18:00';
        hoursText += `📅 ${dayName}: ${openTime} - ${closeTime}\n`;
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
    
    const calendarConfig = tenants[0].calendar_config;
    
    // Verificar si el token ha expirado
    if (calendarConfig.expires_at && new Date() >= new Date(calendarConfig.expires_at)) {
      console.log(`🔄 Access token expired for tenant ${tenantId}, refreshing...`);
      const refreshedConfig = await refreshGoogleCalendarToken(tenantId, calendarConfig);
      return refreshedConfig;
    }
    
    return calendarConfig;
  } catch (error) {
    console.error('Error getting Google Calendar token:', error);
    throw error;
  }
}

// Función para refrescar token de Google Calendar
async function refreshGoogleCalendarToken(tenantId, currentConfig) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!currentConfig.refresh_token) {
      throw new Error('No refresh token available for tenant');
    }
    
    console.log(`🔄 Refreshing Google Calendar token for tenant ${tenantId}`);
    
    // Hacer solicitud de refresh a Google
    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: currentConfig.refresh_token,
        grant_type: 'refresh_token'
      })
    });
    
    if (!refreshResponse.ok) {
      const errorData = await refreshResponse.text();
      console.error('Error refreshing Google token:', errorData);
      throw new Error(`Failed to refresh token: ${refreshResponse.status}`);
    }
    
    const tokenData = await refreshResponse.json();
    
    // Calcular nueva fecha de expiración (típicamente 1 hora)
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();
    
    // Actualizar configuración del calendario con el nuevo token
    const updatedCalendarConfig = {
      ...currentConfig,
      access_token: tokenData.access_token,
      expires_at: expiresAt
    };
    
    // Si Google envía un nuevo refresh_token, actualizar también
    if (tokenData.refresh_token) {
      updatedCalendarConfig.refresh_token = tokenData.refresh_token;
    }
    
    // Guardar en base de datos
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/tenants?id=eq.${tenantId}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        calendar_config: updatedCalendarConfig
      })
    });
    
    if (!updateResponse.ok) {
      console.error('Error updating calendar config in database');
      throw new Error('Failed to save refreshed token');
    }
    
    console.log(`✅ Google Calendar token refreshed successfully for tenant ${tenantId}`);
    return updatedCalendarConfig;
    
  } catch (error) {
    console.error('Error refreshing Google Calendar token:', error);
    throw error;
  }
}

// Función para verificar disponibilidad en Google Calendar
async function checkCalendarAvailability(tenantId, startDateTime, endDateTime) {
  try {
    // Para el tenant por defecto, no verificar calendario (asumir disponible)
    if (tenantId === 'default') {
      console.log(`📅 Default tenant - skipping calendar check, assuming available`);
      return true;
    }
    
    const calendarConfig = await getGoogleCalendarToken(tenantId);
    const { access_token, calendar_id } = calendarConfig;
    
    if (!access_token || !calendar_id) {
      console.log(`⚠️ Calendar not configured for tenant ${tenantId} - assuming available`);
      return true; // Si no hay configuración, asumir disponible
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
      const errorText = await response.text();
      console.log(`❌ Calendar API error for tenant ${tenantId}: ${response.status} - ${errorText}`);
      
      // Si es error 401 (Unauthorized), intentar refrescar token una vez más
      if (response.status === 401) {
        console.log(`🔄 Attempting to refresh expired token for tenant ${tenantId}`);
        try {
          const refreshedConfig = await refreshGoogleCalendarToken(tenantId, calendarConfig);
          
          // Reintentar la consulta con el token refrescado
          const retryResponse = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${refreshedConfig.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });
          
          if (retryResponse.ok) {
            const retryResult = await retryResponse.json();
            const busyTimes = retryResult.calendars?.[refreshedConfig.calendar_id]?.busy || [];
            const isAvailable = busyTimes.length === 0;
            console.log(`📅 Calendar result (after refresh) for ${startDateTime}: ${isAvailable ? 'AVAILABLE' : 'BUSY'} (${busyTimes.length} conflicts)`, busyTimes);
            return isAvailable;
          }
        } catch (refreshError) {
          console.error('Failed to refresh token and retry:', refreshError);
        }
      }
      
      return true; // En caso de error de API, asumir disponible
    }
    
    const result = await response.json();
    const busyTimes = result.calendars?.[calendar_id]?.busy || [];
    
    // Si hay conflictos, el slot no está disponible
    const isAvailable = busyTimes.length === 0;
    console.log(`📅 Calendar result for ${startDateTime}: ${isAvailable ? 'AVAILABLE' : 'BUSY'} (${busyTimes.length} conflicts)`, busyTimes);
    return isAvailable;
  } catch (error) {
    console.error('Error checking calendar availability:', error);
    return true; // En caso de error, asumir disponible para no bloquear reservas
  }
}

// Función para crear evento en Google Calendar
async function createCalendarEvent(tenantId, eventDetails) {
  try {
    // Para tenant por defecto, no crear evento en calendario
    if (tenantId === 'default') {
      console.log(`📅 Default tenant - skipping calendar event creation`);
      return {
        success: true,
        eventId: 'default-event',
        eventLink: 'No calendar configured'
      };
    }
    
    const calendarConfig = await getGoogleCalendarToken(tenantId);
    const { access_token, calendar_id } = calendarConfig;
    
    if (!access_token || !calendar_id) {
      console.log(`⚠️ Calendar not configured for tenant ${tenantId} - skipping event creation`);
      return {
        success: true,
        eventId: 'no-calendar',
        eventLink: 'Calendar not configured'
      };
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
    
    console.log(`📅 Creating calendar event for tenant ${tenantId}:`, event.summary);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Calendar API error creating event: ${response.status} - ${errorText}`);
      
      // Si es error 401 (Unauthorized), intentar refrescar token
      if (response.status === 401) {
        console.log(`🔄 Attempting to refresh expired token for event creation`);
        try {
          const refreshedConfig = await refreshGoogleCalendarToken(tenantId, calendarConfig);
          
          // Reintentar la creación con el token refrescado
          const retryResponse = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${refreshedConfig.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
          });
          
          if (retryResponse.ok) {
            const retryResult = await retryResponse.json();
            console.log(`✅ Calendar event created successfully (after refresh): ${retryResult.id}`);
            return {
              success: true,
              eventId: retryResult.id,
              eventLink: retryResult.htmlLink
            };
          }
        } catch (refreshError) {
          console.error('Failed to refresh token for event creation:', refreshError);
        }
      }
      
      throw new Error(`Calendar API error: ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`✅ Calendar event created successfully: ${result.id}`);
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

// ==================== SLOT GENERATION ====================

// Función para generar slots disponibles para un servicio en una fecha específica
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
                         
    console.log(`📅 SLOTS: Business hours for ${dayOfWeek}:`, businessHours);
    console.log(`📅 SLOTS: Tenant business_hours config:`, tenantConfig.business_hours);
    console.log(`📅 SLOTS: Slot config business_hours:`, slotConfig.business_hours);
                         
    if (businessHours.closed === true) {
      console.log(`❌ SLOTS: Negocio cerrado el ${dayOfWeek}`);
      return { success: false, error: 'Negocio cerrado este día' };
    }
    
    // Manejar jornada partida vs jornada continua
    let timeSlots = [];
    
    if (businessHours.morning && businessHours.afternoon) {
      // Jornada partida
      timeSlots.push({
        open: businessHours.morning.open || '09:00',
        close: businessHours.morning.close || '14:00'
      });
      timeSlots.push({
        open: businessHours.afternoon.open || '16:00',
        close: businessHours.afternoon.close || '18:00'
      });
    } else {
      // Jornada continua
      timeSlots.push({
        open: businessHours.open || '09:00',
        close: businessHours.close || '18:00'
      });
    }
    
    // Usar duración del servicio directamente (custom_slot_duration o duration_min)
    const serviceDuration = service.custom_slot_duration || service.duration_min || service.duration_minutes || 30;
    const slotGranularity = slotConfig.slot_granularity || 15;
    
    const slots = [];
    
    console.log(`🔧 Generando slots con serviceDuration: ${serviceDuration} min, granularity: ${slotGranularity} min`);
    
    // Generar slots para cada período de tiempo
    for (const timeSlot of timeSlots) {
      const startHour = parseInt(timeSlot.open.split(':')[0]);
      const startMinute = parseInt(timeSlot.open.split(':')[1]);
      const endHour = parseInt(timeSlot.close.split(':')[0]);
      const endMinute = parseInt(timeSlot.close.split(':')[1]);
      
      let currentTime = new Date(Date.UTC(requestedDateObj.getFullYear(), requestedDateObj.getMonth(), requestedDateObj.getDate(), startHour, startMinute, 0, 0));
      
      const endTime = new Date(Date.UTC(requestedDateObj.getFullYear(), requestedDateObj.getMonth(), requestedDateObj.getDate(), endHour, endMinute, 0, 0));
      
      console.log(`⏰ Time slot: ${timeSlot.open} - ${timeSlot.close} (${startHour}:${startMinute} - ${endHour}:${endMinute})`);
      
      while (currentTime < endTime) {
        // El slot es exactamente la duración del servicio
        const slotEnd = new Date(currentTime.getTime() + serviceDuration * 60000);
        
        // Verificar que el servicio termine antes del cierre de este período
        if (slotEnd <= endTime) {
          // Verificar disponibilidad en calendario para la duración exacta del servicio
          const isAvailable = await checkCalendarAvailability(
            tenantConfig.id,
            currentTime.toISOString(),
            slotEnd.toISOString()
          );
          
          if (isAvailable) {
            // Mostrar hora UTC correctamente (los slots se crean en UTC)
            const utcHour = currentTime.getUTCHours();
            const utcMinute = currentTime.getUTCMinutes();
            const displayTime = `${utcHour.toString().padStart(2, '0')}:${utcMinute.toString().padStart(2, '0')}`;
            
            slots.push({
              startTime: currentTime.toISOString(),
              endTime: slotEnd.toISOString(),
              displayTime: displayTime,
              serviceDuration
            });
          }
        }
        
        // Avanzar según la granularidad configurada
        currentTime = new Date(currentTime.getTime() + slotGranularity * 60000);
      }
    }
    
    console.log(`✅ Generated ${slots.length} slots for ${requestedDate}`);
    
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
      status: 'pending',
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
    
    // Normalizar precio del servicio
    if (appointment.services && appointment.services.price_cents && !appointment.services.price) {
      appointment.services.price = appointment.services.price_cents / 100;
    }
    
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
    
    // Obtener información del tenant para la zona horaria
    const tenantResponse = await fetch(`${supabaseUrl}/rest/v1/tenants?id=eq.${appointment.tenant_id}&select=tz`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    let tenantTimezone = 'Europe/Madrid'; // Default timezone
    if (tenantResponse.ok) {
      const tenants = await tenantResponse.json();
      if (tenants.length > 0 && tenants[0].tz) {
        tenantTimezone = tenants[0].tz;
      }
    }
    
    // Crear evento en Google Calendar con zona horaria del tenant
    const eventDetails = {
      summary: `${appointment.services.name} - ${customerData.name}`,
      description: `Servicio: ${appointment.services.name}\nCliente: ${customerData.name}\nTeléfono: ${customerData.phone}`,
      startDateTime: appointment.start_time,
      endDateTime: appointment.end_time,
      timeZone: tenantTimezone
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

// ==================== ADMIN FUNCTIONS ====================

// Función para obtener estadísticas del sistema
async function handleAdminStats(req, res) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        error: 'Supabase credentials not configured'
      });
    }

    // Consultar datos de la base de datos
    const [tenantsResponse, servicesResponse, appointmentsResponse] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/tenants?select=id,name,active,calendar_config`, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      }),
      fetch(`${supabaseUrl}/rest/v1/services?select=id,tenant_id,is_active`, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      }),
      fetch(`${supabaseUrl}/rest/v1/appointments?select=id,tenant_id,status`, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      })
    ]);

    const tenants = tenantsResponse.ok ? await tenantsResponse.json() : [];
    const services = servicesResponse.ok ? await servicesResponse.json() : [];
    const appointments = appointmentsResponse.ok ? await appointmentsResponse.json() : [];

    // Calcular estadísticas corregidas
    const stats = {
      totalTenants: tenants.length,
      activeTenants: tenants.filter(t => t.active !== false).length, // Clientes activos corregido
      totalServices: services.filter(s => s.is_active !== false).length,
      totalAppointments: appointments.length,
      confirmedAppointments: appointments.filter(a => a.status === 'confirmed').length,
      tenantsWithCalendar: tenants.filter(t => t.calendar_config?.access_token).length
    };

    return res.status(200).json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting admin stats:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// ...existing code...

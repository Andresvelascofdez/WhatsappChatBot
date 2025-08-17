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

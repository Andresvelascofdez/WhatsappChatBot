const { Hono } = require('hono');

// Create the main app
const app = new Hono();

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'WhatsApp Chatbot API',
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'WhatsApp Chatbot API is running!',
    endpoints: ['/health', '/api/status', '/webhook']
  });
});

// API status endpoint
app.get('/api/status', (c) => {
  return c.json({
    status: 'API is working',
    timestamp: new Date().toISOString()
  });
});

// Basic webhook endpoint
app.post('/webhook', async (c) => {
  try {
    const body = await c.req.text();
    console.log('Webhook received:', body);
    
    return c.json({
      status: 'received',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return c.json({
      status: 'error',
      message: 'Failed to process webhook'
    }, 500);
  }
});

// Export handler function for Vercel
module.exports = async (req, res) => {
  return app.fetch(req, res);
};

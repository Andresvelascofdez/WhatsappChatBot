/**
 * 🚀 API PRINCIPAL - VERCEL SERVERLESS
 * 
 * Handler principal para todas las rutas de la API
 */

module.exports = async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Manejar preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { url, method } = req;
    const urlPath = new URL(url, `http://${req.headers.host}`).pathname;

    try {
        // Root endpoint
        if (urlPath === '/' || urlPath === '/api') {
            return res.status(200).json({
                message: 'WhatsApp Chatbot API is running!',
                endpoints: ['/health', '/api/status', '/webhook', '/api/admin/add-client'],
                timestamp: new Date().toISOString()
            });
        }

        // Health check
        if (urlPath === '/health' || urlPath === '/api/health') {
            return res.status(200).json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                service: 'WhatsApp Chatbot API',
                version: '1.0.0'
            });
        }

        // API status
        if (urlPath === '/api/status') {
            return res.status(200).json({
                status: 'API is working',
                timestamp: new Date().toISOString()
            });
        }

        // Webhook
        if (urlPath === '/webhook') {
            if (method === 'POST') {
                console.log('Webhook received:', req.body);
                return res.status(200).json({
                    status: 'received',
                    timestamp: new Date().toISOString()
                });
            }
            if (method === 'GET') {
                return res.status(200).json({
                    message: 'Webhook endpoint ready',
                    method: 'POST'
                });
            }
        }

        // Admin panel
        if (urlPath === '/api/admin/add-client') {
            const addClientHandler = require('./admin/add-client');
            return await addClientHandler(req, res);
        }

        // 404 - Not found
        return res.status(404).json({
            error: 'Not Found',
            message: `Endpoint ${method} ${urlPath} not found`,
            availableEndpoints: [
                'GET /',
                'GET /health', 
                'GET /api/status',
                'POST /webhook',
                'GET /webhook',
                'GET /api/admin/add-client',
                'POST /api/admin/add-client'
            ],
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

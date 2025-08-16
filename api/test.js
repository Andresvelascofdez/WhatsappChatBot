// Simple test endpoint for Vercel
module.exports = (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'WhatsApp Chatbot API - Test',
    version: '1.0.0',
    method: req.method,
    url: req.url
  });
};

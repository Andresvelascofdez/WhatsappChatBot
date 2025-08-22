// Test de diagnóstico para el envío de emails en Vercel
// Para usar: GET /api/test-email-debug

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🔍 DIAGNÓSTICO DE EMAIL EN VERCEL');
    console.log('================================');

    // 1. Verificar variables de entorno
    const gmailUser = process.env.GMAIL_USER;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;

    console.log('📧 Variables de entorno:');
    console.log(`   GMAIL_USER: ${gmailUser ? 'CONFIGURADO' : 'NO CONFIGURADO'}`);
    console.log(`   GMAIL_APP_PASSWORD: ${gmailPassword ? 'CONFIGURADO' : 'NO CONFIGURADO'}`);

    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: 'vercel',
      variables: {
        GMAIL_USER: gmailUser ? 'CONFIGURADO' : 'NO CONFIGURADO',
        GMAIL_APP_PASSWORD: gmailPassword ? 'CONFIGURADO' : 'NO CONFIGURADO',
        NODE_ENV: process.env.NODE_ENV || 'undefined'
      }
    };

    // 2. Si no están configuradas, mostrar error específico
    if (!gmailUser || !gmailPassword) {
      console.log('❌ Variables de entorno faltantes');
      return res.status(500).json({
        success: false,
        error: 'Variables de entorno no configuradas',
        diagnostics,
        instructions: [
          '1. Ve a tu dashboard de Vercel',
          '2. Selecciona tu proyecto WhatsappChatBot',  
          '3. Ve a Settings > Environment Variables',
          '4. Agrega GMAIL_USER=andresvelascobusiness@gmail.com',
          '5. Agrega GMAIL_APP_PASSWORD=dwzw gsjx xpmf tvwm',
          '6. Redeploy el proyecto'
        ]
      });
    }

    // 3. Test de nodemailer (solo si están configuradas)
    try {
      console.log('📧 Probando conexión con nodemailer...');
      
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPassword
        }
      });

      // Verificar conexión
      await transporter.verify();
      console.log('✅ Conexión con Gmail exitosa');

      // 4. Enviar email de prueba
      const testEmail = {
        from: `"WhatsApp Bot - Test Vercel" <${gmailUser}>`,
        to: 'lukovskyfc@gmail.com',
        subject: '🧪 Test desde Vercel - Email funcionando',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #4285f4;">✅ Email desde Vercel funcionando</h2>
          <p>Este email se envió exitosamente desde Vercel usando:</p>
          <ul>
            <li><strong>Nodemailer:</strong> ✅ Funcionando</li>
            <li><strong>Gmail SMTP:</strong> ✅ Conectado</li>
            <li><strong>Variables de entorno:</strong> ✅ Configuradas</li>
          </ul>
          <hr>
          <p><strong>📅 Enviado:</strong> ${new Date().toLocaleString('es-ES')}</p>
          <p><strong>🔧 Desde:</strong> ${gmailUser}</p>
          <p><strong>🌐 Entorno:</strong> Vercel Production</p>
          <p><strong>📝 Test ID:</strong> vercel-test-${Date.now()}</p>
        </div>`
      };

      console.log('📨 Enviando email de prueba...');
      const result = await transporter.sendMail(testEmail);
      
      console.log('✅ Email enviado exitosamente');
      console.log(`   Message ID: ${result.messageId}`);

      return res.status(200).json({
        success: true,
        message: 'Sistema de email funcionando correctamente en Vercel',
        diagnostics: {
          ...diagnostics,
          emailTest: {
            messageId: result.messageId,
            sent: true,
            timestamp: new Date().toISOString()
          }
        },
        instructions: [
          'El email de prueba fue enviado a lukovskyfc@gmail.com',
          'Revisa la bandeja de entrada en unos minutos',
          'Si no lo recibes, revisa la carpeta de spam'
        ]
      });

    } catch (emailError) {
      console.error('❌ Error en el sistema de email:', emailError);
      
      return res.status(500).json({
        success: false,
        error: 'Error en el sistema de email',
        details: emailError.message,
        diagnostics: {
          ...diagnostics,
          emailTest: {
            error: emailError.message,
            code: emailError.code,
            sent: false
          }
        },
        troubleshooting: [
          emailError.code === 'EAUTH' ? 'Error de autenticación: Verifica GMAIL_APP_PASSWORD' : null,
          emailError.code === 'ENOTFOUND' ? 'Error de red: Problema de conectividad' : null,
          'Verifica que las credenciales sean correctas',
          'Asegúrate de que la verificación en 2 pasos esté activa en Gmail'
        ].filter(Boolean)
      });
    }

  } catch (error) {
    console.error('💥 Error general:', error);
    return res.status(500).json({
      success: false,
      error: 'Error general en diagnóstico',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

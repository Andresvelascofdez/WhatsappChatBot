const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  // Solo permitir POST para autenticación
  if (req.method === 'POST') {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username and password are required' 
        });
      }

      // Buscar usuario en la base de datos
      const { data: user, error: userError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', username.trim())
        .eq('is_active', true)
        .single();

      if (userError || !user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }

      // Verificar contraseña
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      
      if (!passwordMatch) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }

      // Generar token de sesión
      const sessionToken = require('crypto').randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

      // Crear sesión en base de datos
      const { error: sessionError } = await supabase
        .from('admin_sessions')
        .insert({
          user_id: user.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
          ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          user_agent: req.headers['user-agent']
        });

      if (sessionError) {
        console.error('Error creating session:', sessionError);
        return res.status(500).json({ 
          success: false, 
          message: 'Error creating session' 
        });
      }

      // Actualizar último login
      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      // Establecer cookie de sesión
      res.setHeader('Set-Cookie', [
        `admin_session=${sessionToken}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
      ]);

      return res.json({ 
        success: true, 
        message: 'Login successful',
        redirect: '/admin'
      });

    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  // GET request - mostrar formulario de login
  const loginHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔐 Admin Login - WhatsApp Chatbot</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .login-container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 400px;
            text-align: center;
        }
        
        .login-header {
            margin-bottom: 30px;
        }
        
        .login-header h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 2rem;
        }
        
        .login-header p {
            color: #666;
            font-size: 0.9rem;
        }
        
        .form-group {
            margin-bottom: 20px;
            text-align: left;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 500;
        }
        
        input[type="text"],
        input[type="password"] {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e1e1e1;
            border-radius: 10px;
            font-size: 1rem;
            transition: border-color 0.3s ease;
        }
        
        input[type="text"]:focus,
        input[type="password"]:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .login-btn {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease;
        }
        
        .login-btn:hover {
            transform: translateY(-2px);
        }
        
        .login-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
        }
        
        .error-message {
            background: #fee;
            color: #c33;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 0.9rem;
            display: none;
        }
        
        .success-message {
            background: #efe;
            color: #3c3;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 0.9rem;
            display: none;
        }
        
        .loading {
            display: none;
            margin-top: 10px;
        }
        
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .credentials-info {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin-top: 20px;
            border-radius: 0 8px 8px 0;
            text-align: left;
            font-size: 0.85rem;
            color: #555;
        }
        
        .credentials-info strong {
            color: #333;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-header">
            <h1>🔐 Admin Login</h1>
            <p>WhatsApp Booking Chatbot</p>
        </div>
        
        <div id="error-message" class="error-message"></div>
        <div id="success-message" class="success-message"></div>
        
        <form id="loginForm">
            <div class="form-group">
                <label for="username">👤 Username</label>
                <input type="text" id="username" name="username" required autocomplete="username">
            </div>
            
            <div class="form-group">
                <label for="password">🔑 Password</label>
                <input type="password" id="password" name="password" required autocomplete="current-password">
            </div>
            
            <button type="submit" class="login-btn" id="loginBtn">
                🚀 Access Admin Panel
            </button>
            
            <div class="loading" id="loading">
                <div class="spinner"></div>
                <p>Authenticating...</p>
            </div>
        </form>
        
        <div class="credentials-info">
            <strong>💡 Default Credentials:</strong><br>
            Username: <strong>admin</strong><br>
            Password: <strong>admin123</strong><br>
            <em>⚠️ Change these in production!</em>
        </div>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const loginBtn = document.getElementById('loginBtn');
            const loading = document.getElementById('loading');
            const errorMsg = document.getElementById('error-message');
            const successMsg = document.getElementById('success-message');
            
            // Ocultar mensajes previos
            errorMsg.style.display = 'none';
            successMsg.style.display = 'none';
            
            // Mostrar loading
            loginBtn.disabled = true;
            loading.style.display = 'block';
            
            const formData = new FormData(e.target);
            const loginData = {
                username: formData.get('username'),
                password: formData.get('password')
            };
            
            try {
                const response = await fetch('/admin/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(loginData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    successMsg.textContent = '✅ ' + result.message + ' - Redirecting...';
                    successMsg.style.display = 'block';
                    
                    setTimeout(() => {
                        window.location.href = result.redirect || '/admin';
                    }, 1000);
                } else {
                    errorMsg.textContent = '❌ ' + result.message;
                    errorMsg.style.display = 'block';
                }
            } catch (error) {
                errorMsg.textContent = '❌ Network error. Please try again.';
                errorMsg.style.display = 'block';
            } finally {
                loginBtn.disabled = false;
                loading.style.display = 'none';
            }
        });
        
        // Auto-focus en el campo username
        document.getElementById('username').focus();
    </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(loginHTML);
};

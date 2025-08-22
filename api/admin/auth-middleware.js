const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function getSessionToken(req) {
  if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});
    return cookies.admin_session;
  }
  return null;
}

async function validateSession(sessionToken) {
  if (!sessionToken) return null;
  
  try {
    const { data: session, error } = await supabase
      .from('admin_sessions')
      .select(`
        *,
        admin_users (
          id,
          username,
          is_active
        )
      `)
      .eq('session_token', sessionToken)
      .gte('expires_at', new Date().toISOString())
      .single();
    
    if (error || !session || !session.admin_users.is_active) {
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

function redirectToLogin(res, currentPath = '') {
  const loginRedirect = currentPath ? `?redirect=${encodeURIComponent(currentPath)}` : '';
  
  if (res.writeHead) {
    // Para requests de páginas HTML
    res.writeHead(302, { Location: `/admin/login${loginRedirect}` });
    res.end();
  } else {
    // Para requests JSON/API
    res.status(401).json({ 
      success: false, 
      message: 'Authentication required',
      redirect: `/admin/login${loginRedirect}`
    });
  }
}

function requireAuth(handler) {
  return async (req, res) => {
    // Excluir rutas de login y logout
    const url = req.url || '';
    if (url.includes('/login') || url.includes('/logout')) {
      return handler(req, res);
    }
    
    const sessionToken = getSessionToken(req);
    const session = await validateSession(sessionToken);
    
    if (!session) {
      return redirectToLogin(res, url);
    }
    
    // Añadir información del usuario al request
    req.user = session.admin_users;
    req.session = session;
    
    return handler(req, res);
  };
}

module.exports = {
  requireAuth,
  validateSession,
  getSessionToken,
  redirectToLogin
};

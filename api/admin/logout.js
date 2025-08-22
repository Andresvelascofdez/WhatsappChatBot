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

module.exports = async (req, res) => {
  try {
    const sessionToken = getSessionToken(req);
    
    if (sessionToken) {
      // Eliminar sesión de la base de datos
      await supabase
        .from('admin_sessions')
        .delete()
        .eq('session_token', sessionToken);
    }
    
    // Limpiar cookie
    res.setHeader('Set-Cookie', [
      'admin_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax'
    ]);
    
    // Redirect a login
    res.writeHead(302, { Location: '/admin/login' });
    res.end();
    
  } catch (error) {
    console.error('Logout error:', error);
    res.writeHead(302, { Location: '/admin/login' });
    res.end();
  }
};

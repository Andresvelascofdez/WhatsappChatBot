-- 🔐 TABLA DE AUTENTICACIÓN PARA ADMIN
-- Ejecutar en Supabase SQL Editor

-- Crear tabla de usuarios admin
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Crear tabla de sesiones para tracking
CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Insertar usuario admin por defecto (username: admin, password: admin123)
-- ⚠️ CAMBIAR LA CONTRASEÑA EN PRODUCCIÓN
INSERT INTO admin_users (username, password_hash) 
VALUES ('admin', '$2b$12$LQv3c1yqBwEHvl/YYfN9Fu8/8kZgJGHkZ5L.d8xOLuZjjXBpJeEDm')
ON CONFLICT (username) DO NOTHING;

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

-- Función para limpiar sesiones expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM admin_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Habilitar RLS (Row Level Security)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (permitir acceso completo por ahora)
CREATE POLICY "Enable all operations for admin_users" ON admin_users FOR ALL USING (true);
CREATE POLICY "Enable all operations for admin_sessions" ON admin_sessions FOR ALL USING (true);

-- Comentarios para documentación
COMMENT ON TABLE admin_users IS 'Tabla de usuarios administrativos del sistema';
COMMENT ON TABLE admin_sessions IS 'Tabla de sesiones activas de admin';
COMMENT ON COLUMN admin_users.password_hash IS 'Hash bcrypt de la contraseña';
COMMENT ON COLUMN admin_sessions.session_token IS 'Token único de sesión';

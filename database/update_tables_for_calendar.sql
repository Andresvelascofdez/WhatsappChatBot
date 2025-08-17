-- Actualizar tabla tenants para incluir configuración de Google Calendar
-- Este script es idempotente y puede ejecutarse múltiples veces

-- Agregar columna calendar_config si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'calendar_config'
    ) THEN
        ALTER TABLE tenants 
        ADD COLUMN calendar_config JSONB;
    END IF;
END $$;

-- Agregar columna email si no existe (para notificaciones)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'email'
    ) THEN
        ALTER TABLE tenants 
        ADD COLUMN email VARCHAR(255);
    END IF;
END $$;

-- Agregar configuración de slots por tenant
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'slot_config'
    ) THEN
        ALTER TABLE tenants 
        ADD COLUMN slot_config JSONB DEFAULT '{"default_slot_duration": 30, "slot_granularity": 15, "buffer_between_appointments": 0}'::jsonb;
    END IF;
END $$;

-- Actualizar tabla services para incluir configuraciones específicas por servicio
DO $$ 
BEGIN
    -- Agregar buffer_before si no existe (tiempo antes del servicio)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'buffer_before_minutes'
    ) THEN
        ALTER TABLE services 
        ADD COLUMN buffer_before_minutes INTEGER DEFAULT 0;
    END IF;
    
    -- Agregar buffer_after si no existe (tiempo después del servicio)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'buffer_after_minutes'
    ) THEN
        ALTER TABLE services 
        ADD COLUMN buffer_after_minutes INTEGER DEFAULT 0;
    END IF;
    
    -- Agregar slot_duration personalizable por servicio
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'custom_slot_duration'
    ) THEN
        ALTER TABLE services 
        ADD COLUMN custom_slot_duration INTEGER; -- NULL = usar configuración del tenant
    END IF;
END $$;

-- Actualizar tabla appointments para incluir campos necesarios para reservas
DO $$ 
BEGIN
    -- Agregar hold_expires_at si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'hold_expires_at'
    ) THEN
        ALTER TABLE appointments 
        ADD COLUMN hold_expires_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Agregar calendar_event_id si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'calendar_event_id'
    ) THEN
        ALTER TABLE appointments 
        ADD COLUMN calendar_event_id VARCHAR(255);
    END IF;
    
    -- Agregar confirmed_at si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'confirmed_at'
    ) THEN
        ALTER TABLE appointments 
        ADD COLUMN confirmed_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Agregar customer_phone si no existe (para holds temporales)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'customer_phone'
    ) THEN
        ALTER TABLE appointments 
        ADD COLUMN customer_phone VARCHAR(20);
    END IF;
    
    -- Agregar slot_metadata si no existe (información del slot)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'slot_metadata'
    ) THEN
        ALTER TABLE appointments 
        ADD COLUMN slot_metadata JSONB;
    END IF;
END $$;

-- Crear índices para optimizar consultas de reservas
CREATE INDEX IF NOT EXISTS idx_appointments_hold_expires ON appointments(hold_expires_at) WHERE status = 'hold';
CREATE INDEX IF NOT EXISTS idx_appointments_customer_phone ON appointments(customer_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_calendar_event ON appointments(calendar_event_id);

-- Función para limpiar holds expirados automáticamente
CREATE OR REPLACE FUNCTION cleanup_expired_holds()
RETURNS void AS $$
BEGIN
    DELETE FROM appointments 
    WHERE status = 'hold' 
    AND hold_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comentario sobre calendar_config estructura esperada:
COMMENT ON COLUMN tenants.calendar_config IS 'JSON structure: {"access_token": "string", "refresh_token": "string", "calendar_id": "string", "expires_at": "timestamp"}';

-- Comentario sobre slot_config estructura esperada:
COMMENT ON COLUMN tenants.slot_config IS 'JSON structure: {"default_slot_duration": 30, "slot_granularity": 15, "buffer_between_appointments": 5, "allow_same_day_booking": true, "max_advance_booking_days": 30}';

-- Comentarios sobre campos de servicios:
COMMENT ON COLUMN services.buffer_before_minutes IS 'Tiempo de preparación antes del servicio en minutos';
COMMENT ON COLUMN services.buffer_after_minutes IS 'Tiempo de limpieza después del servicio en minutos';
COMMENT ON COLUMN services.custom_slot_duration IS 'Duración personalizada de slot para este servicio (NULL = usar configuración del tenant)';

-- Mensaje de confirmación
SELECT 'Tabla tenants y appointments actualizadas para soporte de Google Calendar con configuración flexible de slots' as status;

-- Migración idempotente para alinear schema de tenants
-- Date: 2025-08-17
-- Objetivo: Agregar columna 'active' y alinear nombres de campos

-- Agregar columna 'active' si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'active'
    ) THEN
        ALTER TABLE tenants ADD COLUMN active BOOLEAN DEFAULT true;
        UPDATE tenants SET active = true WHERE active IS NULL;
    END IF;
END $$;

-- Verificar/agregar otras columnas necesarias
DO $$ 
BEGIN
    -- Columna 'tz' (timezone)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'tz'
    ) THEN
        ALTER TABLE tenants ADD COLUMN tz VARCHAR(50) DEFAULT 'Europe/Madrid';
    END IF;
    
    -- Columna 'locale'
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'locale'
    ) THEN
        ALTER TABLE tenants ADD COLUMN locale VARCHAR(10) DEFAULT 'es';
    END IF;
    
    -- Columna 'created_at'
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE tenants ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Verificar que el campo 'name' existe (podría llamarse 'business_name')
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'name'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'business_name'
    ) THEN
        -- Renombrar business_name a name si es necesario
        ALTER TABLE tenants RENAME COLUMN business_name TO name;
    END IF;
END $$;

-- Verificar que el campo 'phone_masked' existe (podría llamarse 'phone_number')
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'phone_masked'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'phone_number'
    ) THEN
        -- Renombrar phone_number a phone_masked si es necesario
        ALTER TABLE tenants RENAME COLUMN phone_number TO phone_masked;
    END IF;
END $$;

-- Agregar campos de configuración necesarios para el sistema
DO $$ 
BEGIN
    -- Columna 'email' para Google Calendar
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'email'
    ) THEN
        ALTER TABLE tenants ADD COLUMN email VARCHAR(255);
    END IF;
    
    -- Columna 'slot_config' para configuración de slots dinámicos
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'slot_config'
    ) THEN
        ALTER TABLE tenants ADD COLUMN slot_config JSONB DEFAULT '{"slot_granularity": 15, "allow_same_day_booking": true, "max_advance_booking_days": 30, "dynamic_slots": true}'::jsonb;
    END IF;
    
    -- Columna 'calendar_config' para tokens de Google Calendar
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'calendar_config'
    ) THEN
        ALTER TABLE tenants ADD COLUMN calendar_config JSONB;
    END IF;
END $$;

-- Verificar/actualizar tabla services para slots dinámicos
DO $$ 
BEGIN
    -- Verificar que existe 'duration_min' (podría llamarse 'duration_minutes')
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'duration_min'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'duration_minutes'
    ) THEN
        ALTER TABLE services RENAME COLUMN duration_minutes TO duration_min;
    END IF;
    
    -- Verificar que existe 'price_cents' (podría llamarse 'price')
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'price_cents'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'price'
    ) THEN
        ALTER TABLE services RENAME COLUMN price TO price_cents;
        -- Convertir valores de euros a centavos si es necesario
        UPDATE services SET price_cents = price_cents * 100 WHERE price_cents < 1000;
    END IF;
    
    -- Agregar campos para slots dinámicos
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'slot_granularity_min'
    ) THEN
        ALTER TABLE services ADD COLUMN slot_granularity_min INTEGER DEFAULT 15;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'buffer_min'
    ) THEN
        ALTER TABLE services ADD COLUMN buffer_min INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE services ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_services_tenant_active ON services(tenant_id, is_active) WHERE is_active = true;

-- Comentarios sobre estructura esperada
COMMENT ON COLUMN tenants.slot_config IS 'JSON: {"slot_granularity": 15, "allow_same_day_booking": true, "max_advance_booking_days": 30, "dynamic_slots": true}';
COMMENT ON COLUMN tenants.calendar_config IS 'JSON: {"access_token": "string", "refresh_token": "string", "calendar_id": "string", "expires_at": "timestamp"}';
COMMENT ON COLUMN services.slot_granularity_min IS 'Granularidad mínima para cálculo de slots disponibles';
COMMENT ON COLUMN services.buffer_min IS 'Tiempo extra entre servicios en minutos';

-- Mensaje de confirmación
SELECT 'Schema completo actualizado: tenants y services preparados para slots dinámicos' as status;

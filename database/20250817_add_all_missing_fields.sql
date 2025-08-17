-- Migración completa para agregar TODOS los campos del formulario
-- Date: 2025-08-17
-- Objetivo: Asegurar que la BBDD tiene todos los campos necesarios

-- =====================================================
-- TABLA TENANTS - Agregar todos los campos faltantes
-- =====================================================

-- Campos del formulario que deben existir:
-- tenantId -> id (ya existe)
-- businessName -> business_name (ya existe)  
-- phoneNumber -> phone_number (ya existe)
-- email -> email (agregar si no existe)
-- address -> address (agregar si no existe)
-- slotGranularity, maxAdvanceBooking, timezone, sameDayBooking -> slot_config (agregar si no existe)

DO $$ 
BEGIN
    -- Campo 'address' - faltaba en schema original
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'address'
    ) THEN
        ALTER TABLE tenants ADD COLUMN address TEXT;
        RAISE NOTICE 'Columna address agregada a tenants';
    ELSE
        RAISE NOTICE 'Columna address ya existe en tenants';
    END IF;
    
    -- Campo 'email' - para Google Calendar
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'email'
    ) THEN
        ALTER TABLE tenants ADD COLUMN email VARCHAR(255);
        RAISE NOTICE 'Columna email agregada a tenants';
    ELSE
        RAISE NOTICE 'Columna email ya existe en tenants';
    END IF;
    
    -- Campo 'slot_config' - configuración de slots dinámicos
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'slot_config'
    ) THEN
        ALTER TABLE tenants ADD COLUMN slot_config JSONB DEFAULT '{"slot_granularity": 15, "allow_same_day_booking": true, "max_advance_booking_days": 30, "dynamic_slots": true}'::jsonb;
        RAISE NOTICE 'Columna slot_config agregada a tenants';
    ELSE
        RAISE NOTICE 'Columna slot_config ya existe en tenants';
    END IF;
    
    -- Campo 'calendar_config' - tokens de Google Calendar
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'calendar_config'
    ) THEN
        ALTER TABLE tenants ADD COLUMN calendar_config JSONB;
        RAISE NOTICE 'Columna calendar_config agregada a tenants';
    ELSE
        RAISE NOTICE 'Columna calendar_config ya existe en tenants';
    END IF;
    
    -- Campo 'timezone' - zona horaria del tenant
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'timezone'
    ) THEN
        ALTER TABLE tenants ADD COLUMN timezone VARCHAR(50) DEFAULT 'Europe/Madrid';
        RAISE NOTICE 'Columna timezone agregada a tenants';
    ELSE
        RAISE NOTICE 'Columna timezone ya existe en tenants';
    END IF;
    
    -- Campo 'active' - estado del tenant
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'active'
    ) THEN
        ALTER TABLE tenants ADD COLUMN active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Columna active agregada a tenants';
    ELSE
        RAISE NOTICE 'Columna active ya existe en tenants';
    END IF;
    
    -- Campo 'created_at' - timestamp de creación
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE tenants ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Columna created_at agregada a tenants';
    ELSE
        RAISE NOTICE 'Columna created_at ya existe en tenants';
    END IF;
    
    -- Campo 'updated_at' - timestamp de actualización
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE tenants ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Columna updated_at agregada a tenants';
    ELSE
        RAISE NOTICE 'Columna updated_at ya existe en tenants';
    END IF;
END $$;

-- =====================================================
-- TABLA SERVICES - Agregar todos los campos faltantes
-- =====================================================

-- Campos del formulario que deben existir:
-- serviceName[] -> name (ya existe)
-- servicePrice[] -> price (ya existe)
-- serviceDuration[] -> duration_minutes (ya existe)
-- Campos adicionales necesarios para el sistema

DO $$ 
BEGIN
    -- Campo 'is_active' - estado del servicio
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE services ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Columna is_active agregada a services';
    ELSE
        RAISE NOTICE 'Columna is_active ya existe en services';
    END IF;
    
    -- Campo 'slot_granularity_min' - granularidad específica por servicio
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'slot_granularity_min'
    ) THEN
        ALTER TABLE services ADD COLUMN slot_granularity_min INTEGER DEFAULT 15;
        RAISE NOTICE 'Columna slot_granularity_min agregada a services';
    ELSE
        RAISE NOTICE 'Columna slot_granularity_min ya existe en services';
    END IF;
    
    -- Campo 'buffer_min' - tiempo extra entre servicios
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'buffer_min'
    ) THEN
        ALTER TABLE services ADD COLUMN buffer_min INTEGER DEFAULT 0;
        RAISE NOTICE 'Columna buffer_min agregada a services';
    ELSE
        RAISE NOTICE 'Columna buffer_min ya existe en services';
    END IF;
    
    -- Campo 'category' - categoría del servicio
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'category'
    ) THEN
        ALTER TABLE services ADD COLUMN category VARCHAR(100) DEFAULT 'general';
        RAISE NOTICE 'Columna category agregada a services';
    ELSE
        RAISE NOTICE 'Columna category ya existe en services';
    END IF;
    
    -- Campo 'sort_order' - orden de los servicios
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'sort_order'
    ) THEN
        ALTER TABLE services ADD COLUMN sort_order INTEGER DEFAULT 0;
        RAISE NOTICE 'Columna sort_order agregada a services';
    ELSE
        RAISE NOTICE 'Columna sort_order ya existe en services';
    END IF;
    
    -- Campo 'created_at' - timestamp de creación
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE services ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Columna created_at agregada a services';
    ELSE
        RAISE NOTICE 'Columna created_at ya existe en services';
    END IF;
    
    -- Campo 'updated_at' - timestamp de actualización
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE services ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Columna updated_at agregada a services';
    ELSE
        RAISE NOTICE 'Columna updated_at ya existe en services';
    END IF;
END $$;

-- =====================================================
-- CREAR ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para tenants
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_tenants_business_name ON tenants(business_name);
CREATE INDEX IF NOT EXISTS idx_tenants_phone_number ON tenants(phone_number);
CREATE INDEX IF NOT EXISTS idx_tenants_email ON tenants(email);

-- Índices para services
CREATE INDEX IF NOT EXISTS idx_services_tenant_id ON services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(tenant_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_services_name ON services(name);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_sort_order ON services(tenant_id, sort_order);

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

-- Documentar estructura de slot_config
COMMENT ON COLUMN tenants.slot_config IS 'JSON: {"slot_granularity": 15, "allow_same_day_booking": true, "max_advance_booking_days": 30, "dynamic_slots": true}';

-- Documentar estructura de calendar_config
COMMENT ON COLUMN tenants.calendar_config IS 'JSON: {"access_token": "string", "refresh_token": "string", "calendar_id": "string", "expires_at": "timestamp"}';

-- Documentar campos de servicios
COMMENT ON COLUMN services.slot_granularity_min IS 'Granularidad mínima para cálculo de slots disponibles (minutos)';
COMMENT ON COLUMN services.buffer_min IS 'Tiempo extra entre servicios en minutos (limpieza, preparación)';
COMMENT ON COLUMN services.custom_slot_duration IS 'Duración personalizada de slot para este servicio (NULL = usar duration_minutes)';
COMMENT ON COLUMN services.category IS 'Categoría del servicio (general, premium, especial, etc.)';
COMMENT ON COLUMN services.sort_order IS 'Orden de visualización de los servicios';

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Mostrar estructura final de tenants
SELECT 'TENANTS - Estructura final:' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tenants' 
ORDER BY ordinal_position;

-- Mostrar estructura final de services
SELECT 'SERVICES - Estructura final:' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'services' 
ORDER BY ordinal_position;

-- Mensaje de confirmación
SELECT 'Migración completa ejecutada - Todos los campos del formulario están disponibles en la BBDD' as status;

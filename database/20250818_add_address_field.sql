-- Migración corregida usando schema REAL
-- Date: 2025-08-18
-- Solo agregar campos que faltan

-- Solo falta agregar 'address' a tenants
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'address'
    ) THEN
        ALTER TABLE tenants ADD COLUMN address TEXT;
        RAISE NOTICE 'Columna address agregada a tenants';
    ELSE
        RAISE NOTICE 'Columna address ya existe en tenants';
    END IF;
END $$;

-- Mensaje de confirmación
SELECT 'Migración completada - Campo address agregado a tenants' as status;

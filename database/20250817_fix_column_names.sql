-- Migración correctiva para nombres de columnas
-- Date: 2025-08-17
-- Objetivo: Verificar nombres reales y adaptar código

-- Verificar schema real de tenants
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tenants' 
ORDER BY ordinal_position;

-- Verificar schema real de services  
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'services' 
ORDER BY ordinal_position;

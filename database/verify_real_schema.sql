-- Script para verificar estructura REAL de las tablas
-- Ejecutar PRIMERO para ver qué columnas existen

-- Ver estructura completa de tenants
SELECT 'ESTRUCTURA ACTUAL DE TENANTS:' as info;
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tenants' 
ORDER BY ordinal_position;

-- Ver estructura completa de services
SELECT 'ESTRUCTURA ACTUAL DE SERVICES:' as info;
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'services' 
ORDER BY ordinal_position;

-- Ver todas las tablas que existen
SELECT 'TODAS LAS TABLAS EN EL SCHEMA:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

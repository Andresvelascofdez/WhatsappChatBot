-- Script para agregar un nuevo tenant/negocio al sistema
-- Cada negocio puede tener su propio número de WhatsApp

-- ============ INSTRUCCIONES ============
-- 1. Reemplaza los valores de ejemplo con los datos reales del negocio
-- 2. El phone_number debe coincidir EXACTAMENTE con el número configurado en Twilio
-- 3. Formato de teléfono: solo números, sin '+' ni 'whatsapp:', ejemplo: '34600123456'
-- 4. El tenant_id debe ser único (sugiero usar el nombre del negocio en minúsculas)

-- Insertar nuevo tenant
INSERT INTO tenants (
    id,                    -- ID único del tenant
    business_name,         -- Nombre del negocio
    phone_number,          -- Número de WhatsApp Business (SOLO NÚMEROS)
    address,               -- Dirección del negocio
    email,                 -- Email del negocio
    slot_config,           -- Configuración de slots (JSON)
    calendar_config        -- Configuración de Google Calendar (se completa después)
) VALUES (
    'nuevo_negocio',                                      -- 🔥 CAMBIAR: ID único
    'Mi Peluquería',                                      -- 🔥 CAMBIAR: Nombre del negocio
    '34600123456',                                        -- 🔥 CAMBIAR: Tu número WhatsApp Business
    'Calle Mayor 15, Madrid',                             -- 🔥 CAMBIAR: Dirección
    'contacto@mipeluqueria.com',                          -- 🔥 CAMBIAR: Email
    '{
        "slot_granularity": 15, 
        "allow_same_day_booking": true, 
        "max_advance_booking_days": 30
    }'::jsonb,
    '{
        "access_token": null,
        "refresh_token": null, 
        "calendar_id": null,
        "expires_at": null
    }'::jsonb
);

-- Insertar servicios para este tenant
INSERT INTO services (tenant_id, name, description, price, duration_minutes, custom_slot_duration) VALUES
('nuevo_negocio', 'Corte Básico', 'Corte de pelo básico', 20.00, 30, NULL),
('nuevo_negocio', 'Corte Premium', 'Corte de pelo premium con lavado', 35.00, 45, NULL),
('nuevo_negocio', 'Tinte Completo', 'Tinte completo de cabello', 50.00, 90, NULL),
('nuevo_negocio', 'Manicura', 'Manicura completa', 25.00, 60, NULL);

-- ⚠️ CAMBIAR 'nuevo_negocio' por el ID que uses arriba en AMBAS secciones

-- Verificar que se creó correctamente
SELECT 
    'Tenant creado:' as resultado,
    id as tenant_id,
    business_name,
    phone_number,
    'Google Calendar: pendiente configuración' as calendar_status
FROM tenants 
WHERE id = 'nuevo_negocio';  -- 🔥 CAMBIAR por tu ID

SELECT 
    'Servicios creados:' as resultado,
    COUNT(*) as total_servicios,
    STRING_AGG(name || ' (€' || price || ')', ', ') as lista_servicios
FROM services 
WHERE tenant_id = 'nuevo_negocio';  -- 🔥 CAMBIAR por tu ID

-- ============ SIGUIENTE PASO ============
-- Una vez ejecutado este script:
-- 1. Configura Google Calendar siguiendo GOOGLE_CALENDAR_SETUP.md
-- 2. Actualiza calendar_config con los tokens obtenidos:
/*
UPDATE tenants 
SET calendar_config = '{
    "access_token": "tu-access-token-aqui",
    "refresh_token": "tu-refresh-token-aqui",
    "calendar_id": "primary",
    "expires_at": "2025-12-31T23:59:59Z"
}'::jsonb
WHERE id = 'nuevo_negocio';
*/

-- Script para configurar el tenant por defecto con Google Calendar
-- Ejecutar DESPUÉS de update_tables_for_calendar.sql

-- ⚠️ IMPORTANTE: Reemplaza '14155238886' con el número de tu WhatsApp Business
-- Este número debe coincidir con el número configurado en Twilio
-- Formato: solo números, sin '+' ni 'whatsapp:', ejemplo: '34600123456'

-- Insertar tenant por defecto si no existe
INSERT INTO tenants (
    id, 
    business_name, 
    phone_number, 
    address,
    email,
    slot_config,
    calendar_config
) VALUES (
    'default',
    'Peluquería Bella Vista',
    '14155238886', -- 🔥 CAMBIAR POR TU NÚMERO DE WHATSAPP BUSINESS
    'Calle Principal 123',
    'peluqueria@example.com',
    '{"slot_granularity": 15, "allow_same_day_booking": true, "max_advance_booking_days": 30}'::jsonb,
    '{
        "access_token": "YOUR_GOOGLE_ACCESS_TOKEN",
        "refresh_token": "YOUR_GOOGLE_REFRESH_TOKEN", 
        "calendar_id": "YOUR_CALENDAR_ID@gmail.com",
        "expires_at": "2025-12-31T23:59:59Z"
    }'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    phone_number = EXCLUDED.phone_number,
    address = EXCLUDED.address,
    email = EXCLUDED.email,
    slot_config = EXCLUDED.slot_config;
    -- NO actualizar calendar_config si ya existe

-- Insertar servicios por defecto si no existen
INSERT INTO services (tenant_id, name, description, price, duration_minutes, custom_slot_duration) VALUES
('default', 'Corte de pelo', 'Corte de pelo profesional', 15.00, 30, NULL),
('default', 'Corte + Barba', 'Corte de pelo + arreglo de barba', 25.00, 45, NULL),
('default', 'Tinte', 'Tinte completo de cabello', 35.00, 60, NULL),
('default', 'Mechas', 'Mechas profesionales', 45.00, 90, NULL)
ON CONFLICT (tenant_id, name) DO UPDATE SET
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    duration_minutes = EXCLUDED.duration_minutes,
    custom_slot_duration = EXCLUDED.custom_slot_duration;

-- Verificar la configuración
SELECT 
    'Tenant configurado:' as status,
    business_name,
    phone_number,
    CASE 
        WHEN calendar_config->>'access_token' IS NOT NULL THEN 'Google Calendar: ✅ Configurado'
        ELSE 'Google Calendar: ❌ NECESITA CONFIGURACIÓN'
    END as calendar_status
FROM tenants 
WHERE id = 'default';

SELECT 
    'Servicios disponibles:' as status,
    COUNT(*) as total_services,
    STRING_AGG(name || ' (' || duration_minutes || ' min)', ', ') as services
FROM services 
WHERE tenant_id = 'default';

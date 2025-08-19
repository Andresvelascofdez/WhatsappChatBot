-- ======================================================
-- SCRIPT: Agregar columna business_hours a tabla tenants
-- FECHA: 2025-08-19
-- DESCRIPCIÓN: Agrega la columna business_hours de tipo JSONB
--              para almacenar los horarios de trabajo semanales
-- ======================================================

-- Agregar la columna business_hours a la tabla tenants
ALTER TABLE tenants 
ADD COLUMN business_hours JSONB DEFAULT '{}';

-- Agregar comentario explicativo
COMMENT ON COLUMN tenants.business_hours IS 'Horarios de trabajo semanales en formato JSON. Estructura: {
  "monday": {"open": "09:00", "close": "18:00"} o {"closed": true} o {"morning": {"open": "09:00", "close": "14:00"}, "afternoon": {"open": "16:00", "close": "20:00"}},
  "tuesday": {...},
  "wednesday": {...},
  "thursday": {...},
  "friday": {...},
  "saturday": {...},
  "sunday": {...}
}';

-- Ejemplo de estructura de datos para business_hours:
-- {
--   "monday": {
--     "open": "09:00",
--     "close": "18:00"
--   },
--   "tuesday": {
--     "morning": {
--       "open": "09:00",
--       "close": "14:00"
--     },
--     "afternoon": {
--       "open": "16:00",
--       "close": "20:00"
--     }
--   },
--   "wednesday": {
--     "open": "09:00",
--     "close": "18:00"
--   },
--   "thursday": {
--     "open": "09:00",
--     "close": "18:00"
--   },
--   "friday": {
--     "open": "09:00",
--     "close": "18:00"
--   },
--   "saturday": {
--     "open": "09:00",
--     "close": "14:00"
--   },
--   "sunday": {
--     "closed": true
--   }
-- }

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tenants' 
AND column_name = 'business_hours';

-- Mostrar estructura actual de la tabla tenants
\d tenants;

-- Script completado exitosamente
SELECT 'Columna business_hours agregada exitosamente a la tabla tenants' as resultado;

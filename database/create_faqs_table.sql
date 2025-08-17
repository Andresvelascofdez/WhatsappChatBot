-- Crear tabla FAQs con Row Level Security
CREATE TABLE IF NOT EXISTS faqs (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[], -- Array de palabras clave para búsqueda
  category VARCHAR(100), -- Categoría opcional (ej: "servicios", "horarios", "precios")
  priority INTEGER DEFAULT 0, -- Para ordenar por importancia (mayor número = mayor prioridad)
  is_active BOOLEAN DEFAULT true, -- Para habilitar/deshabilitar FAQs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_faqs_tenant_id ON faqs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_faqs_keywords ON faqs USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_active ON faqs(is_active);

-- ACTIVAR Row Level Security
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: Solo ver FAQs del propio tenant
CREATE POLICY "faqs_tenant_isolation_select" ON faqs
  FOR SELECT
  USING (
    tenant_id = (
      SELECT tenants.id 
      FROM tenants 
      WHERE tenants.id = faqs.tenant_id
    )
  );

-- Política para INSERT: Solo insertar en el propio tenant
CREATE POLICY "faqs_tenant_isolation_insert" ON faqs
  FOR INSERT
  WITH CHECK (
    tenant_id = (
      SELECT tenants.id 
      FROM tenants 
      WHERE tenants.id = faqs.tenant_id
    )
  );

-- Política para UPDATE: Solo actualizar FAQs del propio tenant
CREATE POLICY "faqs_tenant_isolation_update" ON faqs
  FOR UPDATE
  USING (
    tenant_id = (
      SELECT tenants.id 
      FROM tenants 
      WHERE tenants.id = faqs.tenant_id
    )
  );

-- Política para DELETE: Solo eliminar FAQs del propio tenant
CREATE POLICY "faqs_tenant_isolation_delete" ON faqs
  FOR DELETE
  USING (
    tenant_id = (
      SELECT tenants.id 
      FROM tenants 
      WHERE tenants.id = faqs.tenant_id
    )
  );

-- Crear función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_faqs_updated_at 
  BEFORE UPDATE ON faqs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insertar FAQs de ejemplo para el tenant por defecto (Peluquería Bella Vista)
-- Nota: Cambiar el UUID por el ID real de tu tenant
INSERT INTO faqs (tenant_id, question, answer, keywords, category, priority) VALUES
  (
    (SELECT id FROM tenants WHERE business_name = 'Peluquería Bella Vista' LIMIT 1),
    '¿Cuáles son nuestros precios?',
    'Nuestros precios son: Corte €15, Tinte €25, Mechas €35, Corte + Tinte €35',
    ARRAY['precio', 'precios', 'coste', 'costo', 'cuanto', 'cuánto'],
    'precios',
    10
  ),
  (
    (SELECT id FROM tenants WHERE business_name = 'Peluquería Bella Vista' LIMIT 1),
    '¿Cuáles son nuestros horarios?',
    'Abrimos de Lunes a Viernes de 9:00 a 18:00, Sábados de 9:00 a 15:00. Domingos cerrado.',
    ARRAY['horario', 'horarios', 'abierto', 'cerrado', 'horas'],
    'horarios',
    10
  ),
  (
    (SELECT id FROM tenants WHERE business_name = 'Peluquería Bella Vista' LIMIT 1),
    '¿Dónde estamos ubicados?',
    'Nos encontramos en Calle Principal 123. Muy fácil de llegar, en el centro de la ciudad.',
    ARRAY['ubicacion', 'ubicación', 'direccion', 'dirección', 'donde', 'dónde'],
    'ubicacion',
    8
  ),
  (
    (SELECT id FROM tenants WHERE business_name = 'Peluquería Bella Vista' LIMIT 1),
    '¿Necesito cita previa?',
    'Sí, trabajamos solo con cita previa para garantizar la mejor atención. Puedes reservar escribiendo "reservar".',
    ARRAY['cita', 'reserva', 'reservar', 'appointment', 'previa'],
    'reservas',
    9
  ),
  (
    (SELECT id FROM tenants WHERE business_name = 'Peluquería Bella Vista' LIMIT 1),
    '¿Qué servicios ofrecemos?',
    'Ofrecemos cortes de pelo, tintes, mechas, y tratamientos capilares. Pregunta por nuestros combos especiales.',
    ARRAY['servicios', 'servicio', 'que', 'qué', 'ofrecemos', 'hacemos'],
    'servicios',
    9
  );

-- Mensaje de confirmación
SELECT 'Tabla FAQs creada correctamente con Row Level Security activado' as status;

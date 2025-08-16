-- Migration: Initial database schema
-- File: 20250816-1200_initial_schema.sql
-- Description: Creates all tables with RLS for multi-tenancy

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  tz VARCHAR(50) NOT NULL DEFAULT 'Europe/Madrid',
  phone_masked VARCHAR(20) NOT NULL,
  locale VARCHAR(10) NOT NULL DEFAULT 'es',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  duration_min INTEGER NOT NULL CHECK (duration_min > 0),
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  slot_granularity_min INTEGER NOT NULL DEFAULT 30 CHECK (slot_granularity_min > 0),
  buffer_min INTEGER NOT NULL DEFAULT 0 CHECK (buffer_min >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(20) NOT NULL CHECK (whatsapp ~ '^\+\d{10,15}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, whatsapp)
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  start_ts TIMESTAMPTZ NOT NULL,
  end_ts TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'expired')),
  gcal_event_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  CHECK (end_ts > start_ts)
);

-- Create faqs table
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key VARCHAR(50) NOT NULL CHECK (key IN ('prices', 'services', 'address', 'hours') OR key LIKE 'custom:%'),
  content_text TEXT NOT NULL
);

-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('whatsapp', 'instagram')),
  provider VARCHAR(50) NOT NULL,
  business_number VARCHAR(20) NOT NULL,
  page_id VARCHAR(255),
  webhook_secret VARCHAR(255) NOT NULL,
  is_live BOOLEAN NOT NULL DEFAULT false
);

-- Create message_logs table
CREATE TABLE IF NOT EXISTS message_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('in', 'out')),
  template_name VARCHAR(100),
  payload_json JSONB NOT NULL,
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_services_tenant_id ON services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp ON customers(tenant_id, whatsapp);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_id ON appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_ts ON appointments(start_ts);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_faqs_tenant_id ON faqs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_channels_tenant_id ON channels(tenant_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_tenant_id ON message_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_ts ON message_logs(ts);

-- Create unique constraint to prevent double bookings
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_tenant_start_active 
ON appointments(tenant_id, start_ts) 
WHERE status IN ('pending', 'confirmed');

-- Create exclusion constraint for overlapping appointments (advanced)
-- This prevents any overlapping time slots for the same tenant
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE appointments ADD CONSTRAINT IF NOT EXISTS excl_appointments_overlap 
EXCLUDE USING gist (
  tenant_id WITH =, 
  tsrange(start_ts, end_ts) WITH &&
) WHERE (status IN ('pending', 'confirmed'));

-- Enable Row Level Security
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenants
CREATE POLICY IF NOT EXISTS "Tenants can only see their own data" ON tenants
  FOR ALL USING (id = current_setting('app.current_tenant_id')::UUID);

-- Create RLS policies for services
CREATE POLICY IF NOT EXISTS "Services are tenant-isolated" ON services
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create RLS policies for customers
CREATE POLICY IF NOT EXISTS "Customers are tenant-isolated" ON customers
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create RLS policies for appointments
CREATE POLICY IF NOT EXISTS "Appointments are tenant-isolated" ON appointments
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create RLS policies for faqs
CREATE POLICY IF NOT EXISTS "FAQs are tenant-isolated" ON faqs
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create RLS policies for channels
CREATE POLICY IF NOT EXISTS "Channels are tenant-isolated" ON channels
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create RLS policies for message_logs
CREATE POLICY IF NOT EXISTS "Message logs are tenant-isolated" ON message_logs
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Create function to clean expired appointments
CREATE OR REPLACE FUNCTION clean_expired_appointments()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE appointments 
  SET status = 'expired'
  WHERE status = 'pending' 
    AND expires_at < NOW()
    AND expires_at IS NOT NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

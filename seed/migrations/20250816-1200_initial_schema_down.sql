-- Rollback script for initial schema
-- File: 20250816-1200_initial_schema_down.sql

-- Drop function
DROP FUNCTION IF EXISTS clean_expired_appointments();

-- Drop RLS policies
DROP POLICY IF EXISTS "Tenants can only see their own data" ON tenants;
DROP POLICY IF EXISTS "Services are tenant-isolated" ON services;
DROP POLICY IF EXISTS "Customers are tenant-isolated" ON customers;
DROP POLICY IF EXISTS "Appointments are tenant-isolated" ON appointments;
DROP POLICY IF EXISTS "FAQs are tenant-isolated" ON faqs;
DROP POLICY IF EXISTS "Channels are tenant-isolated" ON channels;
DROP POLICY IF EXISTS "Message logs are tenant-isolated" ON message_logs;

-- Disable RLS
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE faqs DISABLE ROW LEVEL SECURITY;
ALTER TABLE channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE message_logs DISABLE ROW LEVEL SECURITY;

-- Drop tables in reverse order (foreign key dependencies)
DROP TABLE IF EXISTS message_logs;
DROP TABLE IF EXISTS channels;
DROP TABLE IF EXISTS faqs;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS tenants;

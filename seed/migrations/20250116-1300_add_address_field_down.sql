-- Migration Rollback: Remove address field from tenants table
-- Date: 2025-01-16

-- Remove address field from tenants table
ALTER TABLE tenants 
DROP COLUMN IF EXISTS address;

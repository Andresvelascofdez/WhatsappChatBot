-- Migration: Add address field to tenants table
-- Date: 2025-01-16

-- Add address field to tenants table
ALTER TABLE tenants 
ADD COLUMN address TEXT;

-- Add comment for documentation
COMMENT ON COLUMN tenants.address IS 'Physical address of the business';

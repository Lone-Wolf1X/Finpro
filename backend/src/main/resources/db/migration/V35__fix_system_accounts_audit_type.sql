-- Fix type mismatch for audit fields in system_accounts
-- BaseEntity uses String for created_by/updated_by, but V27 created them as BIGINT with FKs.
-- We need to change them to VARCHAR to match BaseEntity and other tables (V18).

-- 1. Drop foreign key constraints (if they exist)
ALTER TABLE system_accounts DROP CONSTRAINT IF EXISTS fk_system_account_created_by;
ALTER TABLE system_accounts DROP CONSTRAINT IF EXISTS fk_system_account_updated_by;

-- 2. Alter columns to VARCHAR
-- We cast to VARCHAR to preserve any existing IDs as strings
ALTER TABLE system_accounts 
    ALTER COLUMN created_by TYPE VARCHAR(255) USING created_by::VARCHAR,
    ALTER COLUMN updated_by TYPE VARCHAR(255) USING updated_by::VARCHAR;

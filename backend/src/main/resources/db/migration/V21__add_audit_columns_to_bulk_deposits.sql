-- V21: Add missing audit fields (created_by, updated_by) to bulk_deposits table
-- This aligns the table with BaseEntity which BulkDeposit extending.

ALTER TABLE bulk_deposits ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE bulk_deposits ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

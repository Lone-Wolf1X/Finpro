-- V31: Fix audit field types and add missing columns in pending_transactions
-- 1. Drop foreign key constraints for audit fields if they exist
ALTER TABLE pending_transactions DROP CONSTRAINT IF EXISTS fk_pending_txn_created_by;
ALTER TABLE pending_transactions DROP CONSTRAINT IF EXISTS fk_pending_txn_updated_by;

-- 2. Alter column types for audit fields to match BaseEntity
ALTER TABLE pending_transactions 
ALTER COLUMN created_by TYPE VARCHAR(100),
ALTER COLUMN updated_by TYPE VARCHAR(100);

-- 3. Add missing system_account_id column
ALTER TABLE pending_transactions 
ADD COLUMN IF NOT EXISTS system_account_id BIGINT;

-- 4. Add foreign key for system_account_id
ALTER TABLE pending_transactions 
ADD CONSTRAINT fk_pending_txn_system_account 
FOREIGN KEY (system_account_id) REFERENCES system_accounts(id);

-- 5. Add index for system_account_id
CREATE INDEX IF NOT EXISTS idx_pending_txn_system_account ON pending_transactions(system_account_id);

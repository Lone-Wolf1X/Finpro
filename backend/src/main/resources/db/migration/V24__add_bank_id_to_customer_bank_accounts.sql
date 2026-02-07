-- Add bank_id column to customer_bank_accounts table
ALTER TABLE customer_bank_accounts
ADD COLUMN IF NOT EXISTS bank_id BIGINT;

-- Add foreign key constraint
ALTER TABLE customer_bank_accounts
ADD CONSTRAINT fk_customer_bank_accounts_bank
FOREIGN KEY (bank_id) REFERENCES banks(id);

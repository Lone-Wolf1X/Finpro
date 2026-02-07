-- V30: Add balance column to customer_bank_accounts
ALTER TABLE customer_bank_accounts 
ADD COLUMN IF NOT EXISTS balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00;

-- Comment on balance column
COMMENT ON COLUMN customer_bank_accounts.balance IS 'Current physical balance in the bank account';

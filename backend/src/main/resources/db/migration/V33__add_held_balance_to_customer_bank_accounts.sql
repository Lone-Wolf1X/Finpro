-- Add held_balance column to customer_bank_accounts table
ALTER TABLE customer_bank_accounts 
ADD COLUMN held_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00;

-- Comment for the new column
COMMENT ON COLUMN customer_bank_accounts.held_balance IS 'Funds blocked for IPO applications or pending transactions';

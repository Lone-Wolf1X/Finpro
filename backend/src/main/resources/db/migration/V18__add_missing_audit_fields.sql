-- V18: Add missing audit fields (created_by, updated_by) to align with BaseEntity
-- Affected tables: banks, ledger_accounts, ledger_transactions, investors, customer_portfolios, transaction_fees

-- banks
ALTER TABLE banks ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE banks ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

-- ledger_accounts
ALTER TABLE ledger_accounts ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE ledger_accounts ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

-- ledger_transactions
ALTER TABLE ledger_transactions ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE ledger_transactions ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

-- investors
ALTER TABLE investors ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE investors ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

-- customer_portfolios
ALTER TABLE customer_portfolios ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE customer_portfolios ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

-- transaction_fees
ALTER TABLE transaction_fees ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE transaction_fees ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

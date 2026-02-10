-- Disable Foreign Key checks temporarily (or rely on CASCADE)
-- Truncate main transactional tables
TRUNCATE TABLE ledger_transactions RESTART IDENTITY CASCADE;
TRUNCATE TABLE pending_transactions RESTART IDENTITY CASCADE;
TRUNCATE TABLE customer_bank_accounts RESTART IDENTITY CASCADE;
TRUNCATE TABLE ipo_applications RESTART IDENTITY CASCADE;
TRUNCATE TABLE bulk_deposit_items RESTART IDENTITY CASCADE;
TRUNCATE TABLE bulk_deposits RESTART IDENTITY CASCADE;
TRUNCATE TABLE transaction_fees RESTART IDENTITY CASCADE;
TRUNCATE TABLE customer_portfolios RESTART IDENTITY CASCADE;

-- Truncate Customer/Investor data
TRUNCATE TABLE investors RESTART IDENTITY CASCADE;
TRUNCATE TABLE customers RESTART IDENTITY CASCADE;
-- Note: User and Tenant tables are usually preserved in a "reset data" scenario unless specified.
-- Keeping Users (Admin/Auth) ensures you don't lose login access.

-- Truncate Financial Accounts (Balances)
-- This will wipe "Office Cash", "Core Capital" etc. 
-- The Backend Service will re-initialize them on next startup/request if checking logic exists.
TRUNCATE TABLE ledger_accounts RESTART IDENTITY CASCADE;
TRUNCATE TABLE system_accounts RESTART IDENTITY CASCADE;

-- Optional: Clear Audit Logs if they exist (ActivityLog?)
-- TRUNCATE TABLE activity_logs RESTART IDENTITY CASCADE;

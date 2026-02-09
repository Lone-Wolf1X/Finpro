-- Disable Foreign Key checks temporarily (or rely on CASCADE)
-- Truncate main transactional tables
TRUNCATE TABLE ledger_transaction RESTART IDENTITY CASCADE;
TRUNCATE TABLE pending_transaction RESTART IDENTITY CASCADE;
TRUNCATE TABLE customer_bank_account RESTART IDENTITY CASCADE;
TRUNCATE TABLE ipo_application RESTART IDENTITY CASCADE;
TRUNCATE TABLE bulk_deposit_item RESTART IDENTITY CASCADE;
TRUNCATE TABLE bulk_deposit RESTART IDENTITY CASCADE;
TRUNCATE TABLE transaction_fee RESTART IDENTITY CASCADE;

-- Truncate Customer data
TRUNCATE TABLE customer RESTART IDENTITY CASCADE;
-- Note: User and Tenant tables are usually preserved in a "reset data" scenario unless specified.
-- Keeping Users (Admin/Auth) ensures you don't lose login access.

-- Truncate Financial Accounts (Balances)
-- This will wipe "Office Cash", "Core Capital" etc. 
-- The Backend Service will re-initialize them on next startup/request if checking logic exists.
TRUNCATE TABLE ledger_account RESTART IDENTITY CASCADE;
TRUNCATE TABLE system_account RESTART IDENTITY CASCADE;

-- Optional: Clear Audit Logs if they exist (ActivityLog?)
-- TRUNCATE TABLE activity_log RESTART IDENTITY CASCADE;

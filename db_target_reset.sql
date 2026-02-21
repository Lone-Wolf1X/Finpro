-- Targeted Reset: IPO Applications, Transactions, and Balances (Preserving Records)
-- 1. Clear Transactional History & Allotment Data
TRUNCATE TABLE ledger_transactions RESTART IDENTITY CASCADE;
TRUNCATE TABLE pending_transactions RESTART IDENTITY CASCADE;
TRUNCATE TABLE ipo_applications RESTART IDENTITY CASCADE;
TRUNCATE TABLE customer_portfolios RESTART IDENTITY CASCADE;
TRUNCATE TABLE bulk_deposit_items RESTART IDENTITY CASCADE;
TRUNCATE TABLE bulk_deposits RESTART IDENTITY CASCADE;
TRUNCATE TABLE account_liens RESTART IDENTITY CASCADE;
TRUNCATE TABLE allotment_drafts RESTART IDENTITY CASCADE;
TRUNCATE TABLE ipo_allotment_summary RESTART IDENTITY CASCADE;
-- 2. Reset Customer Bank Balances to Zero (Keep the rows)
UPDATE customer_bank_accounts
SET balance = 0.00,
    held_balance = 0.00,
    updated_at = CURRENT_TIMESTAMP;
-- 3. Reset Ledger/System Account Balances to Zero (Keep the rows)
-- This keeps "Office Cash", "Core Capital Account", "IPO Fund Hold" etc. intact but empty.
UPDATE ledger_accounts
SET balance = 0.00,
    updated_at = CURRENT_TIMESTAMP;
-- 4. Set Initial Balance for Testing (Optional)
-- If you want customers to start with some money, uncomment below:
-- UPDATE customer_bank_accounts SET balance = 100000.00 WHERE status = 'ACTIVE';
-- Verify counts
SELECT 'Transactions' as table_name,
    COUNT(*)
FROM ledger_transactions
UNION ALL
SELECT 'Applications',
    COUNT(*)
FROM ipo_applications
UNION ALL
SELECT 'Portfolios',
    COUNT(*)
FROM customer_portfolios
UNION ALL
SELECT 'Bank Accounts (Rows)',
    COUNT(*)
FROM customer_bank_accounts;
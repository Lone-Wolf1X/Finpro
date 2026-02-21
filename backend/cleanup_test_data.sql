-- Clean IPO test data and reset balances for fresh testing
-- Run this script to prepare database for manual testing
-- 1. Delete all IPO applications and related data
DELETE FROM allotment_drafts;
DELETE FROM ipo_allotment_summary;
DELETE FROM customer_portfolio
WHERE application_id IS NOT NULL;
DELETE FROM account_liens
WHERE application_id IS NOT NULL;
DELETE FROM ipo_applications;
-- 2. Delete all IPOs (optional - uncomment if you want to recreate IPOs)
-- DELETE FROM ipos;
-- 3. Reset customer bank account balances to a test amount (10 lakhs)
UPDATE customer_bank_accounts
SET balance = 1000000.00,
    held_balance = 0.00,
    updated_at = CURRENT_TIMESTAMP
WHERE status = 'ACTIVE';
-- 4. Reset ledger accounts to test balances
UPDATE ledger_accounts
SET balance = 5000000.00,
    updated_at = CURRENT_TIMESTAMP
WHERE account_type = 'CUSTOMER'
    AND status = 'ACTIVE';
-- 5. Clear ledger transactions related to IPOs (optional - keeps audit trail if commented)
-- DELETE FROM ledger_transactions WHERE transaction_type = 'ALLOTMENT';
-- DELETE FROM ledger_transactions WHERE particulars LIKE '%IPO%';
-- 6. Verify cleanup
SELECT 'IPO Applications' as table_name,
    COUNT(*) as count
FROM ipo_applications
UNION ALL
SELECT 'Allotment Drafts',
    COUNT(*)
FROM allotment_drafts
UNION ALL
SELECT 'IPO Summaries',
    COUNT(*)
FROM ipo_allotment_summary
UNION ALL
SELECT 'Active Liens',
    COUNT(*)
FROM account_liens
WHERE released_at IS NULL
UNION ALL
SELECT 'Customer Accounts',
    COUNT(*)
FROM customer_bank_accounts
WHERE status = 'ACTIVE';
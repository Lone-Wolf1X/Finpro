-- Comprehensive IPO and Portfolio Cleanup Script
-- Purpose: Fresh start for testing the IPO lifecycle
-- 1. Clear Portfolio data related to IPOs
DELETE FROM customer_portfolios
WHERE ipo_id IS NOT NULL;
-- 2. Clear IPO applications
DELETE FROM ipo_applications;
-- 3. Clear IPOs
DELETE FROM ipos;
-- 4. Reset blocked/held balances in bank accounts
UPDATE customer_bank_accounts
SET held_balance = 0;
-- 5. Clear ledger transactions related to IPOs and CASBA
DELETE FROM ledger_transactions
WHERE transaction_type IN ('ALLOTMENT', 'REFUND', 'FEE')
    OR particulars LIKE '%IPO%'
    OR particulars LIKE '%CASBA%';
-- 6. Reset sequences for clean IDs
ALTER SEQUENCE IF EXISTS ipos_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS ipo_applications_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS customer_portfolios_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS ledger_transactions_id_seq RESTART WITH 1;
-- Optional: If you want to clear ALL portfolio data (buy/sell testing)
-- DELETE FROM customer_portfolios;
-- ALTER SEQUENCE IF EXISTS customer_portfolios_id_seq RESTART WITH 1;
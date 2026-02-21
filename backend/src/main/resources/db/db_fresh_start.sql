-- Database Fresh Start Script (Finalized)
-- This script clears all transactional and IPO-related data while keeping core metadata (banks, customers, users).
BEGIN;
-- 1. Clear Transactional History
TRUNCATE TABLE bulk_deposit_items CASCADE;
TRUNCATE TABLE bulk_deposits CASCADE;
TRUNCATE TABLE ledger_transactions CASCADE;
TRUNCATE TABLE pending_transactions CASCADE;
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE account_liens CASCADE;
-- 2. Clear IPO and Allotment Data
TRUNCATE TABLE ipo_applications CASCADE;
TRUNCATE TABLE allotment_drafts CASCADE;
TRUNCATE TABLE ipo_allotment_summary CASCADE;
-- Clear Portfolios and IPOs
DELETE FROM customer_portfolios;
DELETE FROM ipos;
-- 3. Reset all balances to zero
UPDATE customer_bank_accounts
SET balance = 0,
    held_balance = 0;
UPDATE ledger_accounts
SET balance = 0;
UPDATE system_accounts
SET balance = 0;
-- 4. Reset sequences
ALTER SEQUENCE IF EXISTS bulk_deposits_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS bulk_deposit_items_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS ledger_transactions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS pending_transactions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS audit_logs_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS ipo_applications_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS account_liens_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS ipos_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS ipo_allotment_summary_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS allotment_drafts_id_seq RESTART WITH 1;
COMMIT;
-- Verification
SELECT 'DATABASE FRESH START COMPLETE' AS message;
SELECT (
        SELECT COUNT(*)
        FROM ledger_transactions
    ) AS transactions,
    (
        SELECT COUNT(*)
        FROM ipo_applications
    ) AS ipo_apps,
    (
        SELECT SUM(balance)
        FROM customer_bank_accounts
    ) AS customer_balance_total;
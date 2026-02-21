-- Clear IPO-related data for fresh start
-- This migration clears existing IPO applications and IPOs
-- Delete customer portfolios related to IPOs
DELETE FROM customer_portfolios
WHERE ipo_id IS NOT NULL;
-- Delete IPO applications
DELETE FROM ipo_applications;
-- Delete IPOs
DELETE FROM ipos;
-- Reset sequences (optional, for clean IDs)
-- ALTER SEQUENCE IF EXISTS ipos_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS ipo_applications_id_seq RESTART WITH 1;
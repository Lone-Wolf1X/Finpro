-- Add migration to convert IPO and related tables to use TIMESTAMP with time for dates
-- V32__upgrade_ipo_dates_to_datetime.sql

ALTER TABLE ipos ALTER COLUMN open_date TYPE TIMESTAMP;
ALTER TABLE ipos ALTER COLUMN close_date TYPE TIMESTAMP;
ALTER TABLE ipos ALTER COLUMN allotment_date TYPE TIMESTAMP;
ALTER TABLE ipos ALTER COLUMN listing_date TYPE TIMESTAMP;

-- Also update customer_portfolios if it uses DATE
ALTER TABLE customer_portfolios ALTER COLUMN holding_since TYPE TIMESTAMP;

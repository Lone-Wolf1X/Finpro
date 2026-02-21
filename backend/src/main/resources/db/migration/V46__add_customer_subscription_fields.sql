-- Add subscription and Demat AMC tracking fields to customers table
ALTER TABLE customers
ADD COLUMN subscription_paid_until DATE;
ALTER TABLE customers
ADD COLUMN demat_amc_paid_until DATE;
ALTER TABLE customers
ADD COLUMN is_demat_renewed BOOLEAN DEFAULT FALSE;
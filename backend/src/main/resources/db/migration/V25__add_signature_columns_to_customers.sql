-- Add signature columns to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS signature_path VARCHAR(255);

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS guardian_signature_path VARCHAR(255);

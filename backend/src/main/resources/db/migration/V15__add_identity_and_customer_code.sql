ALTER TABLE customers 
ADD COLUMN citizenship_number VARCHAR(50) UNIQUE,
ADD COLUMN nid_number VARCHAR(50) UNIQUE,
ADD COLUMN customer_code VARCHAR(50) UNIQUE;

-- Populate existing customers with a temporary code to satisfy NOT NULL if added later
-- For now, let's keep it nullable or provide a default.
-- The user said "when a customer is create give hima a customer id", so existing ones might need one too.
-- Format: 20260000001
UPDATE customers SET customer_code = 'PRE-' || id WHERE customer_code IS NULL;

ALTER TABLE customers ALTER COLUMN customer_code SET NOT NULL;

-- Remove unique constraint on email
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_email_key;

-- Remove unique constraint on phone/mobile if it exists
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_phone_key;
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_mobile_number_key;

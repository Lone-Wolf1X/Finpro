-- Add bank_id to customers table
ALTER TABLE customers
ADD COLUMN bank_id BIGINT;

-- Add foreign key constraint
ALTER TABLE customers
ADD CONSTRAINT fk_customer_bank
FOREIGN KEY (bank_id) REFERENCES banks(id);

-- Drop bank_name column as we now use bank_id
ALTER TABLE customers
DROP COLUMN bank_name;

-- Add index for bank_id
CREATE INDEX idx_customers_bank_id ON customers(bank_id);

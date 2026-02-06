-- V8: Enhance customers table with new fields
-- Add gender, DOB, customer type, and guardian support

-- Add new columns to customers table
ALTER TABLE customers
ADD COLUMN gender VARCHAR(10),
ADD COLUMN age INTEGER,
ADD COLUMN customer_type VARCHAR(10) DEFAULT 'MAJOR',
ADD COLUMN guardian_id BIGINT,
ADD COLUMN bank_account_number VARCHAR(50),
ADD COLUMN bank_name VARCHAR(100),
ADD COLUMN contact_number VARCHAR(20);

-- Add constraint for gender
ALTER TABLE customers
ADD CONSTRAINT chk_gender CHECK (gender IN ('MALE', 'FEMALE', 'OTHER'));

-- Add constraint for customer_type
ALTER TABLE customers
ADD CONSTRAINT chk_customer_type CHECK (customer_type IN ('MAJOR', 'MINOR'));

-- Add foreign key for guardian (self-referencing)
ALTER TABLE customers
ADD CONSTRAINT fk_guardian
FOREIGN KEY (guardian_id) REFERENCES customers(id);

-- Add index for guardian lookups
CREATE INDEX idx_customers_guardian_id ON customers(guardian_id);

-- Add index for customer type
CREATE INDEX idx_customers_type ON customers(customer_type);

-- Add index for date of birth
CREATE INDEX idx_customers_dob ON customers(date_of_birth);

-- Update existing customers to MAJOR type
UPDATE customers SET customer_type = 'MAJOR' WHERE customer_type IS NULL;

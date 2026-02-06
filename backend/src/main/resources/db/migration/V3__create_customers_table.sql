-- Create customers table for Core Module (KYC)
CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    date_of_birth DATE,
    address TEXT,
    kyc_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_by_user_id BIGINT,
    approved_by_user_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    CONSTRAINT chk_kyc_status CHECK (kyc_status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

-- Create index on email for faster lookups
CREATE INDEX idx_customers_email ON customers(email);

-- Create index on kyc_status for filtering
CREATE INDEX idx_customers_kyc_status ON customers(kyc_status);

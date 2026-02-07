-- Create customer_credentials table
CREATE TABLE customer_credentials (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    credential_type VARCHAR(50) NOT NULL,
    username VARCHAR(100),
    password VARCHAR(255),
    pin VARCHAR(100),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT fk_customer_credentials_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX idx_customer_credentials_customer_id ON customer_credentials(customer_id);
CREATE INDEX idx_customer_credentials_type ON customer_credentials(credential_type);

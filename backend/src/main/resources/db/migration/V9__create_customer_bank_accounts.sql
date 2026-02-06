-- V9: Create customer_bank_accounts table
-- Support multiple bank accounts per customer

CREATE TABLE customer_bank_accounts (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_type VARCHAR(20) DEFAULT 'SAVINGS',
    ifsc_code VARCHAR(20),
    branch_name VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    
    -- Foreign keys
    CONSTRAINT fk_bank_account_customer
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_account_type CHECK (account_type IN ('SAVINGS', 'CURRENT', 'FIXED_DEPOSIT')),
    CONSTRAINT chk_bank_account_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'CLOSED')),
    
    -- Unique constraint for account number per customer
    CONSTRAINT uk_customer_account UNIQUE (customer_id, account_number)
);

-- Indexes
CREATE INDEX idx_bank_accounts_customer ON customer_bank_accounts(customer_id);
CREATE INDEX idx_bank_accounts_primary ON customer_bank_accounts(is_primary);
CREATE INDEX idx_bank_accounts_status ON customer_bank_accounts(status);

-- Comments
COMMENT ON TABLE customer_bank_accounts IS 'Stores bank account information for customers';
COMMENT ON COLUMN customer_bank_accounts.is_primary IS 'Indicates if this is the primary account for transactions';

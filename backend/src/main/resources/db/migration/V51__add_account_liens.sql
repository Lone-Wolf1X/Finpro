-- Create account_liens table
CREATE TABLE IF NOT EXISTS account_liens (
    id BIGSERIAL PRIMARY KEY,
    bank_account_id BIGINT REFERENCES customer_bank_accounts(id),
    amount DECIMAL(15, 2) NOT NULL,
    purpose VARCHAR(100) NOT NULL,
    -- e.g., 'IPO_APPLICATION', 'PENDING_WITHDRAWAL'
    reference_id VARCHAR(100),
    -- e.g., ipo_application_id
    status VARCHAR(20) DEFAULT 'ACTIVE',
    -- ACTIVE, RELEASED, CANCELLED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tenant_id BIGINT
);
CREATE INDEX idx_account_liens_bank_account ON account_liens(bank_account_id);
CREATE INDEX idx_account_liens_reference ON account_liens(reference_id);
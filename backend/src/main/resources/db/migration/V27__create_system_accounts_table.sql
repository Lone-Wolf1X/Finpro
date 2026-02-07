-- Create system_accounts table for managing core capital, expenses, and subscription pools
CREATE TABLE system_accounts (
    id BIGSERIAL PRIMARY KEY,
    account_number VARCHAR(20) NOT NULL UNIQUE,
    account_code VARCHAR(50) NOT NULL UNIQUE,
    account_name VARCHAR(200) NOT NULL,
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    is_system_account BOOLEAN NOT NULL DEFAULT true,
    owner_id BIGINT,
    
    -- Audit fields (inherited from BaseEntity)
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    
    -- Foreign key to users table
    CONSTRAINT fk_system_account_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_system_account_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_system_account_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_system_accounts_account_code ON system_accounts(account_code);
CREATE INDEX idx_system_accounts_is_system ON system_accounts(is_system_account);
CREATE INDEX idx_system_accounts_owner_id ON system_accounts(owner_id);

-- Add comment to table
COMMENT ON TABLE system_accounts IS 'System accounts for managing core capital, expenses pool, subscription pool, and investor capital accounts';
COMMENT ON COLUMN system_accounts.account_number IS 'Unique account number (e.g., 100002026001)';
COMMENT ON COLUMN system_accounts.account_code IS 'Unique account code (e.g., CORE_CAPITAL, EXPENSES_POOL, SUBSCRIPTION_POOL)';
COMMENT ON COLUMN system_accounts.is_system_account IS 'True for system accounts (core, expenses, subscription), false for investor capital accounts';
COMMENT ON COLUMN system_accounts.owner_id IS 'User ID for account owner (admin for CORE_CAPITAL, investor for capital accounts)';

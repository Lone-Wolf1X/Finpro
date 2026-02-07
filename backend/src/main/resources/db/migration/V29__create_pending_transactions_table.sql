-- Create pending_transactions table for maker-checker workflow
CREATE TABLE pending_transactions (
    id BIGSERIAL PRIMARY KEY,
    transaction_type VARCHAR(50) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    account_id BIGINT,
    customer_id BIGINT,
    description TEXT,
    maker_user_id BIGINT NOT NULL,
    checker_user_id BIGINT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    is_bulk BOOLEAN NOT NULL DEFAULT false,
    bulk_data TEXT,
    rejection_reason TEXT,
    verified_at TIMESTAMP,
    
    -- Audit fields (inherited from BaseEntity)
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    
    -- Foreign keys
    CONSTRAINT fk_pending_txn_account FOREIGN KEY (account_id) REFERENCES customer_bank_accounts(id) ON DELETE CASCADE,
    CONSTRAINT fk_pending_txn_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_pending_txn_maker FOREIGN KEY (maker_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pending_txn_checker FOREIGN KEY (checker_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pending_txn_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_pending_txn_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT chk_pending_txn_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    CONSTRAINT chk_pending_txn_amount CHECK (amount > 0)
);

-- Create indexes
CREATE INDEX idx_pending_txn_status ON pending_transactions(status);
CREATE INDEX idx_pending_txn_type ON pending_transactions(transaction_type);
CREATE INDEX idx_pending_txn_customer ON pending_transactions(customer_id);
CREATE INDEX idx_pending_txn_account ON pending_transactions(account_id);
CREATE INDEX idx_pending_txn_maker ON pending_transactions(maker_user_id);
CREATE INDEX idx_pending_txn_created_at ON pending_transactions(created_at DESC);

-- Comments
COMMENT ON TABLE pending_transactions IS 'Pending transactions awaiting checker approval (maker-checker workflow)';
COMMENT ON COLUMN pending_transactions.transaction_type IS 'Type: DEPOSIT, WITHDRAWAL, BULK_DEPOSIT, CORE_CAPITAL_DEPOSIT';
COMMENT ON COLUMN pending_transactions.status IS 'Status: PENDING, APPROVED, REJECTED';
COMMENT ON COLUMN pending_transactions.is_bulk IS 'True for bulk deposit transactions';
COMMENT ON COLUMN pending_transactions.bulk_data IS 'JSON data for bulk transactions';

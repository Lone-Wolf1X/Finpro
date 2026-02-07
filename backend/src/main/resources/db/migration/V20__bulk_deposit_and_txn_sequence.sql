-- V20: Transaction ID Sequence and Bulk Deposit tables

-- Sequence for Transaction IDs
CREATE SEQUENCE IF NOT EXISTS transaction_id_seq START WITH 1 INCREMENT BY 1;

-- Bulk Deposit Batches
CREATE TABLE IF NOT EXISTS bulk_deposits (
    id BIGSERIAL PRIMARY KEY,
    batch_id VARCHAR(50) NOT NULL UNIQUE,
    maker_id BIGINT REFERENCES users(id),
    checker_id BIGINT REFERENCES users(id),
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    item_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tenant_id BIGINT,
    
    CONSTRAINT chk_bulk_deposit_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'RETURNED'))
);

-- Bulk Deposit Items
CREATE TABLE IF NOT EXISTS bulk_deposit_items (
    id BIGSERIAL PRIMARY KEY,
    batch_id VARCHAR(50) REFERENCES bulk_deposits(batch_id),
    customer_id BIGINT REFERENCES customers(id),
    amount DECIMAL(15, 2) NOT NULL,
    remarks TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tenant_id BIGINT
);

-- Index for faster lookup
CREATE INDEX idx_bulk_deposit_batch ON bulk_deposit_items(batch_id);
CREATE INDEX idx_bulk_deposit_status ON bulk_deposits(status);

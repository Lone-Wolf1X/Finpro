-- Create banks table
CREATE TABLE IF NOT EXISTS banks (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    local_body VARCHAR(255),
    is_casba BOOLEAN DEFAULT FALSE,
    casba_charge DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    CONSTRAINT chk_casba_charge CHECK (casba_charge >= 0 AND casba_charge <= 5)
);

-- Index for searching banks by name
CREATE INDEX idx_banks_name ON banks(name);

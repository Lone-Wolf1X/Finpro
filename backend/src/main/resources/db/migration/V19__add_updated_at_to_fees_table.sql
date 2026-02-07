-- V19: Add missing updated_at to transaction_fees table
ALTER TABLE transaction_fees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

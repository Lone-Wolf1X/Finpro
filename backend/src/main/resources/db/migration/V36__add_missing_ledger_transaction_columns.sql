-- Add missing columns to ledger_transactions
-- These columns are present in the Entity but missing from the database schema.

ALTER TABLE ledger_transactions
ADD COLUMN customer_id BIGINT,
ADD COLUMN customer_bank_account_id BIGINT,
ADD COLUMN ledger_account_id BIGINT,
ADD COLUMN investor_id BIGINT,
ADD COLUMN reference_type VARCHAR(50),
ADD COLUMN reference_id_long BIGINT,
ADD COLUMN is_dual_entry BOOLEAN DEFAULT false;

-- Add foreign key constraints
ALTER TABLE ledger_transactions
ADD CONSTRAINT fk_ledger_txn_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
ADD CONSTRAINT fk_ledger_txn_customer_bank FOREIGN KEY (customer_bank_account_id) REFERENCES customer_bank_accounts(id),
ADD CONSTRAINT fk_ledger_txn_system_account FOREIGN KEY (ledger_account_id) REFERENCES system_accounts(id),
ADD CONSTRAINT fk_ledger_txn_investor FOREIGN KEY (investor_id) REFERENCES investors(id);

-- Create indexes for performance
CREATE INDEX idx_ledger_txn_customer ON ledger_transactions(customer_id);
CREATE INDEX idx_ledger_txn_investor ON ledger_transactions(investor_id);

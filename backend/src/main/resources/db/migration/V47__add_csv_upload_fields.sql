-- Add CSV upload fields to bulk_deposits table
ALTER TABLE bulk_deposits
ADD COLUMN bank_name VARCHAR(100),
    ADD COLUMN transaction_reference VARCHAR(100),
    ADD COLUMN uploaded_file_name VARCHAR(255),
    ADD COLUMN upload_method VARCHAR(20) DEFAULT 'MANUAL';
-- Add bank transaction reference to bulk_deposit_items table
ALTER TABLE bulk_deposit_items
ADD COLUMN bank_transaction_ref VARCHAR(100);
-- Create index for transaction reference lookups
CREATE INDEX idx_bulk_deposit_txn_ref ON bulk_deposits(transaction_reference);
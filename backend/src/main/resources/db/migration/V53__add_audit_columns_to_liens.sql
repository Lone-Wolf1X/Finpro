-- Add missing audit columns to account_liens table
ALTER TABLE account_liens
ADD COLUMN created_by VARCHAR(255),
    ADD COLUMN updated_by VARCHAR(255);
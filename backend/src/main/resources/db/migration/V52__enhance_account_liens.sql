ALTER TABLE account_liens
ADD COLUMN start_date TIMESTAMP,
    ADD COLUMN expiry_date TIMESTAMP,
    ADD COLUMN reason TEXT;
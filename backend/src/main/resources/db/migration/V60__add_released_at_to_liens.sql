-- Add released_at column to account_liens table
ALTER TABLE account_liens
ADD COLUMN IF NOT EXISTS released_at TIMESTAMP;
COMMENT ON COLUMN account_liens.released_at IS 'Timestamp when the lien was released';
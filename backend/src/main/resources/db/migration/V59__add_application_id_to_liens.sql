-- Add application_id column to account_liens table
ALTER TABLE account_liens
ADD COLUMN IF NOT EXISTS application_id BIGINT REFERENCES ipo_applications(id);
-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_account_liens_application ON account_liens(application_id);
COMMENT ON COLUMN account_liens.application_id IS 'Reference to the IPO application that created this lien';
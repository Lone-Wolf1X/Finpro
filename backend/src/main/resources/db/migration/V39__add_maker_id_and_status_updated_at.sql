-- Add maker_id and status_updated_at columns to ipo_applications table
ALTER TABLE ipo_applications ADD COLUMN maker_id BIGINT;
ALTER TABLE ipo_applications ADD COLUMN status_updated_at TIMESTAMP;

-- Add index for maker_id
CREATE INDEX idx_ipo_applications_maker_id ON ipo_applications(maker_id);

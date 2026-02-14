-- Add checker_id column to ipo_applications table
ALTER TABLE ipo_applications ADD COLUMN checker_id BIGINT;

-- Add index for performance
CREATE INDEX idx_ipo_applications_checker_id ON ipo_applications(checker_id);

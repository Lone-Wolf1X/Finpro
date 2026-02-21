-- Add IssueType and SecurityType columns to ipos
ALTER TABLE ipos
ADD COLUMN issue_type VARCHAR(20) DEFAULT 'IPO';
ALTER TABLE ipos
ADD COLUMN security_type VARCHAR(20) DEFAULT 'EQUITY';
-- Add Share Categories to ipos
ALTER TABLE ipos
ADD COLUMN area_affected_shares BIGINT;
ALTER TABLE ipos
ADD COLUMN foreign_employment_shares BIGINT;
ALTER TABLE ipos
ADD COLUMN local_shares BIGINT;
ALTER TABLE ipos
ADD COLUMN public_shares BIGINT;
-- Add applied_category to ipo_applications
ALTER TABLE ipo_applications
ADD COLUMN applied_category VARCHAR(50);
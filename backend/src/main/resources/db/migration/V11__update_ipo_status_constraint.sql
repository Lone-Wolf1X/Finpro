-- V11: Update IPO application status constraint
-- Add PENDING_VERIFICATION and VERIFIED to the allowed status values

ALTER TABLE ipo_applications DROP CONSTRAINT IF EXISTS chk_ipo_app_status;

ALTER TABLE ipo_applications ADD CONSTRAINT chk_ipo_app_status 
    CHECK (application_status IN ('PENDING', 'PENDING_VERIFICATION', 'VERIFIED', 'APPROVED', 'REJECTED', 'ALLOTTED'));

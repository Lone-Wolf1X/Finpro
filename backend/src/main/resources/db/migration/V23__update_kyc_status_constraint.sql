-- V23: Update kyc_status constraint to include DRAFT and RETURNED
ALTER TABLE customers DROP CONSTRAINT IF EXISTS chk_kyc_status;
ALTER TABLE customers ADD CONSTRAINT chk_kyc_status CHECK (kyc_status IN ('PENDING', 'APPROVED', 'REJECTED', 'DRAFT', 'RETURNED'));

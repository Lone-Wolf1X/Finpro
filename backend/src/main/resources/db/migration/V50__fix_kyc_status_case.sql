-- Fix casing for KYC Status enum mapping
UPDATE customers
SET kyc_status = UPPER(kyc_status);
-- Ensure standard values just in case of typos
UPDATE customers
SET kyc_status = 'DRAFT'
WHERE kyc_status = 'Draft';
UPDATE customers
SET kyc_status = 'PENDING'
WHERE kyc_status = 'Pending';
UPDATE customers
SET kyc_status = 'APPROVED'
WHERE kyc_status = 'Approved';
UPDATE customers
SET kyc_status = 'REJECTED'
WHERE kyc_status = 'Rejected';
UPDATE customers
SET kyc_status = 'RETURNED'
WHERE kyc_status = 'Returned';
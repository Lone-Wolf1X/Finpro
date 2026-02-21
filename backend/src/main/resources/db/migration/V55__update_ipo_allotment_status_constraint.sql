-- Add ALLOTTED_PENDING and NOT_ALLOTTED_PENDING to ipo_applications allotment_status constraint
ALTER TABLE ipo_applications DROP CONSTRAINT IF EXISTS chk_allotment_status;
ALTER TABLE ipo_applications
ADD CONSTRAINT chk_allotment_status CHECK (
        allotment_status IN (
            'PENDING',
            'ALLOTTED',
            'NOT_ALLOTTED',
            'ALLOTTED_PENDING',
            'NOT_ALLOTTED_PENDING'
        )
    );
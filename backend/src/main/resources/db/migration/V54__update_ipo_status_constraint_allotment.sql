-- Add ALLOTMENT_PHASE to ipo status constraint
ALTER TABLE ipos DROP CONSTRAINT IF EXISTS chk_ipo_status;
ALTER TABLE ipos
ADD CONSTRAINT chk_ipo_status CHECK (
        status IN (
            'UPCOMING',
            'OPEN',
            'CLOSED',
            'ALLOTTED',
            'LISTED',
            'ALLOTMENT_PHASE'
        )
    );
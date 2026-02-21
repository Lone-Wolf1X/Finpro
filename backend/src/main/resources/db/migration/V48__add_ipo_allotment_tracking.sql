-- Add allotment tracking columns to ipos table
ALTER TABLE ipos
ADD COLUMN IF NOT EXISTS allotment_initiated_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS allotment_initiated_by VARCHAR(100);
-- Add comment
COMMENT ON COLUMN ipos.allotment_initiated_at IS 'Timestamp when allotment phase was initiated';
COMMENT ON COLUMN ipos.allotment_initiated_by IS 'Admin who initiated the allotment phase';
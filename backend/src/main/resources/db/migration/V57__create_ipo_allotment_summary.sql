-- Create ipo_allotment_summary table for admin reporting
CREATE TABLE ipo_allotment_summary (
    id BIGSERIAL PRIMARY KEY,
    ipo_id BIGINT NOT NULL REFERENCES ipos(id) ON DELETE CASCADE,
    -- Statistics
    total_applications INTEGER NOT NULL DEFAULT 0,
    total_allotted INTEGER NOT NULL DEFAULT 0,
    total_not_allotted INTEGER NOT NULL DEFAULT 0,
    total_shares_allotted INTEGER NOT NULL DEFAULT 0,
    total_amount_settled DECIMAL(15, 2) NOT NULL DEFAULT 0,
    -- Workflow tracking
    initiated_by BIGINT REFERENCES users(id),
    initiated_at TIMESTAMP,
    completed_at TIMESTAMP,
    completed_by BIGINT REFERENCES users(id),
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_ipo_summary UNIQUE(ipo_id)
);
-- Index for reporting queries
CREATE INDEX idx_ipo_summary_completed ON ipo_allotment_summary(completed_at);
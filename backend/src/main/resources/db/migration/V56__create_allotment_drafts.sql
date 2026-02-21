-- Create allotment_drafts table for Maker-Checker workflow
CREATE TABLE allotment_drafts (
    id BIGSERIAL PRIMARY KEY,
    ipo_id BIGINT NOT NULL REFERENCES ipos(id) ON DELETE CASCADE,
    application_id BIGINT NOT NULL REFERENCES ipo_applications(id) ON DELETE CASCADE,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    -- Allotment Decision
    is_allotted BOOLEAN NOT NULL,
    allotted_quantity INTEGER NOT NULL DEFAULT 0,
    -- Workflow
    maker_id BIGINT NOT NULL REFERENCES users(id),
    checker_id BIGINT REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    verified_at TIMESTAMP,
    remarks TEXT,
    CONSTRAINT chk_draft_status CHECK (
        status IN ('PENDING_VERIFICATION', 'APPROVED', 'REJECTED')
    ),
    CONSTRAINT chk_allotted_quantity CHECK (allotted_quantity >= 0)
);
-- Indexes for performance
CREATE INDEX idx_allotment_drafts_ipo ON allotment_drafts(ipo_id);
CREATE INDEX idx_allotment_drafts_status ON allotment_drafts(status);
CREATE INDEX idx_allotment_drafts_maker ON allotment_drafts(maker_id);
CREATE INDEX idx_allotment_drafts_checker ON allotment_drafts(checker_id);
-- Unique constraint to prevent duplicate drafts for same application
CREATE UNIQUE INDEX idx_unique_draft_per_application ON allotment_drafts(application_id)
WHERE status = 'PENDING_VERIFICATION';
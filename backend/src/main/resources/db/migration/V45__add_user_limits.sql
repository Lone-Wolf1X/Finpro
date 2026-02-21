-- Migration to add user transaction limits and enhancement requests table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS deposit_limit DECIMAL(19, 2);
ALTER TABLE users
ADD COLUMN IF NOT EXISTS withdrawal_limit DECIMAL(19, 2);
-- Populate default limits for existing users if they were null
UPDATE users
SET deposit_limit = 10000,
    withdrawal_limit = 10000
WHERE deposit_limit IS NULL;
CREATE TABLE IF NOT EXISTS user_limit_requests (
    id BIGSERIAL PRIMARY KEY,
    requester_id BIGINT NOT NULL,
    requested_deposit_limit DECIMAL(19, 2) NOT NULL,
    requested_withdrawal_limit DECIMAL(19, 2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    admin_comments TEXT,
    reviewed_at TIMESTAMP,
    reviewed_by_user_id BIGINT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    CONSTRAINT fk_limit_requests_requester FOREIGN KEY (requester_id) REFERENCES users(id)
);
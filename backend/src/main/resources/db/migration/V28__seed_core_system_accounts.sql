-- Seed core system accounts
-- These accounts are required for the system to function properly

INSERT INTO system_accounts (
    account_number,
    account_code,
    account_name,
    balance,
    is_system_account,
    created_at,
    updated_at
) VALUES
    ('100002026001', 'CORE_CAPITAL', 'Core Capital Account', 0.00, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('100002026002', 'EXPENSES_POOL', 'Expenses Pool Account', 0.00, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('100002026003', 'SUBSCRIPTION_POOL', 'Subscription Pool Account', 0.00, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (account_code) DO NOTHING;

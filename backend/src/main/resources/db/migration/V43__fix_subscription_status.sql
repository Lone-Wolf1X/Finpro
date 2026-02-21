-- Fix missing subscription status for Superadmin tenant and others
UPDATE tenants
SET subscription_status = 'ACTIVE',
    subscription_start_date = CURRENT_TIMESTAMP,
    subscription_end_date = CURRENT_TIMESTAMP + INTERVAL '100 years' -- Perpetual for superadmin
WHERE id = 1
    AND (
        subscription_status IS NULL
        OR subscription_status = ''
    );
-- Fix any other tenants with null status
UPDATE tenants
SET subscription_status = 'ACTIVE'
WHERE subscription_status IS NULL;
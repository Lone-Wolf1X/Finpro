-- Create tenant_usage table
CREATE TABLE tenant_usage (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    metric_key VARCHAR(50) NOT NULL,
    -- STORAGE_USED_MB, USER_COUNT, API_CALLS_COUNT
    metric_value DECIMAL(19, 2) DEFAULT 0,
    period_start TIMESTAMP,
    -- For monthly tracking
    period_end TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tenant_usage_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT uq_tenant_usage_metric_period UNIQUE (tenant_id, metric_key, period_start)
);
-- Add Billing Fields to Tenants if they don't exist
-- Using DO block to check column existence to prevent errors
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tenants'
        AND column_name = 'billing_cycle'
) THEN
ALTER TABLE tenants
ADD COLUMN billing_cycle VARCHAR(20) DEFAULT 'MONTHLY';
-- MONTHLY, YEARLY
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tenants'
        AND column_name = 'next_billing_date'
) THEN
ALTER TABLE tenants
ADD COLUMN next_billing_date TIMESTAMP;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tenants'
        AND column_name = 'auto_renew'
) THEN
ALTER TABLE tenants
ADD COLUMN auto_renew BOOLEAN DEFAULT TRUE;
END IF;
END $$;
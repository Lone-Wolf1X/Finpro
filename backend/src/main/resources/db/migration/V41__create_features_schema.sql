-- Create features table (Master list)
CREATE TABLE features (
    id BIGSERIAL PRIMARY KEY,
    feature_key VARCHAR(50) NOT NULL UNIQUE,
    -- e.g., CORE_BANKING, LOAN_MANAGEMENT
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    -- MODULE, LIMIT, API
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Create tenant_features table (Assignment)
CREATE TABLE tenant_features (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    feature_id BIGINT NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    config JSONB,
    -- For specific limits or configurations (e.g., max_users: 10)
    valid_until TIMESTAMP,
    -- Optional expiry for specific feature
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    CONSTRAINT fk_tenant_features_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_tenant_features_feature FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
    CONSTRAINT uq_tenant_feature UNIQUE (tenant_id, feature_id)
);
-- Seed Default Features
INSERT INTO features (feature_key, name, description, category)
VALUES (
        'CORE_BANKING',
        'Core Banking',
        'Basic banking operations like deposits and withdrawals',
        'MODULE'
    ),
    (
        'ACCOUNT_OPENING',
        'Account Opening',
        'Digital KYC and account opening workflow',
        'MODULE'
    ),
    (
        'LOAN_MANAGEMENT',
        'Loan Management',
        'Loan origination and servicing',
        'MODULE'
    ),
    (
        'PAYROLL',
        'Payroll System',
        'Corporate payroll processing',
        'MODULE'
    ),
    (
        'API_ACCESS',
        'API Access',
        'Access to developer APIs',
        'API'
    );
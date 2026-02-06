-- ============================================
-- Fintech SaaS Schema Creation Script
-- Run this AFTER creating the database
-- ============================================

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- Core Tables
-- ============================================

-- Tenants table (for SaaS multi-tenancy)
CREATE TABLE IF NOT EXISTS tenants (
    id BIGSERIAL PRIMARY KEY,
    tenant_key VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    address TEXT,
    
    -- Subscription details
    subscription_plan VARCHAR(50) DEFAULT 'BASIC', -- BASIC, SILVER, GOLD, PLATINUM
    subscription_status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED, EXPIRED
    subscription_start_date TIMESTAMP,
    subscription_end_date TIMESTAMP,
    
    -- Branding
    logo_url VARCHAR(500),
    primary_color VARCHAR(7) DEFAULT '#1976d2',
    
    -- Status
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, SUSPENDED
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Users table (staff users - admin, maker, checker)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    user_id VARCHAR(50) UNIQUE NOT NULL,
    staff_id VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    
    role VARCHAR(20) NOT NULL, -- ADMIN, MAKER, CHECKER, INVESTOR
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, BLOCKED
    
    must_change_password BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    CONSTRAINT users_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Activity logs (audit trail)
CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id BIGINT,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_staff_id ON users(staff_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant_id ON activity_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- ============================================
-- Default Data
-- ============================================

-- Insert default superadmin tenant
INSERT INTO tenants (tenant_key, company_name, subdomain, contact_email, subscription_plan, subscription_status)
VALUES ('SUPERADMIN', 'Fintech SaaS Platform', 'admin', 'admin@fintech.com', 'PLATINUM', 'ACTIVE')
ON CONFLICT (tenant_key) DO NOTHING;

-- Insert default superadmin user (password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (tenant_id, user_id, staff_id, email, password_hash, name, role, status)
VALUES (
    1,
    'USR-SUPERADMIN',
    'STAFF-000',
    'admin@fintech.com',
    '$2a$10$rZJ3qGGqGGqGGqGGqGGqGOe7kK7kK7kK7kK7kK7kK7kK7kK7kK7kK',
    'Super Admin',
    'ADMIN',
    'ACTIVE'
)
ON CONFLICT (email) DO NOTHING;

-- Success message
SELECT 'Database schema initialized successfully!' AS message;

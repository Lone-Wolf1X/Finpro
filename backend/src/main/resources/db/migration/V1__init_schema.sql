-- Create sequence for IDs if not exists
CREATE SEQUENCE IF NOT EXISTS tenants_id_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS users_id_seq START WITH 1 INCREMENT BY 1;

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id BIGINT PRIMARY KEY DEFAULT nextval('tenants_id_seq'),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    tenant_key VARCHAR(50) NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) NOT NULL UNIQUE,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    address TEXT,
    
    subscription_plan VARCHAR(50),
    subscription_status VARCHAR(20),
    subscription_start_date TIMESTAMP,
    subscription_end_date TIMESTAMP,
    
    logo_url VARCHAR(500),
    primary_color VARCHAR(7),
    
    status VARCHAR(20)
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY DEFAULT nextval('users_id_seq'),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    tenant_id BIGINT NOT NULL,
    user_id VARCHAR(50) NOT NULL UNIQUE,
    staff_id VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    
    name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    
    role VARCHAR(20) NOT NULL,
    status VARCHAR(20),
    must_change_password BOOLEAN,
    last_login TIMESTAMP
);

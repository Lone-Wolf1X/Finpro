-- V10: Create IPO tables
-- Support IPO listings and customer applications

-- Create ipos table
CREATE TABLE ipos (
    id BIGSERIAL PRIMARY KEY,
    company_name VARCHAR(200) NOT NULL,
    symbol VARCHAR(20),
    issue_size BIGINT NOT NULL,
    price_per_share DECIMAL(10, 2) NOT NULL,
    min_quantity INTEGER NOT NULL,
    max_quantity INTEGER NOT NULL,
    open_date DATE NOT NULL,
    close_date DATE NOT NULL,
    allotment_date DATE,
    listing_date DATE,
    status VARCHAR(20) DEFAULT 'UPCOMING',
    description TEXT,
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    
    -- Constraints
    CONSTRAINT chk_ipo_status CHECK (status IN ('UPCOMING', 'OPEN', 'CLOSED', 'ALLOTTED', 'LISTED')),
    CONSTRAINT chk_ipo_dates CHECK (close_date >= open_date),
    CONSTRAINT chk_ipo_quantity CHECK (max_quantity >= min_quantity)
);

-- Create ipo_applications table
CREATE TABLE ipo_applications (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    ipo_id BIGINT NOT NULL,
    bank_account_id BIGINT,
    quantity INTEGER NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    application_number VARCHAR(50) UNIQUE,
    application_status VARCHAR(20) DEFAULT 'PENDING',
    payment_status VARCHAR(20) DEFAULT 'PENDING',
    allotment_quantity INTEGER DEFAULT 0,
    allotment_status VARCHAR(20) DEFAULT 'PENDING',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    approved_by VARCHAR(255),
    
    -- Foreign keys
    CONSTRAINT fk_ipo_app_customer
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_ipo_app_ipo
        FOREIGN KEY (ipo_id) REFERENCES ipos(id) ON DELETE CASCADE,
    CONSTRAINT fk_ipo_app_bank_account
        FOREIGN KEY (bank_account_id) REFERENCES customer_bank_accounts(id),
    
    -- Constraints
    CONSTRAINT chk_ipo_app_status CHECK (application_status IN ('PENDING', 'APPROVED', 'REJECTED', 'ALLOTTED')),
    CONSTRAINT chk_payment_status CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED', 'FAILED')),
    CONSTRAINT chk_allotment_status CHECK (allotment_status IN ('PENDING', 'ALLOTTED', 'NOT_ALLOTTED'))
);

-- Indexes for ipos
CREATE INDEX idx_ipos_status ON ipos(status);
CREATE INDEX idx_ipos_open_date ON ipos(open_date);
CREATE INDEX idx_ipos_close_date ON ipos(close_date);

-- Indexes for ipo_applications
CREATE INDEX idx_ipo_apps_customer ON ipo_applications(customer_id);
CREATE INDEX idx_ipo_apps_ipo ON ipo_applications(ipo_id);
CREATE INDEX idx_ipo_apps_status ON ipo_applications(application_status);
CREATE INDEX idx_ipo_apps_payment ON ipo_applications(payment_status);
CREATE INDEX idx_ipo_apps_bank_account ON ipo_applications(bank_account_id);

-- Comments
COMMENT ON TABLE ipos IS 'Stores IPO listing information';
COMMENT ON TABLE ipo_applications IS 'Stores customer IPO applications';
COMMENT ON COLUMN ipo_applications.application_number IS 'Unique application reference number';

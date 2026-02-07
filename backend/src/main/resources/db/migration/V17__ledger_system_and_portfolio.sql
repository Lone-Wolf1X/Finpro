-- V17__ledger_system_and_portfolio.sql

-- 1. Ledger Accounts Table
CREATE TABLE IF NOT EXISTS ledger_accounts (
    id BIGSERIAL PRIMARY KEY,
    account_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(50) NOT NULL, -- OFFICE, CORE_CAPITAL, INVESTOR_LEDGER, CUSTOMER_LEDGER, FEE_INCOME, TAX_PAYABLE
    owner_id BIGINT, -- Linked to User ID for Investors, or Customer ID for Customers
    balance DECIMAL(15, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'NPR',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tenant_id BIGINT
);

-- 2. Transactions Table (Double Entry)
CREATE TABLE IF NOT EXISTS ledger_transactions (
    id BIGSERIAL PRIMARY KEY,
    debit_account_id BIGINT REFERENCES ledger_accounts(id),
    credit_account_id BIGINT REFERENCES ledger_accounts(id),
    amount DECIMAL(15, 2) NOT NULL,
    particulars TEXT,
    remarks TEXT,
    transaction_type VARCHAR(50) NOT NULL, -- DEPOSIT, WITHDRAWAL, FEE, ALLOTMENT, SETTLEMENT, REVERSAL
    reference_id VARCHAR(100),
    maker_id BIGINT,
    checker_id BIGINT,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tenant_id BIGINT
);

-- 3. Investor Information Table
CREATE TABLE IF NOT EXISTS investors (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    total_investment DECIMAL(15, 2) DEFAULT 0.00,
    held_amount DECIMAL(15, 2) DEFAULT 0.00,
    available_balance DECIMAL(15, 2) DEFAULT 0.00,
    profit_share_percentage DECIMAL(5, 2) DEFAULT 60.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tenant_id BIGINT
);

-- 4. Update Customers for Investor linkage and Documents
ALTER TABLE customers ADD COLUMN IF NOT EXISTS investor_id BIGINT REFERENCES investors(id);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS photo_path VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS signature_path VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS guardian_photo_path VARCHAR(255);

-- 5. Customer Portfolio Table (Tracking Shares/Scrip)
CREATE TABLE IF NOT EXISTS customer_portfolios (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT REFERENCES customers(id),
    ipo_id BIGINT REFERENCES ipos(id),
    scrip_symbol VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    purchase_price DECIMAL(10, 2) NOT NULL,
    total_cost DECIMAL(15, 2) NOT NULL,
    holding_since DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'HELD', -- HELD, SOLD
    is_bonus BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tenant_id BIGINT
);

-- 6. Transaction Fees Table
CREATE TABLE IF NOT EXISTS transaction_fees (
    id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT REFERENCES ledger_transactions(id),
    fee_type VARCHAR(50) NOT NULL, -- BROKER_COMMISSION, SEBON_FEE, DP_CHARGE, CGT
    amount DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tenant_id BIGINT
);

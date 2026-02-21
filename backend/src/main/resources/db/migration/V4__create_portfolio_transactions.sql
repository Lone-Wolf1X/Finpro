CREATE TABLE IF NOT EXISTS portfolio_transactions (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    scrip_symbol VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    price_per_share DECIMAL(19, 2) NOT NULL,
    fees DECIMAL(19, 2),
    transaction_fee DECIMAL(19, 2),
    total_amount DECIMAL(19, 2) NOT NULL,
    transaction_date DATE NOT NULL,
    remarks TEXT,
    reference_id VARCHAR(50)
);
CREATE INDEX idx_portfolio_transactions_customer ON portfolio_transactions(customer_id);
-- Enhance customer_portfolio table with IPO tracking
ALTER TABLE customer_portfolios
ADD COLUMN IF NOT EXISTS application_id BIGINT REFERENCES ipo_applications(id);
ALTER TABLE customer_portfolios
ADD COLUMN IF NOT EXISTS allotment_date TIMESTAMP;
ALTER TABLE customer_portfolios
ADD COLUMN IF NOT EXISTS allotted_by BIGINT REFERENCES users(id);
-- Add index for IPO-based queries
CREATE INDEX IF NOT EXISTS idx_portfolio_ipo ON customer_portfolios(ipo_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_customer_ipo ON customer_portfolios(customer_id, ipo_id);
-- Add comments for documentation
COMMENT ON COLUMN customer_portfolios.application_id IS 'Reference to the IPO application that resulted in this portfolio entry';
COMMENT ON COLUMN customer_portfolios.allotment_date IS 'Date when shares were allotted to customer';
COMMENT ON COLUMN customer_portfolios.allotted_by IS 'User (Checker) who approved the allotment';
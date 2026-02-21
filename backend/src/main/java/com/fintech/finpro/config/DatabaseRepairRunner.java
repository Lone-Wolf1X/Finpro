package com.fintech.finpro.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DatabaseRepairRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("Executing Emergency Database Repair...");

        String sql = "CREATE TABLE IF NOT EXISTS portfolio_transactions (" +
                "id BIGSERIAL PRIMARY KEY, " +
                "customer_id BIGINT NOT NULL, " +
                "transaction_type VARCHAR(50) NOT NULL, " +
                "scrip_symbol VARCHAR(50) NOT NULL, " +
                "quantity INTEGER NOT NULL, " +
                "price_per_share DECIMAL(19, 2) NOT NULL, " +
                "fees DECIMAL(19, 2), " +
                "transaction_fee DECIMAL(19, 2), " +
                "total_amount DECIMAL(19, 2) NOT NULL, " +
                "transaction_date DATE NOT NULL, " +
                "remarks TEXT, " +
                "reference_id VARCHAR(50)" +
                ");";

        try {
            jdbcTemplate.execute(sql);
            System.out.println("Table 'portfolio_transactions' checked/created successfully.");

            // Create index
            jdbcTemplate.execute(
                    "CREATE INDEX IF NOT EXISTS idx_portfolio_transactions_customer ON portfolio_transactions(customer_id);");
            System.out.println("Index 'idx_portfolio_transactions_customer' checked/created successfully.");

        } catch (Exception e) {
            System.err.println("Database Repair Failed: " + e.getMessage());
            e.printStackTrace();
        }
    }
}

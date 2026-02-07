package com.fintech.finpro.config;

import com.fintech.finpro.service.SystemAccountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Database initialization configuration
 * Initializes core system accounts on application startup
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class DatabaseInitializer {

    private final SystemAccountService systemAccountService;

    @Bean
    public CommandLineRunner initializeDatabase() {
        return args -> {
            log.info("Starting database initialization...");

            try {
                // Initialize core system accounts
                systemAccountService.initializeCoreAccounts();

                log.info("Database initialization completed successfully");
            } catch (Exception e) {
                log.error("Error during database initialization", e);
                // Don't throw exception to allow application to start
                // Manual initialization may be needed
            }
        };
    }
}

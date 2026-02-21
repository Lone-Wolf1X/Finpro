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

    private final com.fintech.finpro.repository.TenantRepository tenantRepository;
    private final com.fintech.finpro.repository.UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final SystemAccountService systemAccountService;

    @Bean
    public CommandLineRunner initializeDatabase() {
        return args -> {
            log.info("Starting database initialization...");

            try {
                // Initialize core system accounts
                // Initialize core system accounts
                systemAccountService.initializeCoreAccounts();

                // Initialize System Tenant and Super Admin
                if (tenantRepository.findBySubdomain("system").isEmpty()) {
                    log.info("Creating System Tenant...");
                    com.fintech.finpro.entity.Tenant systemTenant = com.fintech.finpro.entity.Tenant.builder()
                            .companyName("Finpro System")
                            .tenantKey("system")
                            .subdomain("system")
                            .contactEmail("admin@finpro.com")
                            .subscriptionPlan("ENTERPRISE")
                            .subscriptionStatus("ACTIVE")
                            .subscriptionStartDate(java.time.LocalDateTime.now())
                            .status("ACTIVE")
                            .build();
                    systemTenant = tenantRepository.save(systemTenant);

                    log.info("Creating Super Admin User...");
                    com.fintech.finpro.entity.User superAdmin = com.fintech.finpro.entity.User.builder()
                            .tenantId(systemTenant.getId())
                            .email("admin@finpro.com")
                            .passwordHash(passwordEncoder.encode("admin123"))
                            .name("Super Admin")
                            .role(com.fintech.finpro.enums.Role.SUPERADMIN)
                            .status("ACTIVE")
                            .userId("admin@finpro.com")
                            .staffId("SYS-ADMIN-01")
                            .build();
                    userRepository.save(superAdmin);
                    log.info("Super Admin created: admin@finpro.com / admin123");
                }

                log.info("Database initialization completed successfully");
            } catch (Exception e) {
                log.error("Error during database initialization", e);
                // Don't throw exception to allow application to start
                // Manual initialization may be needed
            }
        };
    }
}

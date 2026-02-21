package com.fintech.finpro.service;

import com.fintech.finpro.entity.*;
import com.fintech.finpro.enums.Role;
import com.fintech.finpro.repository.*;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final FeatureRepository featureRepository;
    private final TenantFeatureRepository tenantFeatureRepository;
    private final TenantUsageRepository tenantUsageRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public Tenant createTenant(String companyName, String subdomain, String adminEmail, String adminPassword,
            String plan) {
        // 1. Create Tenant
        Tenant tenant = Tenant.builder()
                .companyName(companyName)
                .tenantKey(subdomain.toLowerCase().replaceAll("\\s+", "")) // simple key generation
                .subdomain(subdomain.toLowerCase())
                .contactEmail(adminEmail)
                .subscriptionPlan(plan)
                .subscriptionStatus("ACTIVE")
                .subscriptionStartDate(LocalDateTime.now())
                .subscriptionEndDate(LocalDateTime.now().plusDays(30)) // Default 30 days trial/plan
                .billingCycle("MONTHLY")
                .autoRenew(true)
                .status("ACTIVE")
                .build();

        tenant = tenantRepository.save(tenant);

        // 2. Create Admin User
        User admin = User.builder()
                .tenantId(tenant.getId())
                .email(adminEmail)
                .passwordHash(passwordEncoder.encode(adminPassword))
                .name("Admin " + companyName)
                .role(Role.ADMIN)
                .status("ACTIVE")
                .userId(adminEmail) // Using email as user_id for simplicity
                .staffId("ADM-" + tenant.getId())

                .build();

        userRepository.save(admin);

        // 3. Assign Default Features
        assignDefaultFeatures(tenant);

        // 4. Initialize Usage Metrics
        initializeUsageMetrics(tenant);

        return tenant;
    }

    private void assignDefaultFeatures(Tenant tenant) {
        List<Feature> allFeatures = featureRepository.findAll();
        for (Feature feature : allFeatures) {
            // By default enable MODULES, disable extra APIs/Limits unless plan specifies
            boolean enabled = "MODULE".equals(feature.getCategory());

            TenantFeature tf = TenantFeature.builder()
                    .tenant(tenant)
                    .feature(feature)
                    .isEnabled(enabled)
                    .build();
            tenantFeatureRepository.save(tf);
        }
    }

    private void initializeUsageMetrics(Tenant tenant) {
        createMetric(tenant, "USER_COUNT");
        createMetric(tenant, "STORAGE_USED_MB");
        createMetric(tenant, "API_CALLS_COUNT");
    }

    private void createMetric(Tenant tenant, String key) {
        TenantUsage usage = TenantUsage.builder()
                .tenant(tenant)
                .metricKey(key)
                .periodStart(LocalDateTime.now())
                .build();
        tenantUsageRepository.save(usage);
    }

    public List<Tenant> getAllTenants() {
        return tenantRepository.findAll();
    }

    public Tenant getTenantById(Long id) {
        return tenantRepository.findById(id).orElseThrow(() -> new RuntimeException("Tenant not found"));
    }

    @Transactional
    public void updateFeatureStatus(Long tenantId, Long featureId, boolean isEnabled) {
        TenantFeature tf = tenantFeatureRepository.findByTenantIdAndFeatureId(tenantId, featureId)
                .orElseThrow(() -> new RuntimeException("Feature mapping not found"));
        tf.setIsEnabled(isEnabled);
        tenantFeatureRepository.save(tf);
    }
}

package com.fintech.finpro.service;

import com.fintech.finpro.entity.Tenant;
import com.fintech.finpro.entity.TenantUsage;
import com.fintech.finpro.repository.TenantRepository;
import com.fintech.finpro.repository.TenantUsageRepository;
import com.fintech.finpro.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UsageService {

    private final TenantRepository tenantRepository;
    private final TenantUsageRepository tenantUsageRepository;
    private final UserRepository userRepository;

    // Run every hour to update usage stats
    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void updateUsageStats() {
        List<Tenant> tenants = tenantRepository.findAll();
        for (Tenant tenant : tenants) {
            updateUserCount(tenant);
            // Storage and API calls would be updated by interceptors or file services
        }
    }

    private void updateUserCount(Tenant tenant) {
        long count = userRepository.countByTenantId(tenant.getId());

        TenantUsage usage = tenantUsageRepository.findByTenantIdAndMetricKeyAndPeriodStart(
                tenant.getId(), "USER_COUNT", null)
                .orElse(TenantUsage.builder()
                        .tenant(tenant)
                        .metricKey("USER_COUNT")
                        .periodStart(null) // Global count, or separate by month if needed
                        .build());

        usage.setMetricValue(BigDecimal.valueOf(count));
        tenantUsageRepository.save(usage);
    }

    // Call this method whenever a file is uploaded
    @Transactional
    public void incrementStorage(Long tenantId, long bytes) {
        // storage logic
    }
}

package com.fintech.finpro.repository;

import com.fintech.finpro.entity.TenantUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TenantUsageRepository extends JpaRepository<TenantUsage, Long> {
    List<TenantUsage> findByTenantId(Long tenantId);
    Optional<TenantUsage> findByTenantIdAndMetricKeyAndPeriodStart(Long tenantId, String metricKey, LocalDateTime periodStart);
}

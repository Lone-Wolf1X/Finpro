package com.fintech.finpro.repository;

import com.fintech.finpro.entity.TenantFeature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TenantFeatureRepository extends JpaRepository<TenantFeature, Long> {
    List<TenantFeature> findByTenantId(Long tenantId);
    Optional<TenantFeature> findByTenantIdAndFeatureId(Long tenantId, Long featureId);
    Optional<TenantFeature> findByTenantIdAndFeatureFeatureKey(Long tenantId, String featureKey);
}

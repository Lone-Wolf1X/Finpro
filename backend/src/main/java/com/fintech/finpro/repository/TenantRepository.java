package com.fintech.finpro.repository;

import com.fintech.finpro.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for Tenant entity
 */
@Repository
public interface TenantRepository extends JpaRepository<Tenant, Long> {

    Optional<Tenant> findByTenantKey(String tenantKey);

    Optional<Tenant> findBySubdomain(String subdomain);

    boolean existsByTenantKey(String tenantKey);

    boolean existsBySubdomain(String subdomain);
}

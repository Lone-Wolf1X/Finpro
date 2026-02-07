package com.fintech.finpro.repository;

import com.fintech.finpro.entity.CustomerCredential;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerCredentialRepository extends JpaRepository<CustomerCredential, Long> {

    List<CustomerCredential> findByCustomerId(Long customerId);

    List<CustomerCredential> findByCustomerIdAndIsActive(Long customerId, Boolean isActive);

    Optional<CustomerCredential> findByCustomerIdAndCredentialType(Long customerId, String credentialType);
}

package com.fintech.finpro.repository;

import com.fintech.finpro.entity.AccountLien;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountLienRepository extends JpaRepository<AccountLien, Long> {
    List<AccountLien> findByBankAccountId(Long bankAccountId);

    Optional<AccountLien> findByApplicationId(Long applicationId);

    List<AccountLien> findByReferenceId(String referenceId);

    List<AccountLien> findByBankAccountIdAndStatus(Long bankAccountId, String status);
}

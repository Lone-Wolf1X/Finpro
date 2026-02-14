package com.fintech.finpro.repository;

import com.fintech.finpro.entity.LedgerAccount;
import com.fintech.finpro.enums.LedgerAccountType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LedgerAccountRepository extends JpaRepository<LedgerAccount, Long> {
    @org.springframework.data.jpa.repository.Query("SELECT l FROM LedgerAccount l WHERE l.accountType = :accountType AND (:ownerId IS NULL AND l.ownerId IS NULL OR l.ownerId = :ownerId)")
    Optional<LedgerAccount> findByAccountTypeAndOwnerId(
            @org.springframework.data.repository.query.Param("accountType") LedgerAccountType accountType,
            @org.springframework.data.repository.query.Param("ownerId") Long ownerId);

    List<LedgerAccount> findByAccountType(LedgerAccountType accountType);

    Optional<LedgerAccount> findByAccountName(String accountName);

    List<LedgerAccount> findByOwnerId(Long ownerId);
}

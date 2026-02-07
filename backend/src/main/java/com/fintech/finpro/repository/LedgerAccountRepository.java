package com.fintech.finpro.repository;

import com.fintech.finpro.entity.LedgerAccount;
import com.fintech.finpro.enums.LedgerAccountType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LedgerAccountRepository extends JpaRepository<LedgerAccount, Long> {
    Optional<LedgerAccount> findByAccountTypeAndOwnerId(LedgerAccountType accountType, Long ownerId);

    List<LedgerAccount> findByAccountType(LedgerAccountType accountType);

    Optional<LedgerAccount> findByAccountName(String accountName);
}

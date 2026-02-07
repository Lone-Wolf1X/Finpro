package com.fintech.finpro.repository;

import com.fintech.finpro.entity.LedgerTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LedgerTransactionRepository extends JpaRepository<LedgerTransaction, Long> {
    List<LedgerTransaction> findByDebitAccountIdOrCreditAccountId(Long debitAccountId, Long creditAccountId);

    List<LedgerTransaction> findByReferenceId(String referenceId);

    @org.springframework.data.jpa.repository.Query(value = "SELECT nextval('transaction_id_seq')", nativeQuery = true)
    Long getNextTransactionSequence();
}

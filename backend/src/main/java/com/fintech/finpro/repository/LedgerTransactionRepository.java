package com.fintech.finpro.repository;

import com.fintech.finpro.entity.LedgerTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LedgerTransactionRepository extends JpaRepository<LedgerTransaction, Long> {
    List<LedgerTransaction> findByDebitAccountIdOrCreditAccountId(Long debitAccountId, Long creditAccountId);

    List<LedgerTransaction> findByReferenceId(String referenceId);

    List<LedgerTransaction> findByCustomerBankAccountIdOrderByCreatedAtDesc(Long accountId);

    @org.springframework.data.jpa.repository.Query("SELECT lt FROM LedgerTransaction lt WHERE lt.customerBankAccount.id = :accountId AND lt.createdAt >= :startDate AND lt.createdAt <= :endDate ORDER BY lt.createdAt DESC")
    List<LedgerTransaction> findByAccountAndDateRange(
            @org.springframework.data.repository.query.Param("accountId") Long accountId,
            @org.springframework.data.repository.query.Param("startDate") java.time.LocalDateTime startDate,
            @org.springframework.data.repository.query.Param("endDate") java.time.LocalDateTime endDate);

    @org.springframework.data.jpa.repository.Query(value = "SELECT nextval('transaction_id_seq')", nativeQuery = true)
    Long getNextTransactionSequence();
}

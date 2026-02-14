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

        @org.springframework.data.jpa.repository.Query("SELECT lt FROM LedgerTransaction lt WHERE (lt.debitAccount.id = :accountId OR lt.creditAccount.id = :accountId) AND lt.createdAt >= :startDate AND lt.createdAt <= :endDate ORDER BY lt.createdAt DESC")
        List<LedgerTransaction> findByLedgerAccountAndDateRange(
                        @org.springframework.data.repository.query.Param("accountId") Long accountId,
                        @org.springframework.data.repository.query.Param("startDate") java.time.LocalDateTime startDate,
                        @org.springframework.data.repository.query.Param("endDate") java.time.LocalDateTime endDate);

        @org.springframework.data.jpa.repository.Query(value = "SELECT nextval('transaction_id_seq')", nativeQuery = true)
        Long getNextTransactionSequence();

        @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(CASE " +
                        "WHEN lt.transactionType IN :creditTypes THEN lt.amount " +
                        "WHEN lt.transactionType IN :debitTypes THEN -lt.amount " +
                        "ELSE 0 END), 0) " +
                        "FROM LedgerTransaction lt WHERE lt.customerBankAccount.id = :accountId AND lt.createdAt < :beforeDate AND lt.status = 'COMPLETED'")
        java.math.BigDecimal getOpeningBalance(
                        @org.springframework.data.repository.query.Param("accountId") Long accountId,
                        @org.springframework.data.repository.query.Param("beforeDate") java.time.LocalDateTime beforeDate,
                        @org.springframework.data.repository.query.Param("creditTypes") List<com.fintech.finpro.enums.LedgerTransactionType> creditTypes,
                        @org.springframework.data.repository.query.Param("debitTypes") List<com.fintech.finpro.enums.LedgerTransactionType> debitTypes);

        @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(CASE " +
                        "WHEN lt.creditAccount.id = :accountId THEN lt.amount " +
                        "WHEN lt.debitAccount.id = :accountId THEN -lt.amount " +
                        "ELSE 0 END), 0) " +
                        "FROM LedgerTransaction lt WHERE (lt.debitAccount.id = :accountId OR lt.creditAccount.id = :accountId) AND lt.createdAt < :beforeDate AND lt.status = 'COMPLETED'")
        java.math.BigDecimal getLedgerOpeningBalance(
                        @org.springframework.data.repository.query.Param("accountId") Long accountId,
                        @org.springframework.data.repository.query.Param("beforeDate") java.time.LocalDateTime beforeDate);

        List<LedgerTransaction> findByCustomerId(Long customerId);

        List<LedgerTransaction> findByDebitAccountIdInOrCreditAccountIdIn(List<Long> debitAccountIds,
                        List<Long> creditAccountIds);
}

package com.fintech.finpro.repository;

import com.fintech.finpro.entity.PendingTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PendingTransactionRepository extends JpaRepository<PendingTransaction, Long> {

    /**
     * Find all pending transactions by status
     */
    List<PendingTransaction> findByStatus(String status);

    /**
     * Find all pending transactions
     */
    List<PendingTransaction> findByStatusOrderByCreatedAtDesc(String status);

    /**
     * Find pending transactions by transaction type
     */
    List<PendingTransaction> findByTransactionType(String transactionType);

    /**
     * Find pending transactions by customer
     */
    List<PendingTransaction> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    /**
     * Find pending transactions created by maker
     */
    List<PendingTransaction> findByCreatedByUserIdOrderByCreatedAtDesc(Long makerId);

    /**
     * Find pending transactions verified by checker
     */
    List<PendingTransaction> findByVerifiedByUserIdOrderByCreatedAtDesc(Long checkerId);

    /**
     * Find all bulk pending transactions
     */
    List<PendingTransaction> findByIsBulkTrue();

    /**
     * Find core capital deposits
     */
    @Query("SELECT pt FROM PendingTransaction pt WHERE pt.transactionType = 'CORE_CAPITAL_DEPOSIT' ORDER BY pt.createdAt DESC")
    List<PendingTransaction> findCoreCapitalDeposits();

    /**
     * Count pending transactions by status
     */
    long countByStatus(String status);

    /**
     * Find pending transactions by status and type
     */
    @Query("SELECT pt FROM PendingTransaction pt WHERE pt.status = :status AND pt.transactionType = :type ORDER BY pt.createdAt DESC")
    List<PendingTransaction> findByStatusAndType(@Param("status") String status, @Param("type") String type);
}

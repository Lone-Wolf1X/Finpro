package com.fintech.finpro.repository;

import com.fintech.finpro.entity.BulkDepositItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BulkDepositItemRepository extends JpaRepository<BulkDepositItem, Long> {
    List<BulkDepositItem> findByBulkDepositBatchId(String batchId);

    List<BulkDepositItem> findByCustomerId(Long customerId);
}

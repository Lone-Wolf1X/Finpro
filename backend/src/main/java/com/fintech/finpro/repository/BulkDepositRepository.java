package com.fintech.finpro.repository;

import com.fintech.finpro.entity.BulkDeposit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BulkDepositRepository extends JpaRepository<BulkDeposit, Long> {
    Optional<BulkDeposit> findByBatchId(String batchId);
}

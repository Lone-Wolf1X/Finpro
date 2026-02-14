package com.fintech.finpro.repository;

import com.fintech.finpro.entity.TransactionFee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionFeeRepository extends JpaRepository<TransactionFee, Long> {
    List<TransactionFee> findByTransactionId(Long transactionId);

    void deleteByTransactionId(Long transactionId);
}

package com.fintech.finpro.repository;

import com.fintech.finpro.entity.PortfolioTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PortfolioTransactionRepository extends JpaRepository<PortfolioTransaction, Long> {
    List<PortfolioTransaction> findByCustomerIdOrderByTransactionDateDesc(Long customerId);

    List<PortfolioTransaction> findByTransactionType(String transactionType);

    List<PortfolioTransaction> findByCustomerIdAndScripSymbolOrderByTransactionDateDesc(Long customerId,
            String scripSymbol);
}

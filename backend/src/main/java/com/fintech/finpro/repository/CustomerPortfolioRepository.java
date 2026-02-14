package com.fintech.finpro.repository;

import com.fintech.finpro.entity.CustomerPortfolio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerPortfolioRepository extends JpaRepository<CustomerPortfolio, Long> {
    List<CustomerPortfolio> findByCustomerId(Long customerId);

    List<CustomerPortfolio> findByCustomerIdAndScripSymbol(Long customerId, String scripSymbol);

    List<CustomerPortfolio> findByIpo(com.fintech.finpro.entity.IPO ipo);
}

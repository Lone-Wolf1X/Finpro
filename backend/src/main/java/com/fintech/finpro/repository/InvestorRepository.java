package com.fintech.finpro.repository;

import com.fintech.finpro.entity.Investor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvestorRepository extends JpaRepository<Investor, Long> {

    /**
     * Find investor by investor code
     */
    Optional<Investor> findByInvestorCode(String investorCode);

    /**
     * Find investor by user ID
     */
    Optional<Investor> findByUserId(Long userId);

    /**
     * Find admin investor
     */
    Optional<Investor> findByIsAdminTrue();

    /**
     * Find all active investors
     */
    List<Investor> findByStatus(String status);

    /**
     * Find all investors except admin
     */
    List<Investor> findByIsAdminFalse();

    /**
     * Get last investor code for generating next code
     */
    @Query("SELECT i FROM Investor i WHERE i.isAdmin = false ORDER BY i.investorCode DESC LIMIT 1")
    Optional<Investor> findLastInvestorCode();

    /**
     * Check if investor code exists
     */
    boolean existsByInvestorCode(String investorCode);

    /**
     * Check if user is already an investor
     */
    boolean existsByUserId(Long userId);
}

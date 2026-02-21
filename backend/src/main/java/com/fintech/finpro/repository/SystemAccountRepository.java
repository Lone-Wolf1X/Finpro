package com.fintech.finpro.repository;

import com.fintech.finpro.entity.SystemAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SystemAccountRepository extends JpaRepository<SystemAccount, Long> {

    /**
     * Find system account by account code
     */
    Optional<SystemAccount> findByAccountCode(String accountCode);

    /**
     * Find system account by account number
     */
    Optional<SystemAccount> findByAccountNumber(String accountNumber);

    /**
     * Find system account by account name
     */
    Optional<SystemAccount> findByAccountName(String accountName);

    /**
     * Find all system accounts
     */
    List<SystemAccount> findByIsSystemAccountTrue();

    /**
     * Find CORE_CAPITAL account
     */
    @Query("SELECT sa FROM SystemAccount sa WHERE sa.accountCode = 'CORE_CAPITAL'")
    Optional<SystemAccount> findCoreCapitalAccount();

    /**
     * Find EXPENSES_POOL account
     */
    @Query("SELECT sa FROM SystemAccount sa WHERE sa.accountCode = 'EXPENSES_POOL'")
    Optional<SystemAccount> findExpensesPoolAccount();

    /**
     * Find SUBSCRIPTION_POOL account
     */
    @Query("SELECT sa FROM SystemAccount sa WHERE sa.accountCode = 'SUBSCRIPTION_POOL'")
    Optional<SystemAccount> findSubscriptionPoolAccount();

    /**
     * Get last account number for generating next account number
     */
    @Query("SELECT sa FROM SystemAccount sa ORDER BY sa.accountNumber DESC LIMIT 1")
    Optional<SystemAccount> findLastAccountNumber();

    /**
     * Check if system accounts are initialized
     */
    @Query("SELECT COUNT(sa) FROM SystemAccount sa WHERE sa.isSystemAccount = true")
    long countSystemAccounts();
}

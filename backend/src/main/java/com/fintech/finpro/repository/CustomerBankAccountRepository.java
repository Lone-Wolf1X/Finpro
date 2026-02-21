package com.fintech.finpro.repository;

import com.fintech.finpro.entity.CustomerBankAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerBankAccountRepository extends JpaRepository<CustomerBankAccount, Long> {

    @Query("SELECT b FROM CustomerBankAccount b WHERE b.customer.id = :customerId")
    List<CustomerBankAccount> findByCustomerId(@Param("customerId") Long customerId);

    @Query("SELECT b FROM CustomerBankAccount b WHERE b.customer.id = :customerId AND b.status = 'ACTIVE'")
    List<CustomerBankAccount> findActiveAccountsByCustomerId(@Param("customerId") Long customerId);

    @Query("SELECT b FROM CustomerBankAccount b WHERE b.customer.id = :customerId AND b.isPrimary = true")
    Optional<CustomerBankAccount> findPrimaryAccountByCustomerId(@Param("customerId") Long customerId);

    Optional<CustomerBankAccount> findByCustomerIdAndIsPrimaryTrue(Long customerId);

    @Query("SELECT b FROM CustomerBankAccount b WHERE b.customer.id = :customerId AND b.accountNumber = :accountNumber")
    Optional<CustomerBankAccount> findByCustomerIdAndAccountNumber(
            @Param("customerId") Long customerId,
            @Param("accountNumber") String accountNumber);

    Optional<CustomerBankAccount> findByAccountNumber(String accountNumber);

    boolean existsByCustomerIdAndAccountNumber(Long customerId, String accountNumber);
}

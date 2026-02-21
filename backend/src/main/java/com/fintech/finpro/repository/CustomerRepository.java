package com.fintech.finpro.repository;

import com.fintech.finpro.entity.Customer;
import com.fintech.finpro.enums.CustomerType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    List<Customer> findByEmail(String email);

    java.util.Optional<Customer> findByCitizenshipNumber(String citizenshipNumber);

    java.util.Optional<Customer> findByNidNumber(String nidNumber);

    List<Customer> findByKycStatus(com.fintech.finpro.enums.KycStatus kycStatus);

    List<Customer> findByCustomerType(CustomerType customerType);

    @Query("SELECT c FROM Customer c WHERE c.customerType = com.fintech.finpro.enums.CustomerType.MAJOR AND c.kycStatus = com.fintech.finpro.enums.KycStatus.APPROVED")
    List<Customer> findEligibleGuardians();

    @Query("SELECT c FROM Customer c WHERE c.guardian.id = :guardianId")
    List<Customer> findByGuardianId(@Param("guardianId") Long guardianId);

    @Query("SELECT c FROM Customer c WHERE " +
            "LOWER(c.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(c.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(c.phone) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Customer> searchCustomers(@Param("search") String search);

    @Query("SELECT c FROM Customer c WHERE c.customerType = :type AND c.kycStatus = :status")
    List<Customer> findByTypeAndStatus(@Param("type") CustomerType type, @Param("status") com.fintech.finpro.enums.KycStatus status);

    @Query("SELECT MAX(c.customerCode) FROM Customer c WHERE c.customerCode LIKE CONCAT(:yearPrefix, '%')")
    String findMaxCustomerCodeByYear(@Param("yearPrefix") String yearPrefix);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    java.util.Optional<Customer> findByCustomerCode(String customerCode);

    long countByKycStatus(com.fintech.finpro.enums.KycStatus kycStatus);
}

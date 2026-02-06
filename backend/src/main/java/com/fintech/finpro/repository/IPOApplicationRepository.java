package com.fintech.finpro.repository;

import com.fintech.finpro.entity.IPOApplication;
import com.fintech.finpro.enums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IPOApplicationRepository extends JpaRepository<IPOApplication, Long> {

    List<IPOApplication> findByCustomerId(Long customerId);

    List<IPOApplication> findByIpoId(Long ipoId);

    List<IPOApplication> findByApplicationStatus(ApplicationStatus status);

    @Query("SELECT a FROM IPOApplication a WHERE a.customer.id = :customerId AND a.ipo.id = :ipoId")
    Optional<IPOApplication> findByCustomerIdAndIpoId(
            @Param("customerId") Long customerId,
            @Param("ipoId") Long ipoId);

    @Query("SELECT a FROM IPOApplication a WHERE a.applicationStatus = 'PENDING'")
    List<IPOApplication> findPendingApplications();

    @Query("SELECT a FROM IPOApplication a WHERE a.customer.id = :customerId AND a.applicationStatus = :status")
    List<IPOApplication> findByCustomerIdAndStatus(
            @Param("customerId") Long customerId,
            @Param("status") ApplicationStatus status);

    Optional<IPOApplication> findByApplicationNumber(String applicationNumber);

    boolean existsByCustomerIdAndIpoId(Long customerId, Long ipoId);
}

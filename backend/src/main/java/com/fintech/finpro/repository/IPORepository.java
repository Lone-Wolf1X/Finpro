package com.fintech.finpro.repository;

import com.fintech.finpro.entity.IPO;
import com.fintech.finpro.enums.IPOStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IPORepository extends JpaRepository<IPO, Long> {

    List<IPO> findByStatus(IPOStatus status);

    @Query("SELECT i FROM IPO i WHERE (i.status = 'OPEN' OR i.status = 'UPCOMING') AND i.openDate <= CURRENT_TIMESTAMP AND i.closeDate >= CURRENT_TIMESTAMP")
    List<IPO> findActiveIPOs();

    @Query("SELECT i FROM IPO i WHERE i.status = 'UPCOMING' AND i.openDate > CURRENT_TIMESTAMP")
    List<IPO> findUpcomingIPOs();

    @Query("SELECT i FROM IPO i WHERE i.status = 'UPCOMING' AND i.openDate <= CURRENT_TIMESTAMP")
    List<IPO> findIPOsToOpen();

    @Query("SELECT i FROM IPO i WHERE i.status = 'OPEN' AND i.closeDate <= CURRENT_TIMESTAMP")
    List<IPO> findIPOsToClose();

    List<IPO> findByCompanyNameContainingIgnoreCase(String companyName);
}

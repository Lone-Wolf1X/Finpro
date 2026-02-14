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

    @Query("SELECT i FROM IPO i WHERE i.status = com.fintech.finpro.enums.IPOStatus.OPEN ORDER BY i.openDate ASC")
    List<IPO> findActiveIPOs();

    @Query("SELECT i FROM IPO i WHERE i.status = com.fintech.finpro.enums.IPOStatus.UPCOMING AND i.openDate > :now")
    List<IPO> findUpcomingIPOs(java.time.LocalDateTime now);

    @Query("SELECT i FROM IPO i WHERE i.status = com.fintech.finpro.enums.IPOStatus.UPCOMING AND i.openDate <= :now")
    List<IPO> findIPOsToOpen(java.time.LocalDateTime now);

    @Query("SELECT i FROM IPO i WHERE i.status = com.fintech.finpro.enums.IPOStatus.OPEN AND i.closeDate <= :now")
    List<IPO> findIPOsToClose(java.time.LocalDateTime now);

    @Query("SELECT i FROM IPO i WHERE i.status = com.fintech.finpro.enums.IPOStatus.CLOSED AND i.openDate < :now AND i.closeDate > :now")
    List<IPO> findIPOsToReopen(java.time.LocalDateTime now);

    List<IPO> findByCompanyNameContainingIgnoreCase(String companyName);

    java.util.Optional<IPO> findBySymbol(String symbol);
}

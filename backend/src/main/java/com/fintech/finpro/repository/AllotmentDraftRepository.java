package com.fintech.finpro.repository;

import com.fintech.finpro.entity.AllotmentDraft;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AllotmentDraftRepository extends JpaRepository<AllotmentDraft, Long> {

    List<AllotmentDraft> findByIpoIdAndStatus(Long ipoId, String status);

    List<AllotmentDraft> findByStatus(String status);

    List<AllotmentDraft> findByIpoId(Long ipoId);

    Optional<AllotmentDraft> findByApplicationIdAndStatus(Long applicationId, String status);

    @Query("SELECT COUNT(d) FROM AllotmentDraft d WHERE d.ipo.id = :ipoId AND d.status = 'PENDING_VERIFICATION'")
    long countPendingDraftsByIpoId(@Param("ipoId") Long ipoId);

    @Query("SELECT d FROM AllotmentDraft d WHERE d.ipo.id = :ipoId AND d.status = 'PENDING_VERIFICATION'")
    List<AllotmentDraft> findPendingDraftsByIpoId(@Param("ipoId") Long ipoId);

    void deleteByIpoIdAndStatus(Long ipoId, String status);
}

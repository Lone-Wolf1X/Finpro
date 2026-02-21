package com.fintech.finpro.repository;

import com.fintech.finpro.entity.IPOAllotmentSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IPOAllotmentSummaryRepository extends JpaRepository<IPOAllotmentSummary, Long> {

    Optional<IPOAllotmentSummary> findByIpoId(Long ipoId);

    List<IPOAllotmentSummary> findAllByOrderByCompletedAtDesc();

    List<IPOAllotmentSummary> findByCompletedAtIsNotNullOrderByCompletedAtDesc();
}

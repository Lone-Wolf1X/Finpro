package com.fintech.finpro.repository;

import com.fintech.finpro.entity.Investor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InvestorRepository extends JpaRepository<Investor, Long> {
    Optional<Investor> findByUserId(Long userId);
}

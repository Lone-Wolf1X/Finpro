package com.fintech.finpro.repository;

import com.fintech.finpro.entity.Bank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BankRepository extends JpaRepository<Bank, Long> {
    Optional<Bank> findByName(String name);

    List<Bank> findByActiveTrue();
}

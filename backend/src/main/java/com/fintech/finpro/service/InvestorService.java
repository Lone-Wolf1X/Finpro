package com.fintech.finpro.service;

import com.fintech.finpro.entity.Investor;
import com.fintech.finpro.entity.User;
import com.fintech.finpro.repository.InvestorRepository;
import com.fintech.finpro.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InvestorService {

    private final InvestorRepository investorRepository;
    private final UserRepository userRepository;

    @Transactional
    public Investor createInvestor(Long userId, BigDecimal initialInvestment) {
        User user = userRepository.findById(java.util.Objects.requireNonNull(userId))
                .orElseThrow(() -> new RuntimeException("User not found"));

        Investor investor = Investor.builder()
                .user(user)
                .totalInvestment(initialInvestment)
                .availableBalance(initialInvestment)
                .heldAmount(BigDecimal.ZERO)
                .profitSharePercentage(new BigDecimal("60.00"))
                .build();

        return investorRepository.save(java.util.Objects.requireNonNull(investor));
    }

    public List<Investor> getAllInvestors() {
        return investorRepository.findAll();
    }

    public Investor getInvestorById(Long id) {
        return investorRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Investor not found"));
    }

    @Transactional
    public void addInvestment(Long investorId, BigDecimal amount) {
        Investor investor = getInvestorById(investorId);
        investor.setTotalInvestment(investor.getTotalInvestment().add(amount));
        investor.setAvailableBalance(investor.getAvailableBalance().add(amount));
        investorRepository.save(investor);
    }
}

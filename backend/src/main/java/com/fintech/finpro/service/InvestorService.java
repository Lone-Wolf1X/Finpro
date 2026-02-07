package com.fintech.finpro.service;

import com.fintech.finpro.dto.CreateInvestorRequest;
import com.fintech.finpro.entity.Investor;
import com.fintech.finpro.entity.SystemAccount;
import com.fintech.finpro.entity.User;
import com.fintech.finpro.enums.Role;
import com.fintech.finpro.repository.InvestorRepository;
import com.fintech.finpro.repository.UserRepository;
import com.fintech.finpro.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InvestorService {

    private final InvestorRepository investorRepository;
    private final UserRepository userRepository;
    private final SystemAccountService systemAccountService;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public Investor createInvestor(CreateInvestorRequest request) {
        // Enforce role creation rules - Admin creates Investor
        String currentUserEmail = SecurityUtils.getCurrentUserEmail();
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Current user context not found"));

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists: " + request.getEmail());
        }

        // 1. Create User for Investor
        String defaultPassword = "Password@123"; // Standard default password
        User user = User.builder()
                .email(request.getEmail())
                .name(request.getName())
                .passwordHash(passwordEncoder.encode(defaultPassword))
                .role(Role.INVESTOR)
                .tenantId(currentUser.getTenantId())
                .status("ACTIVE")
                .mustChangePassword(true)
                .userId("INV-" + System.currentTimeMillis())
                .staffId("INV-STAFF-" + System.currentTimeMillis())
                .phone(request.getPhone())
                .build();

        User savedUser = userRepository.save(java.util.Objects.requireNonNull(user));

        // 2. Delegate to established create method
        return createInvestor(savedUser.getId(), request.getInitialInvestment(),
                request.getNickname() != null ? request.getNickname() : request.getName());
    }

    @Transactional
    public Investor createInvestor(Long userId, BigDecimal initialInvestment, String nickname) {
        User user = userRepository.findById(java.util.Objects.requireNonNull(userId))
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Generate unique investor code
        String investorCode = generateInvestorCode();

        // Create capital account for this investor
        SystemAccount capitalAccount = systemAccountService.createInvestorCapitalAccount(
                investorCode,
                nickname != null ? nickname : user.getName(),
                userId);

        // If initial investment is provided, add it to the capital account
        if (initialInvestment != null && initialInvestment.compareTo(BigDecimal.ZERO) > 0) {
            systemAccountService.addToBalance(capitalAccount.getId(), initialInvestment);
        }

        // Create investor entity
        Investor investor = Investor.builder()
                .user(user)
                .investorCode(investorCode)
                .nickname(nickname != null ? nickname : user.getName())
                .capitalAccount(capitalAccount)
                .totalInvested(initialInvestment != null ? initialInvestment : BigDecimal.ZERO)
                .totalReturns(BigDecimal.ZERO)
                .status("ACTIVE")
                .isAdmin(false)
                .build();

        return investorRepository.save(java.util.Objects.requireNonNull(investor));
    }

    /**
     * Create the admin investor (owns CORE_CAPITAL)
     */
    @Transactional
    public Investor createAdminInvestor(Long userId) {
        User user = userRepository.findById(java.util.Objects.requireNonNull(userId))
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get the CORE_CAPITAL account
        SystemAccount coreCapitalAccount = systemAccountService.getCoreCapitalAccount();

        // Create admin investor
        Investor adminInvestor = Investor.builder()
                .user(user)
                .investorCode("ADMIN")
                .nickname("Admin Investor")
                .capitalAccount(coreCapitalAccount)
                .totalInvested(BigDecimal.ZERO)
                .totalReturns(BigDecimal.ZERO)
                .status("ACTIVE")
                .isAdmin(true)
                .build();

        return investorRepository.save(java.util.Objects.requireNonNull(adminInvestor));
    }

    /**
     * Generate next investor code (INV001, INV002, etc.)
     */
    private String generateInvestorCode() {
        List<Investor> allInvestors = investorRepository.findAll();

        // Filter out admin investor and get max number
        int maxNumber = allInvestors.stream()
                .filter(inv -> !inv.getIsAdmin() && inv.getInvestorCode().startsWith("INV"))
                .map(inv -> {
                    try {
                        return Integer.parseInt(inv.getInvestorCode().substring(3));
                    } catch (NumberFormatException e) {
                        return 0;
                    }
                })
                .max(Integer::compareTo)
                .orElse(0);

        return String.format("INV%03d", maxNumber + 1);
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

        // Update investor's total invested
        investor.setTotalInvested(investor.getTotalInvested().add(amount));

        // Add to capital account balance
        systemAccountService.addToBalance(investor.getCapitalAccount().getId(), amount);

        investorRepository.save(investor);
    }
}

package com.fintech.finpro.controller;

import com.fintech.finpro.dto.CreateCapitalDepositDTO;
import com.fintech.finpro.dto.PendingTransactionDTO;
import com.fintech.finpro.dto.ProfitSummaryDTO;
import com.fintech.finpro.entity.SystemAccount;
import com.fintech.finpro.service.CapitalDepositService;
import com.fintech.finpro.service.SystemAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.userdetails.UserDetails;
import com.fintech.finpro.entity.User;

@RestController
@RequestMapping("/api/admin/profits")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminProfitController {

    private final SystemAccountService systemAccountService;
    private final CapitalDepositService capitalDepositService;
    private final com.fintech.finpro.repository.UserRepository userRepository;

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<ProfitSummaryDTO> getProfitSummary() {
        SystemAccount profitAccount = systemAccountService.getAccountByCode("ADMIN_PROFIT")
                .orElseThrow(() -> new RuntimeException("Admin Profit account not found"));
        return ResponseEntity.ok(systemAccountService.getProfitSummary(profitAccount.getId()));
    }

    @PostMapping("/withdraw")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<PendingTransactionDTO> withdrawProfits(@RequestBody CreateCapitalDepositDTO dto) {
        SystemAccount profitAccount = systemAccountService.getAccountByCode("ADMIN_PROFIT")
                .orElseThrow(() -> new RuntimeException("Admin Profit account not found"));

        // Force the target account to be the Admin Profit account
        dto.setTargetAccountId(profitAccount.getId());

        // Fetch current user from security context
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth == null)
            throw new RuntimeException("Authentication required");

        UserDetails userDetails = (UserDetails) auth.getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Use the existing capital withdrawal workflow
        return ResponseEntity.ok(capitalDepositService.createCapitalWithdrawal(dto, user.getId()));
    }
}

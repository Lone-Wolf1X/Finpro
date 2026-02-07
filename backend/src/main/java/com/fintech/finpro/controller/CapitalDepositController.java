package com.fintech.finpro.controller;

import com.fintech.finpro.dto.CreateCapitalDepositDTO;
import com.fintech.finpro.dto.PendingTransactionDTO;
import com.fintech.finpro.security.JwtService;
import com.fintech.finpro.service.CapitalDepositService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller for capital deposit operations with maker-checker workflow
 */
@RestController
@RequestMapping("/api/capital-deposits")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CapitalDepositController {

    private final CapitalDepositService capitalDepositService;
    private final JwtService jwtService;

    /**
     * Create capital deposit (MAKER)
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<PendingTransactionDTO> createCapitalDeposit(
            @Valid @RequestBody CreateCapitalDepositDTO dto,
            @RequestHeader("Authorization") String token) {

        Long makerId = jwtService.extractUserId(token.substring(7));
        PendingTransactionDTO created = capitalDepositService.createCapitalDeposit(dto, makerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Create capital withdrawal (MAKER)
     */
    @PostMapping("/withdraw")
    @PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<PendingTransactionDTO> createCapitalWithdrawal(
            @Valid @RequestBody CreateCapitalDepositDTO dto,
            @RequestHeader("Authorization") String token) {

        Long makerId = jwtService.extractUserId(token.substring(7));
        PendingTransactionDTO created = capitalDepositService.createCapitalWithdrawal(dto, makerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Get pending capital deposits (CHECKER/ADMIN)
     */
    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('CHECKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<List<PendingTransactionDTO>> getPendingDeposits() {
        List<PendingTransactionDTO> pending = capitalDepositService.getPendingDeposits();
        return ResponseEntity.ok(pending);
    }

    /**
     * Approve capital deposit (ADMIN/SUPERADMIN)
     */
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<PendingTransactionDTO> approveDeposit(
            @PathVariable Long id,
            @RequestHeader("Authorization") String token) {

        Long checkerId = jwtService.extractUserId(token.substring(7));
        PendingTransactionDTO approved = capitalDepositService.approveDeposit(id, checkerId);
        return ResponseEntity.ok(approved);
    }

    /**
     * Reject capital deposit (CHECKER/ADMIN)
     */
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('CHECKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<PendingTransactionDTO> rejectDeposit(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            @RequestHeader("Authorization") String token) {

        Long checkerId = jwtService.extractUserId(token.substring(7));
        String reason = payload.get("reason");
        PendingTransactionDTO rejected = capitalDepositService.rejectDeposit(id, checkerId, reason);
        return ResponseEntity.ok(rejected);
    }
}

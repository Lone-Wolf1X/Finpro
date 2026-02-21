package com.fintech.finpro.controller;

import com.fintech.finpro.dto.PendingTransactionDTO;
import com.fintech.finpro.security.JwtService;
import com.fintech.finpro.service.TransactionVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TransactionVerificationController {

    private final TransactionVerificationService verificationService;
    private final JwtService jwtService;

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('CHECKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<List<PendingTransactionDTO>> getPendingTransactions() {
        return ResponseEntity.ok(verificationService.getAllPendingTransactions());
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<PendingTransactionDTO>> getTransactionsByCustomerId(@PathVariable Long customerId) {
        return ResponseEntity.ok(verificationService.getTransactionsByCustomerId(customerId));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('CHECKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<PendingTransactionDTO> approveTransaction(
            @PathVariable Long id,
            @RequestHeader("Authorization") String token) {

        Long checkerId = jwtService.extractUserId(token.substring(7));
        PendingTransactionDTO approved = verificationService.approveTransaction(id, checkerId);
        return ResponseEntity.ok(approved);
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('CHECKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<PendingTransactionDTO> rejectTransaction(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            @RequestHeader("Authorization") String token) {

        Long checkerId = jwtService.extractUserId(token.substring(7));
        String reason = payload.get("reason");
        PendingTransactionDTO rejected = verificationService.rejectTransaction(id, checkerId, reason);
        return ResponseEntity.ok(rejected);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Void> deleteTransaction(@PathVariable Long id) {
        verificationService.deletePendingTransaction(id);
        return ResponseEntity.noContent().build();
    }
}

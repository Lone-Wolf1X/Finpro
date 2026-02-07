package com.fintech.finpro.controller;

import com.fintech.finpro.dto.BankAccountCreateDTO;
import com.fintech.finpro.dto.BankAccountDTO;
import com.fintech.finpro.service.BankAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bank-accounts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BankAccountController {

    private final BankAccountService bankAccountService;
    private final com.fintech.finpro.service.SystemAccountService systemAccountService;
    private final com.fintech.finpro.security.JwtService jwtService;

    @PostMapping("/{id}/deposit")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<com.fintech.finpro.dto.PendingTransactionDTO> createDeposit(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload,
            @RequestHeader("Authorization") String token) {

        Long makerId = jwtService.extractUserId(token.substring(7));
        java.math.BigDecimal amount = new java.math.BigDecimal(payload.get("amount").toString());
        String description = (String) payload.get("description");

        com.fintech.finpro.dto.PendingTransactionDTO created = bankAccountService.createDeposit(id, amount, description,
                makerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/{id}/withdraw")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<com.fintech.finpro.dto.PendingTransactionDTO> createWithdrawal(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload,
            @RequestHeader("Authorization") String token) {

        Long makerId = jwtService.extractUserId(token.substring(7));
        java.math.BigDecimal amount = new java.math.BigDecimal(payload.get("amount").toString());
        String description = (String) payload.get("description");

        com.fintech.finpro.dto.PendingTransactionDTO created = bankAccountService.createWithdrawal(id, amount,
                description, makerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}/statement")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<com.fintech.finpro.dto.AccountStatementDTO> getAccountStatement(
            @PathVariable Long id,
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate endDate) {

        return ResponseEntity.ok(bankAccountService.getAccountStatement(id, startDate, endDate));
    }

    @GetMapping("/system-accounts/{id}/statement")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<com.fintech.finpro.dto.AccountStatementDTO> getSystemAccountStatement(
            @PathVariable Long id,
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate endDate) {

        return ResponseEntity.ok(systemAccountService.getSystemAccountStatement(id, startDate, endDate));
    }

    @GetMapping("/{id}/pending")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<com.fintech.finpro.dto.PendingTransactionDTO>> getPendingTransactions(
            @PathVariable Long id) {
        return ResponseEntity.ok(bankAccountService.getPendingTransactions(id));
    }

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<BankAccountDTO> createBankAccount(@Valid @RequestBody BankAccountCreateDTO dto) {
        BankAccountDTO created = bankAccountService.createBankAccount(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<BankAccountDTO> getBankAccountById(@PathVariable Long id) {
        BankAccountDTO account = bankAccountService.getBankAccountById(id);
        return ResponseEntity.ok(account);
    }

    @GetMapping("/customer/{customerId}")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<BankAccountDTO>> getAccountsByCustomerId(@PathVariable Long customerId) {
        List<BankAccountDTO> accounts = bankAccountService.getAccountsByCustomerId(customerId);
        return ResponseEntity.ok(accounts);
    }

    @GetMapping("/customer/{customerId}/active")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<BankAccountDTO>> getActiveAccountsByCustomerId(@PathVariable Long customerId) {
        List<BankAccountDTO> accounts = bankAccountService.getActiveAccountsByCustomerId(customerId);
        return ResponseEntity.ok(accounts);
    }

    @GetMapping("/customer/{customerId}/primary")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<BankAccountDTO> getPrimaryAccount(@PathVariable Long customerId) {
        BankAccountDTO account = bankAccountService.getPrimaryAccount(customerId);
        if (account == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(account);
    }

    @PutMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<BankAccountDTO> updateBankAccount(
            @PathVariable Long id,
            @Valid @RequestBody BankAccountCreateDTO dto) {
        BankAccountDTO updated = bankAccountService.updateBankAccount(id, dto);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/set-primary")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<BankAccountDTO> setPrimaryAccount(@PathVariable Long id) {
        BankAccountDTO updated = bankAccountService.setPrimaryAccount(id);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Map<String, String>> deleteBankAccount(@PathVariable Long id) {
        bankAccountService.deleteBankAccount(id);
        return ResponseEntity.ok(Map.of("message", "Bank account deleted successfully"));
    }

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<List<BankAccountDTO>> getAllBankAccounts() {
        return ResponseEntity.ok(bankAccountService.getAllBankAccounts());
    }
}

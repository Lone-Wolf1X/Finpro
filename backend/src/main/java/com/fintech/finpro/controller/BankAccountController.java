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

    @PostMapping
    public ResponseEntity<BankAccountDTO> createBankAccount(@Valid @RequestBody BankAccountCreateDTO dto) {
        BankAccountDTO created = bankAccountService.createBankAccount(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BankAccountDTO> getBankAccountById(@PathVariable Long id) {
        BankAccountDTO account = bankAccountService.getBankAccountById(id);
        return ResponseEntity.ok(account);
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<BankAccountDTO>> getAccountsByCustomerId(@PathVariable Long customerId) {
        List<BankAccountDTO> accounts = bankAccountService.getAccountsByCustomerId(customerId);
        return ResponseEntity.ok(accounts);
    }

    @GetMapping("/customer/{customerId}/active")
    public ResponseEntity<List<BankAccountDTO>> getActiveAccountsByCustomerId(@PathVariable Long customerId) {
        List<BankAccountDTO> accounts = bankAccountService.getActiveAccountsByCustomerId(customerId);
        return ResponseEntity.ok(accounts);
    }

    @GetMapping("/customer/{customerId}/primary")
    public ResponseEntity<BankAccountDTO> getPrimaryAccount(@PathVariable Long customerId) {
        BankAccountDTO account = bankAccountService.getPrimaryAccount(customerId);
        if (account == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(account);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BankAccountDTO> updateBankAccount(
            @PathVariable Long id,
            @Valid @RequestBody BankAccountCreateDTO dto) {
        BankAccountDTO updated = bankAccountService.updateBankAccount(id, dto);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/set-primary")
    public ResponseEntity<BankAccountDTO> setPrimaryAccount(@PathVariable Long id) {
        BankAccountDTO updated = bankAccountService.setPrimaryAccount(id);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteBankAccount(@PathVariable Long id) {
        bankAccountService.deleteBankAccount(id);
        return ResponseEntity.ok(Map.of("message", "Bank account deleted successfully"));
    }
}

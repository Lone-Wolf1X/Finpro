package com.fintech.finpro.controller;

import com.fintech.finpro.dto.ATBRequest;
import com.fintech.finpro.dto.AccountLienDTO;
import com.fintech.finpro.entity.AccountLien;
import com.fintech.finpro.entity.Customer;
import com.fintech.finpro.entity.CustomerBankAccount;
import com.fintech.finpro.entity.LedgerAccount;
import com.fintech.finpro.enums.LedgerAccountType;
import com.fintech.finpro.enums.LedgerTransactionType;
import com.fintech.finpro.repository.AccountLienRepository;
import com.fintech.finpro.repository.CustomerBankAccountRepository;
import com.fintech.finpro.service.LedgerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bank-module")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BankModuleController {

    private final CustomerBankAccountRepository bankAccountRepository;
    private final AccountLienRepository accountLienRepository;
    private final LedgerService ledgerService;

    /**
     * ABCI - Account Balance Inquiry
     */
    @GetMapping("/abci/{accountNumber}")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getAccountBalance(@PathVariable String accountNumber) {
        return bankAccountRepository.findByAccountNumber(accountNumber)
                .map(acc -> {
                    BigDecimal availableBalance = acc.getBalance().subtract(acc.getHeldBalance());
                    return ResponseEntity.ok(Map.of(
                            "accountNumber", acc.getAccountNumber(),
                            "bankName", acc.getBankName(),
                            "customerName", acc.getCustomer().getFullName(),
                            "totalBalance", acc.getBalance(),
                            "heldBalance", acc.getHeldBalance(),
                            "availableBalance", availableBalance,
                            "accountType", acc.getAccountType(),
                            "status", acc.getStatus()));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * ALM - Account Lien Maintenance (Search)
     */
    @GetMapping("/alm/{bankAccountId}")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AccountLienDTO>> getAccountLiens(@PathVariable Long bankAccountId) {
        List<AccountLien> liens = accountLienRepository.findByBankAccountId(bankAccountId);
        List<AccountLienDTO> dtos = liens.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * ALM - Manual Lien Release
     */
    @PutMapping("/alm/release/{lienId}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<?> releaseLien(@PathVariable Long lienId) {
        return accountLienRepository.findById(lienId)
                .map(lien -> {
                    if ("ACTIVE".equals(lien.getStatus())) {
                        lien.setStatus("RELEASED");
                        accountLienRepository.save(lien);

                        // Update bank account held balance
                        CustomerBankAccount acc = lien.getBankAccount();
                        acc.setHeldBalance(acc.getHeldBalance().subtract(lien.getAmount()));
                        bankAccountRepository.save(acc);

                        return ResponseEntity.ok(Map.of("message", "Lien released successfully"));
                    }
                    return ResponseEntity.badRequest().body(Map.of("message", "Lien is already " + lien.getStatus()));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * ALM - Add New Lien (Hold)
     */
    @PostMapping("/alm/add")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<?> addLien(@RequestBody AccountLienDTO dto) {
        CustomerBankAccount acc = bankAccountRepository.findById(dto.getBankAccountId())
                .orElseThrow(() -> new RuntimeException("Account not found"));

        BigDecimal available = acc.getBalance().subtract(acc.getHeldBalance());
        if (available.compareTo(dto.getAmount()) < 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Insufficient available balance"));
        }

        AccountLien lien = AccountLien.builder()
                .bankAccount(acc)
                .amount(dto.getAmount())
                .purpose(dto.getPurpose())
                .referenceId(dto.getReferenceId())
                .startDate(dto.getStartDate() != null ? dto.getStartDate() : LocalDateTime.now())
                .expiryDate(dto.getExpiryDate())
                .reason(dto.getReason())
                .status("ACTIVE")
                .build();

        AccountLien saved = accountLienRepository.save(lien);

        acc.setHeldBalance(acc.getHeldBalance().add(dto.getAmount()));
        bankAccountRepository.save(acc);

        return ResponseEntity.ok(mapToDTO(saved));
    }

    /**
     * ATB - Account Transaction Bar (Deposit/Withdrawal)
     */
    @PostMapping("/atb/transaction")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<?> recordAtbTransaction(@RequestBody ATBRequest request) {
        CustomerBankAccount acc = bankAccountRepository.findByAccountNumber(request.getAccountNumber())
                .orElseThrow(() -> new RuntimeException("Account not found"));

        LedgerTransactionType type = "DEPOSIT".equalsIgnoreCase(request.getTransactionType())
                ? LedgerTransactionType.DEPOSIT
                : LedgerTransactionType.WITHDRAWAL;

        if (type == LedgerTransactionType.WITHDRAWAL) {
            BigDecimal available = acc.getBalance().subtract(acc.getHeldBalance());
            if (available.compareTo(request.getAmount()) < 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "Insufficient available balance"));
            }
        }

        Customer customer = acc.getCustomer();
        LedgerAccount customerLedger = ledgerService.getOrCreateAccount(
                customer.getFullName() + " - Ledger",
                LedgerAccountType.CUSTOMER_LEDGER,
                customer.getId());

        LedgerAccount officeAcc = ledgerService.getOrCreateAccount(
                "Office Cash Account",
                LedgerAccountType.OFFICE,
                null);

        // For Deposit: Office -> Customer
        // For Withdrawal: Customer -> Office
        if (type == LedgerTransactionType.DEPOSIT) {
            ledgerService.recordTransaction(officeAcc, customerLedger, request.getAmount(),
                    request.getParticulars(), type, null, null, null, acc);
        } else {
            ledgerService.recordTransaction(customerLedger, officeAcc, request.getAmount(),
                    request.getParticulars(), type, null, null, null, acc);
        }

        return ResponseEntity.ok(Map.of("message", "Transaction recorded successfully"));
    }

    private AccountLienDTO mapToDTO(AccountLien lien) {
        return AccountLienDTO.builder()
                .id(lien.getId())
                .bankAccountId(lien.getBankAccount().getId())
                .amount(lien.getAmount())
                .purpose(lien.getPurpose())
                .referenceId(lien.getReferenceId())
                .status(lien.getStatus())
                .startDate(lien.getStartDate())
                .expiryDate(lien.getExpiryDate())
                .reason(lien.getReason())
                .createdAt(lien.getCreatedAt())
                .build();
    }
}

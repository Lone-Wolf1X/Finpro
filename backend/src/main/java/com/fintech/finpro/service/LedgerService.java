package com.fintech.finpro.service;

import com.fintech.finpro.entity.LedgerAccount;
import com.fintech.finpro.entity.LedgerTransaction;
import com.fintech.finpro.enums.LedgerAccountType;
import com.fintech.finpro.enums.LedgerTransactionType;
import com.fintech.finpro.repository.LedgerAccountRepository;
import com.fintech.finpro.repository.LedgerTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class LedgerService {

    private final LedgerAccountRepository accountRepository;
    private final LedgerTransactionRepository transactionRepository;

    /**
     * Create or get a ledger account
     */
    @Transactional
    public LedgerAccount getOrCreateAccount(String name, LedgerAccountType type, Long ownerId) {
        return accountRepository.findByAccountTypeAndOwnerId(type, ownerId)
                .orElseGet(() -> accountRepository.save(java.util.Objects.requireNonNull(LedgerAccount.builder()
                        .accountName(name)
                        .accountType(type)
                        .ownerId(ownerId)
                        .balance(BigDecimal.ZERO)
                        .status("ACTIVE")
                        .build())));
    }

    /**
     * Record a dual-entry transaction
     */
    @Transactional
    public LedgerTransaction recordTransaction(
            LedgerAccount debitAcc,
            LedgerAccount creditAcc,
            BigDecimal amount,
            String particulars,
            LedgerTransactionType type,
            String referenceId,
            Long makerId) {

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Transaction amount must be positive");
        }

        // Update balances
        debitAcc.setBalance(debitAcc.getBalance().subtract(amount));
        creditAcc.setBalance(creditAcc.getBalance().add(amount));

        accountRepository.save(debitAcc);
        accountRepository.save(creditAcc);

        // Record transaction
        LedgerTransaction transaction = LedgerTransaction.builder()
                .debitAccount(debitAcc)
                .creditAccount(creditAcc)
                .amount(amount)
                .particulars(particulars)
                .transactionType(type)
                .referenceId(referenceId)
                .makerId(makerId)
                .status("COMPLETED")
                .build();

        // Assign Transaction ID
        transaction.setReferenceId(generateTransactionId());

        return transactionRepository.save(java.util.Objects.requireNonNull(transaction));
    }

    private synchronized String generateTransactionId() {
        String year = String.valueOf(java.time.Year.now().getValue());
        Long seq = transactionRepository.getNextTransactionSequence();
        return "TXN-" + year + "-" + String.format("%08d", seq);
    }

    /**
     * Initialize System Accounts
     */
    @Transactional
    public void initializeSystemAccounts() {
        createSystemAccount("Office Cash", LedgerAccountType.OFFICE);
        createSystemAccount("Core Capital", LedgerAccountType.CORE_CAPITAL);
        createSystemAccount("Subscription Fees", LedgerAccountType.FEE_INCOME);
        createSystemAccount("Demat Fees", LedgerAccountType.FEE_INCOME);
        createSystemAccount("CASBA Charges", LedgerAccountType.FEE_INCOME);
        createSystemAccount("Tax Payable (CGT)", LedgerAccountType.TAX_PAYABLE);
        createSystemAccount("Broker Commission Payable", LedgerAccountType.TAX_PAYABLE);
    }

    private void createSystemAccount(String name, LedgerAccountType type) {
        if (accountRepository.findByAccountName(name).isEmpty()) {
            accountRepository.save(java.util.Objects.requireNonNull(LedgerAccount.builder()
                    .accountName(name)
                    .accountType(type)
                    .balance(java.math.BigDecimal.ZERO)
                    .status("ACTIVE")
                    .build()));
        }
    }

    /**
     * Get all system accounts (non-customer accounts)
     */
    @Transactional(readOnly = true)
    public java.util.List<LedgerAccount> getAllSystemAccounts() {
        return accountRepository.findAll().stream()
                .filter(acc -> acc.getAccountType() != LedgerAccountType.CUSTOMER_LEDGER
                        && acc.getAccountType() != LedgerAccountType.INVESTOR_LEDGER)
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * Create a new internal system account
     */
    @Transactional
    public LedgerAccount createInternalAccount(String name, LedgerAccountType type) {
        if (type == LedgerAccountType.CUSTOMER_LEDGER || type == LedgerAccountType.INVESTOR_LEDGER) {
            throw new RuntimeException("Cannot create customer/investor ledgers as system accounts");
        }

        if (accountRepository.findByAccountName(name).isPresent()) {
            throw new RuntimeException("Account with name " + name + " already exists");
        }

        return accountRepository.save(java.util.Objects.requireNonNull(LedgerAccount.builder()
                .accountName(name)
                .accountType(type)
                .balance(java.math.BigDecimal.ZERO)
                .status("ACTIVE")
                .build()));
    }
}

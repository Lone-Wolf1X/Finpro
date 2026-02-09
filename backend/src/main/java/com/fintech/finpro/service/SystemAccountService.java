package com.fintech.finpro.service;

import com.fintech.finpro.entity.SystemAccount;
import com.fintech.finpro.repository.SystemAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemAccountService {

    private final SystemAccountRepository systemAccountRepository;
    private final com.fintech.finpro.repository.LedgerTransactionRepository ledgerTransactionRepository;
    private final com.fintech.finpro.repository.LedgerAccountRepository ledgerAccountRepository;
    private final LedgerService ledgerService;

    /**
     * Initialize core system accounts if they don't exist
     */
    @Transactional
    public void initializeCoreAccounts() {
        log.info("Checking and initializing core system accounts...");

        // Create CORE_CAPITAL account
        if (systemAccountRepository.findByAccountCode("CORE_CAPITAL").isEmpty()) {
            SystemAccount coreCapital = SystemAccount.builder()
                    .accountNumber("100002026001")
                    .accountCode("CORE_CAPITAL")
                    .accountName("Core Capital Account")
                    .balance(BigDecimal.ZERO)
                    .isSystemAccount(true)
                    .build();
            systemAccountRepository.save(coreCapital);
            log.info("Created CORE_CAPITAL account");
        }

        // Create EXPENSES_POOL account
        if (systemAccountRepository.findByAccountCode("EXPENSES_POOL").isEmpty()) {
            SystemAccount expensesPool = SystemAccount.builder()
                    .accountNumber("100002026002")
                    .accountCode("EXPENSES_POOL")
                    .accountName("Expenses Pool Account")
                    .balance(BigDecimal.ZERO)
                    .isSystemAccount(true)
                    .build();
            systemAccountRepository.save(expensesPool);
            log.info("Created EXPENSES_POOL account");
        }

        // Create SUBSCRIPTION_POOL account
        if (systemAccountRepository.findByAccountCode("SUBSCRIPTION_POOL").isEmpty()) {
            SystemAccount subscriptionPool = SystemAccount.builder()
                    .accountNumber("100002026003")
                    .accountCode("SUBSCRIPTION_POOL")
                    .accountName("Subscription Pool Account")
                    .balance(BigDecimal.ZERO)
                    .isSystemAccount(true)
                    .build();
            systemAccountRepository.save(subscriptionPool);
            log.info("Created SUBSCRIPTION_POOL account");
        }

        log.info("Core system accounts initialization complete");
    }

    /**
     * Create a capital account for an investor
     */
    @Transactional
    public SystemAccount createInvestorCapitalAccount(String investorCode, String investorName, Long userId) {
        String accountNumber = generateNextAccountNumber();
        String accountCode = "CAPITAL_" + investorCode;
        String accountName = investorName + " - Capital Account";

        SystemAccount capitalAccount = SystemAccount.builder()
                .accountNumber(accountNumber)
                .accountCode(accountCode)
                .accountName(accountName)
                .balance(BigDecimal.ZERO)
                .isSystemAccount(false)
                .ownerId(userId)
                .build();

        SystemAccount saved = systemAccountRepository.save(capitalAccount);
        log.info("Created capital account {} for investor {}", accountNumber, investorCode);
        return saved;
    }

    /**
     * Generate next account number
     */
    private String generateNextAccountNumber() {
        Optional<SystemAccount> lastAccount = systemAccountRepository.findLastAccountNumber();

        if (lastAccount.isPresent()) {
            String lastNumber = lastAccount.get().getAccountNumber();
            long nextNumber = Long.parseLong(lastNumber) + 1;
            return String.valueOf(nextNumber);
        } else {
            // Start from 100002026004 (after the 3 core accounts)
            return "100002026004";
        }
    }

    /**
     * Get CORE_CAPITAL account
     */
    public SystemAccount getCoreCapitalAccount() {
        return systemAccountRepository.findCoreCapitalAccount()
                .orElseThrow(() -> new RuntimeException(
                        "CORE_CAPITAL account not found. Please initialize system accounts."));
    }

    /**
     * Get EXPENSES_POOL account
     */
    public SystemAccount getExpensesPoolAccount() {
        return systemAccountRepository.findExpensesPoolAccount()
                .orElseThrow(() -> new RuntimeException(
                        "EXPENSES_POOL account not found. Please initialize system accounts."));
    }

    /**
     * Get SUBSCRIPTION_POOL account
     */
    public SystemAccount getSubscriptionPoolAccount() {
        return systemAccountRepository.findSubscriptionPoolAccount()
                .orElseThrow(() -> new RuntimeException(
                        "SUBSCRIPTION_POOL account not found. Please initialize system accounts."));
    }

    /**
     * Get all system accounts
     */
    public List<SystemAccount> getAllSystemAccounts() {
        return systemAccountRepository.findByIsSystemAccountTrue();
    }

    /**
     * Get account by ID
     */
    public SystemAccount getAccountById(Long id) {
        return systemAccountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("System account not found with id: " + id));
    }

    /**
     * Get account by account code
     */
    public Optional<SystemAccount> getAccountByCode(String accountCode) {
        return systemAccountRepository.findByAccountCode(accountCode);
    }

    /**
     * Update account balance
     */
    @Transactional
    public void updateBalance(Long accountId, BigDecimal newBalance) {
        SystemAccount account = getAccountById(accountId);
        account.setBalance(newBalance);
        systemAccountRepository.save(account);
        log.info("Updated balance for account {} to {}", account.getAccountNumber(), newBalance);
    }

    /**
     * Add to account balance
     */
    @Transactional
    public void addToBalance(Long accountId, BigDecimal amount) {
        SystemAccount account = getAccountById(accountId);
        account.setBalance(account.getBalance().add(amount));
        systemAccountRepository.save(account);
        log.info("Added {} to account {}. New balance: {}", amount, account.getAccountNumber(), account.getBalance());
    }

    /**
     * Subtract from account balance
     */
    @Transactional
    public void subtractFromBalance(Long accountId, BigDecimal amount) {
        SystemAccount account = getAccountById(accountId);
        BigDecimal newBalance = account.getBalance().subtract(amount);

        if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Insufficient balance in account " + account.getAccountNumber());
        }

        account.setBalance(newBalance);
        systemAccountRepository.save(account);
        log.info("Subtracted {} from account {}. New balance: {}", amount, account.getAccountNumber(),
                account.getBalance());
    }

    /**
     * Get system account statement
     */
    @Transactional(readOnly = true)
    public com.fintech.finpro.dto.AccountStatementDTO getSystemAccountStatement(
            Long accountId,
            java.time.LocalDate startDate,
            java.time.LocalDate endDate) {

        SystemAccount account = getAccountById(accountId);
        java.time.LocalDateTime startDateTime = startDate.atStartOfDay();
        java.time.LocalDateTime endDateTime = endDate.atTime(23, 59, 59);

        // Find corresponding Ledger Account (Safely)
        com.fintech.finpro.entity.LedgerAccount ledgerAccount;
        if (account.getOwnerId() != null) {
            // Investor Capital - try to find by specific logic or name
            // For now, rely on name matching which is consistent with creation logic
            ledgerAccount = ledgerAccountRepository.findByAccountName(account.getAccountName())
                    .orElseThrow(() -> new RuntimeException(
                            "Ledger account not found for system account: " + account.getAccountName()));
        } else {
            // Core System Account
            // Ledger accounts for core system accounts are created with specific names in
            // LedgerService
            // E.g. SystemAccount "Core Capital Account" -> LedgerAccount "Core Capital"?
            // We need to handle this mapping or ensure names match.
            // Current LedgerService creates "Core Capital", "Office Cash", etc.
            // SystemAccountService creates "Core Capital Account".
            // Let's try to match by exact name first, then strict mapping if needed.
            // Based on previous analysis, createCapitalDepositEntry uses
            // targetAccount.getAccountName()
            // So the Ledger Account SHOULD have the same name as System Account if deposits
            // were made.

            Optional<com.fintech.finpro.entity.LedgerAccount> ledgerOpt = ledgerAccountRepository
                    .findByAccountName(account.getAccountName());
            if (ledgerOpt.isEmpty()) {
                // Fallback: Dictionary mapping for known core accounts if names differ slightly
                // But ideally we should have ensured they match.
                // For now, if not found, we cannot generate a valid ledger statement.
                // But to avoid blocking completely in case of mismatch, we might try the "Core
                // Capital" vs "Core Capital Account" mapping.
                if (account.getAccountCode().equals("CORE_CAPITAL")) {
                    ledgerAccount = ledgerAccountRepository.findByAccountName("Core Capital")
                            .orElseThrow(() -> new RuntimeException("Ledger account 'Core Capital' not found"));
                } else if (account.getAccountCode().equals("EXPENSES_POOL")) {
                    ledgerAccount = ledgerAccountRepository.findByAccountName("Office Expenses") // Mapping Assumption
                            .orElseThrow(() -> new RuntimeException("Ledger account 'Office Expenses' not found"));
                } else {
                    throw new RuntimeException(
                            "Ledger account not found for system account: " + account.getAccountName());
                }
            } else {
                ledgerAccount = ledgerOpt.get();
            }
        }

        // 1. Get Opening Balance
        BigDecimal openingBalance = ledgerTransactionRepository.getLedgerOpeningBalance(ledgerAccount.getId(),
                startDateTime);

        // 2. Fetch Transactions
        List<com.fintech.finpro.entity.LedgerTransaction> transactions = ledgerTransactionRepository
                .findByLedgerAccountAndDateRange(ledgerAccount.getId(), startDateTime, endDateTime);

        // 3. Sort by Date ASC for calculation
        transactions.sort(java.util.Comparator.comparing(com.fintech.finpro.entity.LedgerTransaction::getCreatedAt));

        List<com.fintech.finpro.dto.BankTransactionDTO> transactionDTOs = new java.util.ArrayList<>();
        BigDecimal runningBalance = openingBalance;

        for (com.fintech.finpro.entity.LedgerTransaction t : transactions) {
            BigDecimal amount = t.getAmount();

            // Ledger Logic:
            // If this account is Credit -> Add
            // If this account is Debit -> Subtract
            if (t.getCreditAccount().getId().equals(ledgerAccount.getId())) {
                runningBalance = runningBalance.add(amount);
            } else if (t.getDebitAccount().getId().equals(ledgerAccount.getId())) {
                runningBalance = runningBalance.subtract(amount);
            }

            transactionDTOs.add(com.fintech.finpro.dto.BankTransactionDTO.builder()
                    .id(t.getId())
                    .date(t.getCreatedAt())
                    .type(t.getTransactionType().name())
                    .amount(t.getAmount())
                    .balanceAfter(runningBalance)
                    .description(t.getParticulars())
                    .referenceId(t.getReferenceId())
                    .status(t.getStatus())
                    .build());
        }

        // 4. Reverse to DESC for display
        java.util.Collections.reverse(transactionDTOs);

        return com.fintech.finpro.dto.AccountStatementDTO.builder()
                .accountId(accountId)
                .accountNumber(account.getAccountNumber())
                .bankName("System Account")
                .customerName(account.getAccountName())
                .currentBalance(account.getBalance()) // System Account Balance (Should match runningBalance if up to
                                                      // date)
                .transactions(transactionDTOs)
                .build();
    }
}

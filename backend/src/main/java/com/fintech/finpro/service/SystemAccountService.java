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

        // Find corresponding Ledger Account
        com.fintech.finpro.entity.LedgerAccount ledgerAccount;
        if (account.getOwnerId() != null) {
            // Investor Capital
            ledgerAccount = ledgerService.getOrCreateAccount(
                    account.getAccountName(),
                    com.fintech.finpro.enums.LedgerAccountType.CORE_CAPITAL,
                    account.getOwnerId());
        } else {
            // Core System Account (use simplified lookup or create if missing)
            ledgerAccount = ledgerService.getOrCreateAccount(
                    account.getAccountName(),
                    com.fintech.finpro.enums.LedgerAccountType.CORE_CAPITAL,
                    null);
        }

        List<com.fintech.finpro.entity.LedgerTransaction> transactions = ledgerTransactionRepository
                .findByAccountAndDateRange(ledgerAccount.getId(), startDateTime, endDateTime);

        List<com.fintech.finpro.dto.BankTransactionDTO> transactionDTOs = transactions.stream()
                .map(t -> com.fintech.finpro.dto.BankTransactionDTO.builder()
                        .id(t.getId())
                        .date(t.getCreatedAt())
                        .type(t.getTransactionType().name())
                        .amount(t.getAmount())
                        .description(t.getParticulars())
                        .referenceId(t.getReferenceId())
                        .status(t.getStatus())
                        .build())
                .collect(java.util.stream.Collectors.toList());

        return com.fintech.finpro.dto.AccountStatementDTO.builder()
                .accountId(accountId)
                .accountNumber(account.getAccountNumber())
                .bankName("System Account")
                .customerName(account.getAccountName())
                .currentBalance(account.getBalance())
                .transactions(transactionDTOs)
                .build();
    }
}

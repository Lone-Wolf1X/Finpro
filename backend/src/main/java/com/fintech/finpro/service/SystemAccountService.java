package com.fintech.finpro.service;

import com.fintech.finpro.entity.SystemAccount;
import com.fintech.finpro.enums.LedgerAccountType;
import com.fintech.finpro.repository.SystemAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SystemAccountService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(SystemAccountService.class);

    private final SystemAccountRepository systemAccountRepository;
    private final com.fintech.finpro.repository.LedgerTransactionRepository ledgerTransactionRepository;
    private final com.fintech.finpro.repository.LedgerAccountRepository ledgerAccountRepository;
    private final com.fintech.finpro.service.LedgerService ledgerService;

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

        // Create ADMIN_PROFIT account
        if (systemAccountRepository.findByAccountCode("ADMIN_PROFIT").isEmpty()) {
            SystemAccount adminProfit = SystemAccount.builder()
                    .accountNumber("100002026004")
                    .accountCode("ADMIN_PROFIT")
                    .accountName("Admin Profit Account")
                    .balance(BigDecimal.ZERO)
                    .isSystemAccount(true)
                    .build();
            systemAccountRepository.save(adminProfit);
            log.info("Created ADMIN_PROFIT account");
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
        SystemAccount account = systemAccountRepository.findCoreCapitalAccount()
                .orElseThrow(() -> new RuntimeException(
                        "CORE_CAPITAL account not found. Please initialize system accounts."));
        syncBalanceFromLedger(account);
        return account;
    }

    /**
     * Get EXPENSES_POOL account
     */
    public SystemAccount getExpensesPoolAccount() {
        SystemAccount account = systemAccountRepository.findExpensesPoolAccount()
                .orElseThrow(() -> new RuntimeException(
                        "EXPENSES_POOL account not found. Please initialize system accounts."));
        syncBalanceFromLedger(account);
        return account;
    }

    /**
     * Get SUBSCRIPTION_POOL account
     */
    public SystemAccount getSubscriptionPoolAccount() {
        SystemAccount account = systemAccountRepository.findSubscriptionPoolAccount()
                .orElseThrow(() -> new RuntimeException(
                        "SUBSCRIPTION_POOL account not found. Please initialize system accounts."));
        syncBalanceFromLedger(account);
        return account;
    }

    /**
     * Get all system accounts
     */
    public List<SystemAccount> getAllSystemAccounts() {
        List<SystemAccount> accounts = systemAccountRepository.findByIsSystemAccountTrue();
        accounts.forEach(this::syncBalanceFromLedger);
        return accounts;
    }

    /**
     * Get account by ID
     */
    public SystemAccount getAccountById(Long id) {
        SystemAccount account = systemAccountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("System account not found with id: " + id));
        syncBalanceFromLedger(account);
        return account;
    }

    /**
     * Get account by ID with fallback for Ledger Account ID
     */
    @Transactional
    public SystemAccount getAccountByIdOrLedgerId(Long id) {
        return systemAccountRepository.findById(id)
                .map(account -> {
                    syncBalanceFromLedger(account);
                    return account;
                })
                .orElseGet(() -> getAccountByLedgerId(id));
    }

    /**
     * Get account by Ledger Account ID (Fallback for frontend ID mismatch)
     */
    @Transactional
    public SystemAccount getAccountByLedgerId(Long ledgerId) {
        com.fintech.finpro.entity.LedgerAccount ledgerAccount = ledgerAccountRepository.findById(ledgerId)
                .orElseThrow(() -> new RuntimeException("Ledger account not found with id: " + ledgerId));

        // Try to find SystemAccount by name (since names are synced)
        return systemAccountRepository.findByAccountName(ledgerAccount.getAccountName())
                .map(account -> {
                    syncBalanceFromLedger(account);
                    return account;
                })
                .orElseGet(() -> {
                    log.info("Creating SystemAccount mapping for LedgerAccount: {}", ledgerAccount.getAccountName());
                    SystemAccount newAccount = SystemAccount.builder()
                            .accountNumber("S-" + ledgerAccount.getId()) // Use a pseudo-number
                            .accountCode(ledgerAccount.getAccountName().toUpperCase().replace(" ", "_"))
                            .accountName(ledgerAccount.getAccountName())
                            .balance(ledgerAccount.getBalance())
                            .isSystemAccount(true)
                            .build();
                    return systemAccountRepository.save(newAccount);
                });
    }

    /**
     * Get account by account code
     */
    public Optional<SystemAccount> getAccountByCode(String accountCode) {
        Optional<SystemAccount> accountOpt = systemAccountRepository.findByAccountCode(accountCode);
        accountOpt.ifPresent(this::syncBalanceFromLedger);
        return accountOpt;
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

        // Note: System accounts might go negative depending on logic, but keeping check
        // for now
        // or we can remove it if overdraft is allowed for internal accounts.
        // For now, keeping as is.

        if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
            // throw new RuntimeException("Insufficient balance in account " +
            // account.getAccountNumber());
            // Allow negative balance for system accounts for now to reflect actual ledger
            // position
            log.warn("Account {} going negative: {}", account.getAccountNumber(), newBalance);
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

        SystemAccount account = getAccountById(accountId); // This now syncs balance
        java.time.LocalDateTime startDateTime = startDate.atStartOfDay();
        java.time.LocalDateTime endDateTime = endDate.atTime(23, 59, 59);

        // Find corresponding Ledger Account (Safely)
        com.fintech.finpro.entity.LedgerAccount ledgerAccount = getLedgerAccountForSystemAccount(account);

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
                .currentBalance(account.getBalance()) // Now synced
                .transactions(transactionDTOs)
                .build();
    }

    /**
     * Helper to find the LedgerAccount for a SystemAccount
     */
    private com.fintech.finpro.entity.LedgerAccount getLedgerAccountForSystemAccount(SystemAccount account) {
        if (account.getOwnerId() != null) {
            // Investor Capital
            return ledgerAccountRepository.findByAccountName(account.getAccountName())
                    .orElseThrow(() -> new RuntimeException(
                            "Ledger account not found for system account: " + account.getAccountName()));
        } else {
            // Core System Account
            if ("CORE_CAPITAL".equals(account.getAccountCode())) {
                return ledgerAccountRepository.findByAccountName("Core Capital Account")
                        .orElseThrow(() -> new RuntimeException("Ledger account 'Core Capital Account' not found"));
            } else if ("EXPENSES_POOL".equals(account.getAccountCode())) {
                return ledgerAccountRepository.findByAccountName("Office Expenses")
                        .orElseThrow(() -> new RuntimeException("Ledger account 'Office Expenses' not found"));
            } else if ("SUBSCRIPTION_POOL".equals(account.getAccountCode())) {
                return ledgerAccountRepository.findByAccountName("Subscription Fees")
                        .orElseThrow(() -> new RuntimeException("Ledger account 'Subscription Fees' not found"));
            } else if ("ADMIN_PROFIT".equals(account.getAccountCode())) {
                return ledgerService.getOrCreateAccount("Admin Profits", LedgerAccountType.PROFIT_ACCOUNT, null);
            } else {
                return ledgerAccountRepository.findByAccountName(account.getAccountName())
                        .orElseThrow(() -> new RuntimeException(
                                "Ledger account not found for system account: " + account.getAccountName()));
            }
        }
    }

    /**
     * Helper to sync SystemAccount balance from LedgerAccount
     */
    private void syncBalanceFromLedger(SystemAccount account) {
        try {
            com.fintech.finpro.entity.LedgerAccount ledgerAccount = getLedgerAccountForSystemAccount(account);
            if (account.getBalance().compareTo(ledgerAccount.getBalance()) != 0) {
                log.info("Syncing SystemAccount {} balance from {} to {}", account.getAccountName(),
                        account.getBalance(), ledgerAccount.getBalance());
                account.setBalance(ledgerAccount.getBalance());
                systemAccountRepository.save(account);
            }
        } catch (Exception e) {
            log.warn("Failed to sync balance for account {}: {}", account.getAccountName(), e.getMessage());
        }
    }

    public com.fintech.finpro.dto.ProfitSummaryDTO getProfitSummary(Long systemAccountId) {
        SystemAccount account = getAccountById(systemAccountId);
        com.fintech.finpro.entity.LedgerAccount ledgerAccount = getLedgerAccountForSystemAccount(account);

        java.math.BigDecimal totalEarned = ledgerTransactionRepository.getTotalCredits(ledgerAccount.getId());
        java.math.BigDecimal totalWithdrawn = ledgerTransactionRepository.getTotalDebits(ledgerAccount.getId());

        return com.fintech.finpro.dto.ProfitSummaryDTO.builder()
                .accountId(account.getId())
                .accountName(account.getAccountName())
                .currentBalance(account.getBalance())
                .totalEarned(totalEarned)
                .totalWithdrawn(totalWithdrawn)
                .build();
    }
}

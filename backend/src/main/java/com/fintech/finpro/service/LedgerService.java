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
                // For system accounts (no ownerId), primary lookup should be by name to avoid
                // duplicates
                if (ownerId == null) {
                        return accountRepository.findByAccountName(name)
                                        .orElseGet(() -> accountRepository.save(LedgerAccount.builder()
                                                        .accountName(name)
                                                        .accountType(type)
                                                        .balance(BigDecimal.ZERO)
                                                        .status("ACTIVE")
                                                        .build()));
                }

                return accountRepository.findByAccountTypeAndOwnerId(type, ownerId)
                                .orElseGet(() -> accountRepository
                                                .save(java.util.Objects.requireNonNull(LedgerAccount.builder()
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
                        Long makerId,
                        String remarks, // New parameter
                        com.fintech.finpro.entity.CustomerBankAccount bankAccount) {

                if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                        throw new RuntimeException("Transaction amount must be positive");
                }

                // Update balances
                debitAcc.setBalance(debitAcc.getBalance().subtract(amount));
                creditAcc.setBalance(creditAcc.getBalance().add(amount));

                BigDecimal debitBalanceAfter = debitAcc.getBalance();
                BigDecimal creditBalanceAfter = creditAcc.getBalance();

                accountRepository.save(debitAcc);
                accountRepository.save(creditAcc);

                // Update customer bank account balance if provided
                if (bankAccount != null) {
                        // Ledger Service is the sole authority for updating Bank Account actual
                        // balances
                        // during a dual-entry transaction.
                        if (type == LedgerTransactionType.DEPOSIT || type == LedgerTransactionType.REVERSAL
                                        || type == LedgerTransactionType.SETTLEMENT) {
                                bankAccount.setBalance(bankAccount.getBalance().add(amount));
                        } else if (type == LedgerTransactionType.WITHDRAWAL || type == LedgerTransactionType.FEE
                                        || type == LedgerTransactionType.TRANSFER) {
                                bankAccount.setBalance(bankAccount.getBalance().subtract(amount));
                        } else if (type == LedgerTransactionType.ALLOTMENT) {
                                // For Allotment (Settlement), we only subtract from actual balance.
                                // Held balance unblocking is now handled explicitly in the service layer
                                // before calling this settlement transaction.
                                bankAccount.setBalance(bankAccount.getBalance().subtract(amount));
                        } else if (type == LedgerTransactionType.REFUND) {
                                // For Refund (Unblocking), we only decrease the held balance
                                bankAccount.setHeldBalance(bankAccount.getHeldBalance().subtract(amount));
                        }
                }

                if (referenceId != null && !referenceId.isEmpty()) {
                        String existingRemarks = remarks != null ? remarks : "";
                        remarks = existingRemarks + (existingRemarks.isEmpty() ? "" : " | ") + "Ref: " + referenceId;
                }

                // Record transaction
                LedgerTransaction transaction = LedgerTransaction.builder()
                                .debitAccount(debitAcc)
                                .creditAccount(creditAcc)
                                .debitBalanceAfter(debitBalanceAfter)
                                .creditBalanceAfter(creditBalanceAfter)
                                .amount(amount)
                                .particulars(particulars)
                                .transactionType(type)
                                .referenceId(referenceId)
                                .makerId(makerId)
                                .status("COMPLETED")
                                .customerBankAccount(bankAccount)
                                .remarks(remarks) // Added remarks with preserved referenceId
                                .build();

                // Assign Transaction ID
                transaction.setReferenceId(generateTransactionId());

                return transactionRepository.save(java.util.Objects.requireNonNull(transaction));
        }

        /**
         * Backward compatibility or for transactions not linked to a specific bank
         * account
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
                return recordTransaction(debitAcc, creditAcc, amount, particulars, type, referenceId, makerId, null,
                                null);
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
                createSystemAccount("Core Capital Account", LedgerAccountType.CORE_CAPITAL);
                createSystemAccount("Invested Account", LedgerAccountType.INVESTED_ACCOUNT);
                createSystemAccount("Subscription Fee Income", LedgerAccountType.FEE_INCOME);
                createSystemAccount("Demat AMC Payable", LedgerAccountType.TAX_PAYABLE);
                createSystemAccount("CASBA Charges", LedgerAccountType.FEE_INCOME);
                createSystemAccount("Tax Payable (CGT)", LedgerAccountType.TAX_PAYABLE);
                createSystemAccount("Broker Commission Payable", LedgerAccountType.TAX_PAYABLE);
                createSystemAccount("Office Expenses", LedgerAccountType.EXPENSE);
                createSystemAccount("Share Settlement Account", LedgerAccountType.SUSPENSE);
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

        /**
         * Create ledger entry for capital deposit
         */
        @Transactional
        public LedgerTransaction createCapitalDepositEntry(
                        com.fintech.finpro.entity.SystemAccount targetAccount,
                        BigDecimal amount,
                        String description,
                        Long checkerId) {

                // Get or create ledger accounts
                LedgerAccount cashAccount = getOrCreateAccount("Office Cash", LedgerAccountType.OFFICE, null);
                LedgerAccount capitalAccount = getOrCreateAccount(
                                targetAccount.getAccountName(),
                                mapSystemCodeToLedgerType(targetAccount.getAccountCode()),
                                targetAccount.getOwnerId());

                // Record transaction: Debit Cash, Credit Capital
                return recordTransaction(
                                cashAccount,
                                capitalAccount,
                                amount,
                                description != null ? description : "Capital deposit",
                                LedgerTransactionType.DEPOSIT,
                                null,
                                checkerId,
                                null,
                                null);
        }

        /**
         * Create ledger entry for capital withdrawal
         */
        @Transactional
        public LedgerTransaction createCapitalWithdrawalEntry(
                        com.fintech.finpro.entity.SystemAccount targetAccount,
                        BigDecimal amount,
                        String description,
                        Long checkerId) {

                // Get or create ledger accounts
                LedgerAccount cashAccount = getOrCreateAccount("Office Cash", LedgerAccountType.OFFICE, null);
                LedgerAccount capitalAccount = getOrCreateAccount(
                                targetAccount.getAccountName(),
                                mapSystemCodeToLedgerType(targetAccount.getAccountCode()),
                                targetAccount.getOwnerId());

                // Record transaction: Debit Capital, Credit Cash
                return recordTransaction(
                                capitalAccount,
                                cashAccount,
                                amount,
                                description != null ? description : "Capital withdrawal",
                                LedgerTransactionType.WITHDRAWAL,
                                null,
                                checkerId,
                                null,
                                null);
        }

        @Transactional(readOnly = true)
        public LedgerAccount getAccountById(Long id) {
                return accountRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Ledger account not found with ID: " + id));
        }

        /**
         * Get statement for a ledger account
         */
        @Transactional(readOnly = true)
        public com.fintech.finpro.dto.AccountStatementDTO getAccountStatement(
                        Long accountId,
                        java.time.LocalDate startDate,
                        java.time.LocalDate endDate) {

                LedgerAccount account = accountRepository.findById(java.util.Objects.requireNonNull(accountId))
                                .orElseThrow(() -> new RuntimeException("Ledger account not found"));

                java.time.LocalDateTime startDateTime = startDate.atStartOfDay();
                java.time.LocalDateTime endDateTime = endDate.atTime(23, 59, 59);

                // 2. Fetch Transactions
                java.util.List<com.fintech.finpro.entity.LedgerTransaction> transactions = transactionRepository
                                .findByLedgerAccountAndDateRange(account.getId(), startDateTime, endDateTime);

                // 3. Sort by Date ASC for calculation
                java.util.List<com.fintech.finpro.dto.BankTransactionDTO> transactionDTOs = new java.util.ArrayList<>();
                for (LedgerTransaction t : transactions) {
                        BigDecimal balanceAfter = null;
                        if (t.getDebitAccount() != null && t.getDebitAccount().getId().equals(accountId)) {
                                balanceAfter = t.getDebitBalanceAfter();
                        } else if (t.getCreditAccount() != null && t.getCreditAccount().getId().equals(accountId)) {
                                balanceAfter = t.getCreditBalanceAfter();
                        }

                        transactionDTOs.add(com.fintech.finpro.dto.BankTransactionDTO.builder()
                                        .id(t.getId())
                                        .date(t.getCreatedAt())
                                        .type(t.getTransactionType() != null ? t.getTransactionType().name()
                                                        : "UNKNOWN")
                                        .amount(t.getAmount()) // Consider if we want Debit/Credit columns
                                        .description(t.getParticulars())
                                        .referenceId(t.getReferenceId())
                                        .status(t.getStatus())
                                        .balanceAfter(balanceAfter) // Added field
                                        .build());
                }

                return com.fintech.finpro.dto.AccountStatementDTO.builder()
                                .accountId(accountId)
                                .accountNumber(account.getId().toString()) // Ledger accounts don't have separate
                                                                           // account numbers
                                .bankName("Ledger Account")
                                .customerName(account.getAccountName())
                                .currentBalance(account.getBalance())
                                .transactions(transactionDTOs)
                                .build();
        }

        private LedgerAccountType mapSystemCodeToLedgerType(String accountCode) {
                if (accountCode == null)
                        return LedgerAccountType.SUSPENSE;
                if (accountCode.startsWith("CAPITAL_"))
                        return LedgerAccountType.INVESTOR_LEDGER;
                return LedgerAccountType.SUSPENSE;
        }

        @Transactional
        public void deleteTransactionsByReferenceIdPrefix(String prefix) {
                transactionRepository.deleteByReferenceIdStartingWith(prefix);
        }
}

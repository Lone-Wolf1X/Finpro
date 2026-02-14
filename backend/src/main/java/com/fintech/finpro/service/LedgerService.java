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
                        com.fintech.finpro.entity.CustomerBankAccount bankAccount) {

                if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                        throw new RuntimeException("Transaction amount must be positive");
                }

                // Update balances
                debitAcc.setBalance(debitAcc.getBalance().subtract(amount));
                creditAcc.setBalance(creditAcc.getBalance().add(amount));

                accountRepository.save(debitAcc);
                accountRepository.save(creditAcc);

                // Update customer bank account balance if provided
                if (bankAccount != null) {
                        // For DEPOSIT type, add to balance
                        // For WITHDRAWAL/FEE/TRANSFER type, subtract from balance
                        if (type == LedgerTransactionType.DEPOSIT || type == LedgerTransactionType.REVERSAL
                                        || type == LedgerTransactionType.SETTLEMENT) {
                                bankAccount.setBalance(bankAccount.getBalance().add(amount));
                        } else if (type == LedgerTransactionType.WITHDRAWAL || type == LedgerTransactionType.FEE
                                        || type == LedgerTransactionType.TRANSFER
                                        || type == LedgerTransactionType.ALLOTMENT) {
                                bankAccount.setBalance(bankAccount.getBalance().subtract(amount));
                        }
                }

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
                                .customerBankAccount(bankAccount)
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
                return recordTransaction(debitAcc, creditAcc, amount, particulars, type, referenceId, makerId, null);
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
                createSystemAccount("Office Expenses", LedgerAccountType.EXPENSE);
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
                                LedgerAccountType.CORE_CAPITAL,
                                targetAccount.getOwnerId());

                // Record transaction: Debit Cash, Credit Capital
                return recordTransaction(
                                cashAccount,
                                capitalAccount,
                                amount,
                                description != null ? description : "Capital deposit",
                                LedgerTransactionType.DEPOSIT,
                                null,
                                checkerId);
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
                                LedgerAccountType.CORE_CAPITAL,
                                targetAccount.getOwnerId());

                // Record transaction: Debit Capital, Credit Cash
                return recordTransaction(
                                capitalAccount,
                                cashAccount,
                                amount,
                                description != null ? description : "Capital withdrawal",
                                LedgerTransactionType.WITHDRAWAL,
                                null,
                                checkerId);
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

                java.util.List<LedgerTransaction> transactions = transactionRepository
                                .findByLedgerAccountAndDateRange(accountId, startDateTime, endDateTime);

                java.util.List<com.fintech.finpro.dto.BankTransactionDTO> transactionDTOs = new java.util.ArrayList<>();
                for (LedgerTransaction t : transactions) {
                        transactionDTOs.add(com.fintech.finpro.dto.BankTransactionDTO.builder()
                                        .id(t.getId())
                                        .date(t.getCreatedAt())
                                        .type(t.getTransactionType() != null ? t.getTransactionType().name()
                                                        : "UNKNOWN")
                                        .amount(t.getAmount())
                                        .description(t.getParticulars())
                                        .referenceId(t.getReferenceId())
                                        .status(t.getStatus())
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
}

package com.fintech.finpro.service;

import com.fintech.finpro.dto.BankAccountCreateDTO;
import com.fintech.finpro.dto.BankAccountDTO;
import com.fintech.finpro.entity.Customer;
import com.fintech.finpro.entity.CustomerBankAccount;
import com.fintech.finpro.repository.CustomerBankAccountRepository;
import com.fintech.finpro.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;
import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class BankAccountService {

        private final CustomerBankAccountRepository bankAccountRepository;
        private final CustomerRepository customerRepository;
        private final com.fintech.finpro.repository.PendingTransactionRepository pendingTransactionRepository;
        private final com.fintech.finpro.repository.LedgerTransactionRepository ledgerTransactionRepository;
        private final SystemAccountService systemAccountService;
        private final TransactionService transactionService;

        @Transactional
        public BankAccountDTO createBankAccount(BankAccountCreateDTO dto) {
                // Validate customer exists
                Customer customer = customerRepository.findById(java.util.Objects.requireNonNull(dto.getCustomerId()))
                                .orElseThrow(() -> new RuntimeException(
                                                "Customer not found with ID: " + dto.getCustomerId()));

                // Check for duplicate account number
                if (bankAccountRepository.existsByCustomerIdAndAccountNumber(dto.getCustomerId(),
                                dto.getAccountNumber())) {
                        throw new RuntimeException("Bank account already exists for this customer");
                }

                // If this is set as primary, unset other primary accounts
                if (Boolean.TRUE.equals(dto.getIsPrimary())) {
                        unsetPrimaryAccounts(dto.getCustomerId());
                }

                // Build bank account entity
                CustomerBankAccount bankAccount = CustomerBankAccount.builder()
                                .customer(customer)
                                .bankName(dto.getBankName())
                                .accountNumber(dto.getAccountNumber())
                                .accountType(dto.getAccountType())
                                .ifscCode(dto.getIfscCode())
                                .branchName(dto.getBranchName())
                                .isPrimary(dto.getIsPrimary())
                                .balance(BigDecimal.ZERO)
                                .status("ACTIVE")
                                .build();

                // CustomerBankAccount saved =
                // java.util.Objects.requireNonNull(bankAccountRepository.save(bankAccount));
                return mapToDTO(bankAccountRepository.save(bankAccount));
        }

        @Transactional(readOnly = true)
        public com.fintech.finpro.dto.AccountStatementDTO getAccountStatement(Long accountId,
                        java.time.LocalDate startDate,
                        java.time.LocalDate endDate) {
                CustomerBankAccount account = bankAccountRepository
                                .findById(java.util.Objects.requireNonNull(accountId))
                                .orElseThrow(() -> new RuntimeException(
                                                "Bank account not found with ID: " + accountId));

                java.time.LocalDateTime startDateTime = startDate.atStartOfDay();
                java.time.LocalDateTime endDateTime = endDate.atTime(23, 59, 59);

                // 1. Calculate Opening Balance
                java.util.List<com.fintech.finpro.enums.LedgerTransactionType> creditTypes = java.util.Arrays.asList(
                                com.fintech.finpro.enums.LedgerTransactionType.DEPOSIT,
                                com.fintech.finpro.enums.LedgerTransactionType.REVERSAL,
                                com.fintech.finpro.enums.LedgerTransactionType.SETTLEMENT);

                java.util.List<com.fintech.finpro.enums.LedgerTransactionType> debitTypes = java.util.Arrays.asList(
                                com.fintech.finpro.enums.LedgerTransactionType.WITHDRAWAL,
                                com.fintech.finpro.enums.LedgerTransactionType.FEE,
                                com.fintech.finpro.enums.LedgerTransactionType.TRANSFER,
                                com.fintech.finpro.enums.LedgerTransactionType.ALLOTMENT);

                BigDecimal openingBalance = ledgerTransactionRepository.getOpeningBalance(
                                accountId,
                                startDateTime,
                                creditTypes,
                                debitTypes);

                // 2. Fetch Transactions (Sorted by Date ASC for calculation)
                // Note: The repository method currently orders by DESC. We need to fetch and
                // recreate or sort here.
                // Let's use the existing repository method and reverse it, or sort in stream.
                java.util.List<com.fintech.finpro.entity.LedgerTransaction> transactions = ledgerTransactionRepository
                                .findByAccountAndDateRange(accountId, startDateTime, endDateTime);

                // Sort by ID/Date ASC for calculation (Oldest first)
                transactions.sort(java.util.Comparator
                                .comparing(com.fintech.finpro.entity.LedgerTransaction::getCreatedAt));

                List<com.fintech.finpro.dto.BankTransactionDTO> transactionDTOs = new java.util.ArrayList<>();
                BigDecimal runningBalance = openingBalance;

                for (com.fintech.finpro.entity.LedgerTransaction t : transactions) {
                        BigDecimal amount = t.getAmount();
                        boolean isCredit = java.util.List.of("DEPOSIT", "REVERSAL", "SETTLEMENT")
                                        .contains(t.getTransactionType().name());
                        boolean isDebit = java.util.List.of("WITHDRAWAL", "FEE", "TRANSFER", "ALLOTMENT")
                                        .contains(t.getTransactionType().name());

                        if (isCredit) {
                                runningBalance = runningBalance.add(amount);
                        } else if (isDebit) {
                                runningBalance = runningBalance.subtract(amount);
                        }

                        transactionDTOs.add(com.fintech.finpro.dto.BankTransactionDTO.builder()
                                        .id(t.getId())
                                        .date(t.getCreatedAt())
                                        .type(t.getTransactionType().name())
                                        .amount(t.getAmount())
                                        .balanceAfter(runningBalance) // Set the calculated balance
                                        .description(t.getParticulars())
                                        .referenceId(t.getReferenceId())
                                        .status(t.getStatus())
                                        .build());
                }

                // 3. Reverse back to Newest First for Display
                java.util.Collections.reverse(transactionDTOs);

                return com.fintech.finpro.dto.AccountStatementDTO.builder()
                                .accountId(accountId)
                                .accountNumber(account.getAccountNumber())
                                .bankName(account.getBankName())
                                .customerName(account.getCustomer().getFullName())
                                .currentBalance(account.getBalance()) // Current actual balance
                                .transactions(transactionDTOs)
                                .build();
        }

        @Transactional(readOnly = true)
        public BankAccountDTO getBankAccountById(Long id) {
                CustomerBankAccount account = bankAccountRepository.findById(java.util.Objects.requireNonNull(id))
                                .orElseThrow(() -> new RuntimeException("Bank account not found with ID: " + id));
                return mapToDTO(account);
        }

        @Transactional(readOnly = true)
        public List<BankAccountDTO> getAccountsByCustomerId(Long customerId) {
                return bankAccountRepository.findByCustomerId(customerId).stream()
                                .map(this::mapToDTO)
                                .collect(Collectors.toList());
        }

        @Transactional(readOnly = true)
        public List<BankAccountDTO> getActiveAccountsByCustomerId(Long customerId) {
                return bankAccountRepository.findActiveAccountsByCustomerId(customerId).stream()
                                .map(this::mapToDTO)
                                .collect(Collectors.toList());
        }

        @Transactional(readOnly = true)
        public BankAccountDTO getPrimaryAccount(Long customerId) {
                return bankAccountRepository.findPrimaryAccountByCustomerId(customerId)
                                .map(this::mapToDTO)
                                .orElse(null);
        }

        @Transactional
        public BankAccountDTO setPrimaryAccount(Long accountId) {
                CustomerBankAccount account = bankAccountRepository
                                .findById(java.util.Objects.requireNonNull(accountId))
                                .orElseThrow(() -> new RuntimeException(
                                                "Bank account not found with ID: " + accountId));

                // Unset other primary accounts for this customer
                unsetPrimaryAccounts(account.getCustomer().getId());

                // Set this as primary
                account.setIsPrimary(true);
                CustomerBankAccount updated = bankAccountRepository.save(account);

                return mapToDTO(updated);
        }

        @Transactional
        public BankAccountDTO updateBankAccount(Long id, BankAccountCreateDTO dto) {
                CustomerBankAccount account = bankAccountRepository.findById(java.util.Objects.requireNonNull(id))
                                .orElseThrow(() -> new RuntimeException("Bank account not found with ID: " + id));

                account.setBankName(dto.getBankName());
                account.setAccountNumber(dto.getAccountNumber());
                account.setAccountType(dto.getAccountType());
                account.setIfscCode(dto.getIfscCode());
                account.setBranchName(dto.getBranchName());

                // Handle primary flag
                if (Boolean.TRUE.equals(dto.getIsPrimary()) && !account.getIsPrimary()) {
                        unsetPrimaryAccounts(account.getCustomer().getId());
                        account.setIsPrimary(true);
                }

                CustomerBankAccount updated = bankAccountRepository.save(account);
                return mapToDTO(updated);
        }

        @Transactional
        public void deleteBankAccount(Long id) {
                CustomerBankAccount account = bankAccountRepository.findById(java.util.Objects.requireNonNull(id))
                                .orElseThrow(() -> new RuntimeException("Bank account not found with ID: " + id));

                // Don't allow deletion of primary account if there are other accounts
                if (account.getIsPrimary()) {
                        List<CustomerBankAccount> otherAccounts = bankAccountRepository
                                        .findByCustomerId(account.getCustomer().getId()).stream()
                                        .filter(a -> !a.getId().equals(id))
                                        .collect(Collectors.toList());

                        if (!otherAccounts.isEmpty()) {
                                throw new RuntimeException(
                                                "Cannot delete primary account. Please set another account as primary first.");
                        }
                }

                bankAccountRepository.delete(account);
        }

        private void unsetPrimaryAccounts(Long customerId) {
                bankAccountRepository.findPrimaryAccountByCustomerId(customerId)
                                .ifPresent(account -> {
                                        account.setIsPrimary(false);
                                        bankAccountRepository.save(account);
                                });
        }

        private BankAccountDTO mapToDTO(CustomerBankAccount account) {
                Long customerId = null;
                String customerName = null;

                if (account.getCustomer() != null) {
                        customerId = account.getCustomer().getId();
                        customerName = account.getCustomer().getFullName();
                }

                return BankAccountDTO.builder()
                                .id(account.getId())
                                .customerId(customerId)
                                .customerName(customerName)
                                .bankName(account.getBankName())
                                .accountNumber(account.getAccountNumber())
                                .accountType(account.getAccountType())
                                .ifscCode(account.getIfscCode())
                                .branchName(account.getBranchName())
                                .isPrimary(account.getIsPrimary())
                                .balance(account.getBalance())
                                .heldBalance(account.getHeldBalance())
                                .status(account.getStatus())
                                .createdAt(account.getCreatedAt())
                                .updatedAt(account.getUpdatedAt())
                                .build();
        }

        /**
         * Create deposit transaction (Maker)
         */
        /**
         * Create deposit transaction (Maker)
         * Auto-verifies if source (Core Capital/Investor) has sufficient balance.
         */
        @Transactional
        public com.fintech.finpro.dto.PendingTransactionDTO createDeposit(Long accountId, java.math.BigDecimal amount,
                        String description, Long makerId) {
                CustomerBankAccount account = bankAccountRepository
                                .findById(java.util.Objects.requireNonNull(accountId))
                                .orElseThrow(() -> new RuntimeException(
                                                "Bank account not found with ID: " + accountId));

                Customer customer = account.getCustomer();
                com.fintech.finpro.entity.SystemAccount sourceSystemAccount;

                // Determine Source System Account (for balance check)
                if (customer.getInvestor() != null) {
                        sourceSystemAccount = customer.getInvestor().getCapitalAccount();
                } else {
                        sourceSystemAccount = systemAccountService.getCoreCapitalAccount();
                }

                boolean canAutoApprove = sourceSystemAccount.getBalance().compareTo(amount) >= 0;

                com.fintech.finpro.entity.PendingTransaction transaction = com.fintech.finpro.entity.PendingTransaction
                                .builder()
                                .transactionType("DEPOSIT")
                                .amount(amount)
                                .account(account)
                                .customer(customer)
                                .description(description)
                                .createdByUserId(makerId)
                                .isBulk(false)
                                .build();

                if (canAutoApprove) {
                        // Execute immediately
                        transactionService.depositToCustomer(
                                        customer.getId(),
                                        amount,
                                        description,
                                        makerId,
                                        account);

                        // Update physical bank account
                        account.setBalance(account.getBalance().add(amount));
                        bankAccountRepository.save(account);

                        // Mark as Approved
                        transaction.setStatus("APPROVED");
                        transaction.setVerifiedAt(java.time.LocalDateTime.now());
                        transaction.setVerifiedByUserId(null); // System verified
                } else {
                        // Create Pending
                        transaction.setStatus("PENDING");
                }

                com.fintech.finpro.entity.PendingTransaction saved = pendingTransactionRepository.save(transaction);
                return mapTransactionToDTO(saved);
        }

        /**
         * Create withdrawal transaction (Maker)
         */
        @Transactional
        public com.fintech.finpro.dto.PendingTransactionDTO createWithdrawal(Long accountId,
                        java.math.BigDecimal amount,
                        String description, Long makerId) {
                CustomerBankAccount account = bankAccountRepository
                                .findById(java.util.Objects.requireNonNull(accountId))
                                .orElseThrow(() -> new RuntimeException(
                                                "Bank account not found with ID: " + accountId));

                // Check sufficient balance
                if (account.getBalance().compareTo(amount) < 0) {
                        throw new RuntimeException("Insufficient balance in account");
                }

                com.fintech.finpro.entity.PendingTransaction transaction = com.fintech.finpro.entity.PendingTransaction
                                .builder()
                                .transactionType("WITHDRAWAL")
                                .amount(amount)
                                .account(account)
                                .customer(account.getCustomer())
                                .description(description)
                                .createdByUserId(makerId)
                                .status("PENDING")
                                .isBulk(false)
                                .build();

                // com.fintech.finpro.entity.PendingTransaction saved =
                // pendingTransactionRepository.save(transaction);
                return mapTransactionToDTO(pendingTransactionRepository.save(transaction));
        }

        /**
         * Get pending transactions for an account
         */
        @Transactional(readOnly = true)
        public List<com.fintech.finpro.dto.PendingTransactionDTO> getPendingTransactions(Long accountId) {
                return pendingTransactionRepository.findAll().stream()
                                .filter(t -> t.getAccount() != null && t.getAccount().getId().equals(accountId))
                                .filter(t -> "PENDING".equals(t.getStatus()))
                                .map(this::mapTransactionToDTO)
                                .collect(Collectors.toList());
        }

        private com.fintech.finpro.dto.PendingTransactionDTO mapTransactionToDTO(
                        com.fintech.finpro.entity.PendingTransaction transaction) {
                return com.fintech.finpro.dto.PendingTransactionDTO.builder()
                                .id(transaction.getId())
                                .transactionType(transaction.getTransactionType())
                                .amount(transaction.getAmount())
                                .accountId(transaction.getAccount() != null ? transaction.getAccount().getId() : null)
                                .customerId(transaction.getCustomer() != null ? transaction.getCustomer().getId()
                                                : null)
                                .description(transaction.getDescription())
                                .createdByUserId(transaction.getCreatedByUserId())
                                .verifiedByUserId(transaction.getVerifiedByUserId())
                                .status(transaction.getStatus())
                                .isBulk(transaction.getIsBulk())
                                .rejectionReason(transaction.getRejectionReason())
                                .verifiedAt(transaction.getVerifiedAt())
                                .build();
        }

        @Transactional(readOnly = true)
        public List<BankAccountDTO> getAllBankAccounts() {
                return bankAccountRepository.findAll().stream()
                                .map(this::mapToDTO)
                                .collect(Collectors.toList());
        }
}

package com.fintech.finpro.service;

import com.fintech.finpro.dto.PendingTransactionDTO;
import com.fintech.finpro.entity.PendingTransaction;
import com.fintech.finpro.entity.CustomerBankAccount;
import com.fintech.finpro.repository.PendingTransactionRepository;
import com.fintech.finpro.repository.CustomerBankAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionVerificationService {

    private final PendingTransactionRepository pendingTransactionRepository;
    private final CapitalDepositService capitalDepositService;
    private final TransactionService transactionService;
    private final CustomerBankAccountRepository bankAccountRepository;
    private final com.fintech.finpro.repository.UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<PendingTransactionDTO> getAllPendingTransactions() {
        return pendingTransactionRepository.findByStatusOrderByCreatedAtDesc("PENDING").stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public PendingTransactionDTO approveTransaction(Long transactionId, Long checkerId) {
        log.info("Approving transaction {} by checker {}", transactionId, checkerId);

        PendingTransaction transaction = pendingTransactionRepository
                .findById(java.util.Objects.requireNonNull(transactionId))
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        if (!transaction.isPending()) {
            throw new RuntimeException("Transaction is not pending");
        }

        String type = transaction.getTransactionType();
        if ("CORE_CAPITAL_DEPOSIT".equals(type) || "CORE_CAPITAL_WITHDRAWAL".equals(type)) {
            // Enforce Admin Verification
            com.fintech.finpro.entity.User checker = userRepository
                    .findById(java.util.Objects.requireNonNull(checkerId))
                    .orElseThrow(() -> new RuntimeException("Checker user not found"));

            if (checker.getRole() != com.fintech.finpro.enums.Role.ADMIN &&
                    checker.getRole() != com.fintech.finpro.enums.Role.SUPERADMIN) {
                throw new RuntimeException("Only ADMIN or SUPERADMIN can verify Capital transactions");
            }

            return capitalDepositService.approveDeposit(transactionId, checkerId);
        } else if ("DEPOSIT".equals(type)) {
            // Process customer deposit to ledger
            if (transaction.getCustomer() == null) {
                throw new RuntimeException("Customer not found in transaction");
            }
            transactionService.depositToCustomer(
                    transaction.getCustomer().getId(),
                    transaction.getAmount(),
                    transaction.getDescription(),
                    checkerId,
                    transaction.getAccount()); // Pass bank account

            // Update physical bank account balance
            CustomerBankAccount account = transaction.getAccount();
            if (account != null) {
                account.setBalance(account.getBalance().add(transaction.getAmount()));
                bankAccountRepository.save(account);
            }
        } else if ("WITHDRAWAL".equals(type)) {
            // Process customer withdrawal from ledger
            if (transaction.getCustomer() == null) {
                throw new RuntimeException("Customer not found in transaction");
            }
            transactionService.withdrawalFromCustomer(
                    transaction.getCustomer().getId(),
                    transaction.getAmount(),
                    transaction.getDescription(),
                    checkerId,
                    transaction.getAccount()); // Pass bank account

            // Update physical bank account balance
            CustomerBankAccount account = transaction.getAccount();
            if (account != null) {
                if (account.getBalance().compareTo(transaction.getAmount()) < 0) {
                    throw new RuntimeException("Insufficient balance in physical bank account");
                }
                account.setBalance(account.getBalance().subtract(transaction.getAmount()));
                bankAccountRepository.save(account);
            }
        }

        transaction.approve(checkerId);
        PendingTransaction saved = pendingTransactionRepository.save(transaction);
        return convertToDTO(saved);
    }

    @Transactional
    public PendingTransactionDTO rejectTransaction(Long transactionId, Long checkerId, String reason) {
        log.info("Rejecting transaction {} by checker {}", transactionId, checkerId);

        PendingTransaction transaction = pendingTransactionRepository
                .findById(java.util.Objects.requireNonNull(transactionId))
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        if (!transaction.isPending()) {
            throw new RuntimeException("Transaction is not pending");
        }

        transaction.reject(checkerId, reason);
        PendingTransaction saved = pendingTransactionRepository.save(transaction);
        return convertToDTO(saved);
    }

    private PendingTransactionDTO convertToDTO(PendingTransaction transaction) {
        return PendingTransactionDTO.builder()
                .id(transaction.getId())
                .transactionType(transaction.getTransactionType())
                .amount(transaction.getAmount())
                .accountId(transaction.getAccount() != null ? transaction.getAccount().getId() : null)
                .accountDisplayName(
                        transaction.getAccount() != null ? transaction.getAccount().getAccountDisplayName() : null)
                .systemAccountId(transaction.getSystemAccount() != null ? transaction.getSystemAccount().getId() : null)
                .systemAccountName(
                        transaction.getSystemAccount() != null ? transaction.getSystemAccount().getAccountName() : null)
                .customerId(transaction.getCustomer() != null ? transaction.getCustomer().getId() : null)
                .customerName(transaction.getCustomer() != null ? transaction.getCustomer().getFullName() : null)
                .description(transaction.getDescription())
                .createdByUserId(transaction.getCreatedByUserId())
                .verifiedByUserId(transaction.getVerifiedByUserId())
                .status(transaction.getStatus())
                .isBulk(transaction.getIsBulk())
                .rejectionReason(transaction.getRejectionReason())
                .verifiedAt(transaction.getVerifiedAt())
                .createdAt(transaction.getCreatedAt())
                .build();
    }
}

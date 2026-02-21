package com.fintech.finpro.service;

import com.fintech.finpro.dto.PendingTransactionDTO;
import com.fintech.finpro.entity.PendingTransaction;
import com.fintech.finpro.repository.PendingTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionVerificationService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(TransactionVerificationService.class);

    private final PendingTransactionRepository pendingTransactionRepository;
    private final CapitalDepositService capitalDepositService;
    private final TransactionService transactionService;
    private final com.fintech.finpro.repository.UserRepository userRepository;
    private final SecondaryMarketService secondaryMarketService;

    @Transactional(readOnly = true)
    public List<PendingTransactionDTO> getAllPendingTransactions() {
        return pendingTransactionRepository.findByStatusOrderByCreatedAtDesc("PENDING").stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PendingTransactionDTO> getTransactionsByCustomerId(Long customerId) {
        return pendingTransactionRepository.findByCustomer_IdOrderByCreatedAtDesc(customerId).stream()
                .filter(tx -> "BUY_SHARES".equals(tx.getTransactionType())
                        || "SELL_SHARES".equals(tx.getTransactionType()))
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
            transactionService.withdrawalFromCustomer(
                    transaction.getCustomer().getId(),
                    transaction.getAmount(),
                    transaction.getDescription(),
                    checkerId,
                    transaction.getAccount()); // Pass bank account
        } else if ("BUY_SHARES".equals(type) || "SELL_SHARES".equals(type)) {
            try {
                log.info("Executing trade settlement for transaction {}", transactionId);
                secondaryMarketService.executeTradeSettlement(transaction, checkerId);
                log.info("Trade settlement completed successfully for transaction {}", transactionId);
            } catch (Exception e) {
                log.error("Failed to execute trade settlement for transaction {}: {}", transactionId, e.getMessage(),
                        e);
                throw new RuntimeException("Settlement failed: " + e.getMessage());
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

    @Transactional
    public void deletePendingTransaction(Long transactionId) {
        PendingTransaction transaction = pendingTransactionRepository
                .findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        if (!"PENDING".equals(transaction.getStatus())) {
            throw new RuntimeException("Only PENDING transactions can be deleted");
        }

        pendingTransactionRepository.delete(transaction);
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

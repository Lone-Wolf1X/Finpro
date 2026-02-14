package com.fintech.finpro.service;

import com.fintech.finpro.dto.CreateCapitalDepositDTO;
import com.fintech.finpro.dto.PendingTransactionDTO;
import com.fintech.finpro.entity.PendingTransaction;
import com.fintech.finpro.entity.SystemAccount;
import com.fintech.finpro.repository.PendingTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for handling capital deposit transactions with maker-checker workflow
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CapitalDepositService {

    private final PendingTransactionRepository pendingTransactionRepository;
    private final SystemAccountService systemAccountService;
    private final LedgerService ledgerService;

    /**
     * Create a pending capital deposit transaction (Maker)
     */
    @Transactional
    public PendingTransactionDTO createCapitalDeposit(CreateCapitalDepositDTO dto, Long makerId) {
        log.info("Creating capital deposit for account {} by maker {}", dto.getTargetAccountId(), makerId);

        // Verify target account exists
        SystemAccount targetAccount = systemAccountService.getAccountById(dto.getTargetAccountId());

        // Create pending transaction
        PendingTransaction transaction = PendingTransaction.builder()
                .transactionType("CORE_CAPITAL_DEPOSIT")
                .amount(dto.getAmount())
                .systemAccount(targetAccount)
                .description(dto.getDescription())
                .createdByUserId(makerId)
                .status("PENDING")
                .isBulk(false)
                .build();

        // PendingTransaction saved = pendingTransactionRepository.save(transaction);
        // log.info("Created pending capital deposit with ID: {}", saved.getId());

        return convertToDTO(pendingTransactionRepository.save(transaction));
    }

    /**
     * Create a pending capital withdrawal transaction (Maker)
     */
    @Transactional
    public PendingTransactionDTO createCapitalWithdrawal(CreateCapitalDepositDTO dto, Long makerId) {
        log.info("Creating capital withdrawal for account {} by maker {}", dto.getTargetAccountId(), makerId);

        // Verify target account exists and has sufficient balance
        SystemAccount targetAccount = systemAccountService.getAccountById(dto.getTargetAccountId());
        if (targetAccount.getBalance().compareTo(dto.getAmount()) < 0) {
            throw new RuntimeException("Insufficient balance in system account for withdrawal");
        }

        // Create pending transaction
        PendingTransaction transaction = PendingTransaction.builder()
                .transactionType("CORE_CAPITAL_WITHDRAWAL")
                .amount(dto.getAmount())
                .systemAccount(targetAccount)
                .description(dto.getDescription())
                .createdByUserId(makerId)
                .status("PENDING")
                .isBulk(false)
                .build();

        // PendingTransaction saved = pendingTransactionRepository.save(transaction);
        // log.info("Created pending capital withdrawal with ID: {}", saved.getId());

        return convertToDTO(pendingTransactionRepository.save(transaction));
    }

    /**
     * Get all pending capital deposits and withdrawals (Checker/Admin)
     */
    public List<PendingTransactionDTO> getPendingDeposits() {
        List<PendingTransaction> pending = pendingTransactionRepository.findAll().stream()
                .filter(t -> t.isPending() && ("CORE_CAPITAL_DEPOSIT".equals(t.getTransactionType())
                        || "CORE_CAPITAL_WITHDRAWAL".equals(t.getTransactionType())))
                .collect(Collectors.toList());
        return pending.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Approve capital deposit or withdrawal (Checker/Admin)
     * NOTE: Strictly verified by Admin only (enforced in controller)
     */
    @Transactional
    public PendingTransactionDTO approveDeposit(Long transactionId, Long checkerId) {
        log.info("Approving capital transaction {} by checker {}", transactionId, checkerId);

        PendingTransaction transaction = pendingTransactionRepository
                .findById(java.util.Objects.requireNonNull(transactionId))
                .orElseThrow(() -> new RuntimeException("Transaction not found with id: " + transactionId));

        if (!transaction.isPending()) {
            throw new RuntimeException("Transaction is not pending");
        }

        SystemAccount targetAccount = transaction.getSystemAccount();
        if (targetAccount == null || targetAccount.getId() == null) {
            throw new RuntimeException("Target system account ID not found in transaction");
        }

        if ("CORE_CAPITAL_DEPOSIT".equals(transaction.getTransactionType())) {
            // Update account balance
            systemAccountService.addToBalance(targetAccount.getId(), transaction.getAmount());

            // Create ledger entry
            ledgerService.createCapitalDepositEntry(
                    targetAccount,
                    transaction.getAmount(),
                    transaction.getDescription(),
                    checkerId);
        } else if ("CORE_CAPITAL_WITHDRAWAL".equals(transaction.getTransactionType())) {
            // Update account balance
            systemAccountService.subtractFromBalance(targetAccount.getId(), transaction.getAmount());

            // Create ledger entry (specific for withdrawal)
            ledgerService.createCapitalWithdrawalEntry(
                    targetAccount,
                    transaction.getAmount(),
                    transaction.getDescription(),
                    checkerId);
        }

        // Mark transaction as approved
        transaction.approve(checkerId);
        PendingTransaction updated = pendingTransactionRepository.save(transaction);

        log.info("Capital {} approved. Account {} balance updated",
                transaction.getTransactionType().toLowerCase(), targetAccount.getAccountNumber());
        return convertToDTO(updated);
    }

    /**
     * Reject capital deposit (Checker/Admin)
     */
    @Transactional
    public PendingTransactionDTO rejectDeposit(Long transactionId, Long checkerId, String reason) {
        log.info("Rejecting capital deposit {} by checker {}", transactionId, checkerId);

        PendingTransaction transaction = pendingTransactionRepository
                .findById(java.util.Objects.requireNonNull(transactionId))
                .orElseThrow(() -> new RuntimeException("Transaction not found with id: " + transactionId));

        if (!transaction.isPending()) {
            throw new RuntimeException("Transaction is not pending");
        }

        // Mark transaction as rejected
        transaction.reject(checkerId, reason);
        PendingTransaction updated = pendingTransactionRepository.save(transaction);

        log.info("Capital deposit rejected");
        return convertToDTO(updated);
    }

    /**
     * Convert entity to DTO
     */
    private PendingTransactionDTO convertToDTO(PendingTransaction transaction) {
        return PendingTransactionDTO.builder()
                .id(transaction.getId())
                .transactionType(transaction.getTransactionType())
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

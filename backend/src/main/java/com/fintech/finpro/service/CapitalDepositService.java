package com.fintech.finpro.service;

import com.fintech.finpro.dto.CreateCapitalDepositDTO;
import com.fintech.finpro.dto.PendingTransactionDTO;
import com.fintech.finpro.entity.PendingTransaction;
import com.fintech.finpro.entity.SystemAccount;
import com.fintech.finpro.repository.PendingTransactionRepository;
import com.fintech.finpro.repository.UserRepository;
import com.fintech.finpro.enums.Role;
import com.fintech.finpro.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for handling capital deposit transactions with maker-checker workflow
 */
@Service
@RequiredArgsConstructor
public class CapitalDepositService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(CapitalDepositService.class);

    private final PendingTransactionRepository pendingTransactionRepository;
    private final SystemAccountService systemAccountService;
    private final LedgerService ledgerService;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    /**
     * Create a pending capital deposit transaction (Maker)
     */
    @Transactional
    public PendingTransactionDTO createCapitalDeposit(CreateCapitalDepositDTO dto, Long makerId) {
        log.info("Creating capital deposit for account {} by maker {}", dto.getTargetAccountId(), makerId);

        // Fetch maker details
        User maker = userRepository.findById(makerId)
                .orElseThrow(() -> new RuntimeException("Maker not found"));

        // Verify target account exists
        SystemAccount targetAccount = systemAccountService.getAccountByIdOrLedgerId(dto.getTargetAccountId());

        // Determine if auto-approval is possible
        boolean isAdmin = maker.getRole() == Role.ADMIN || maker.getRole() == Role.SUPERADMIN;
        boolean withinLimit = dto.getAmount().compareTo(maker.getDepositLimit()) <= 0;
        boolean autoApprove = isAdmin || withinLimit;

        // Create transaction entry
        PendingTransaction transaction = PendingTransaction.builder()
                .transactionType("CORE_CAPITAL_DEPOSIT")
                .amount(dto.getAmount())
                .systemAccount(targetAccount)
                .description(dto.getDescription())
                .createdByUserId(makerId)
                .status(autoApprove ? "APPROVED" : "PENDING")
                .isBulk(false)
                .build();

        if (autoApprove) {
            transaction.setVerifiedByUserId(makerId);
            transaction.setVerifiedAt(java.time.LocalDateTime.now());
        }

        PendingTransaction saved = pendingTransactionRepository.save(transaction);

        // Log activity
        auditLogService.log(makerId, "CREATE_CAPITAL_DEPOSIT", "PendingTransaction", saved.getId(),
                String.format("Created %s deposit for %s. Amount: %s",
                        autoApprove ? "auto-approved" : "pending",
                        targetAccount.getAccountName(), dto.getAmount()));

        if (autoApprove) {
            log.info("Auto-approving capital deposit for role {}", maker.getRole());
            // Execute the actual balance and ledger updates
            systemAccountService.addToBalance(targetAccount.getId(), dto.getAmount());
            ledgerService.createCapitalDepositEntry(targetAccount, dto.getAmount(), dto.getDescription(), makerId);
        }

        return convertToDTO(saved);
    }

    /**
     * Create a pending capital withdrawal transaction (Maker)
     */
    @Transactional
    public PendingTransactionDTO createCapitalWithdrawal(CreateCapitalDepositDTO dto, Long makerId) {
        log.info("Creating capital withdrawal for account {} by maker {}", dto.getTargetAccountId(), makerId);

        // Fetch maker details
        User maker = userRepository.findById(makerId)
                .orElseThrow(() -> new RuntimeException("Maker not found"));

        // Verify target account exists and has sufficient balance
        SystemAccount targetAccount = systemAccountService.getAccountByIdOrLedgerId(dto.getTargetAccountId());
        if (targetAccount.getBalance().compareTo(dto.getAmount()) < 0) {
            throw new RuntimeException("Insufficient balance in system account for withdrawal");
        }

        // Determine if auto-approval is possible
        boolean isAdmin = maker.getRole() == Role.ADMIN || maker.getRole() == Role.SUPERADMIN;
        boolean withinLimit = dto.getAmount().compareTo(maker.getWithdrawalLimit()) <= 0;
        boolean autoApprove = isAdmin || withinLimit;

        // Create transaction entry
        PendingTransaction transaction = PendingTransaction.builder()
                .transactionType("CORE_CAPITAL_WITHDRAWAL")
                .amount(dto.getAmount())
                .systemAccount(targetAccount)
                .description(dto.getDescription())
                .createdByUserId(makerId)
                .status(autoApprove ? "APPROVED" : "PENDING")
                .isBulk(false)
                .build();

        if (autoApprove) {
            transaction.setVerifiedByUserId(makerId);
            transaction.setVerifiedAt(java.time.LocalDateTime.now());
        }

        PendingTransaction saved = pendingTransactionRepository.save(transaction);

        // Log activity
        auditLogService.log(makerId, "CREATE_CAPITAL_WITHDRAWAL", "PendingTransaction", saved.getId(),
                String.format("Created %s withdrawal for %s. Amount: %s",
                        autoApprove ? "auto-approved" : "pending",
                        targetAccount.getAccountName(), dto.getAmount()));

        if (autoApprove) {
            log.info("Auto-approving capital withdrawal for role {}", maker.getRole());
            // Execute updates
            systemAccountService.subtractFromBalance(targetAccount.getId(), dto.getAmount());
            ledgerService.createCapitalWithdrawalEntry(targetAccount, dto.getAmount(), dto.getDescription(), makerId);
        }

        return convertToDTO(saved);
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

        // Log activity
        auditLogService.log(checkerId, "APPROVE_CAPITAL_TRANSACTION", "PendingTransaction", updated.getId(),
                String.format("Approved %s for %s. Amount: %s",
                        updated.getTransactionType(), targetAccount.getAccountName(), updated.getAmount()));

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

        // Log activity
        auditLogService.log(checkerId, "REJECT_CAPITAL_TRANSACTION", "PendingTransaction", updated.getId(),
                String.format("Rejected %s for %s. Reason: %s",
                        updated.getTransactionType(),
                        updated.getSystemAccount() != null ? updated.getSystemAccount().getAccountName() : "Unknown",
                        reason));

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

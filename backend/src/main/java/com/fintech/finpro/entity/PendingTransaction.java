package com.fintech.finpro.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * PendingTransaction Entity
 * Manages transactions awaiting maker-checker approval
 */
@Entity
@Table(name = "pending_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PendingTransaction extends BaseEntity {

    @Column(name = "transaction_type", nullable = false, length = 50)
    private String transactionType; // DEPOSIT, WITHDRAWAL, BULK_DEPOSIT, CORE_CAPITAL_DEPOSIT

    @Column(name = "amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal amount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id")
    private CustomerBankAccount account; // Customer bank account

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "system_account_id")
    private SystemAccount systemAccount; // For capital deposits

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "maker_user_id", nullable = false)
    private Long createdByUserId; // Maker user ID

    @Column(name = "checker_user_id")
    private Long verifiedByUserId; // Checker/Admin user ID

    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED

    @Column(name = "is_bulk", nullable = false)
    @Builder.Default
    private Boolean isBulk = false;

    @Column(name = "bulk_data", columnDefinition = "TEXT")
    private String bulkData; // JSON string for bulk transactions

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    /**
     * Check if transaction is pending
     */
    public boolean isPending() {
        return "PENDING".equals(this.status);
    }

    /**
     * Check if transaction is approved
     */
    public boolean isApproved() {
        return "APPROVED".equals(this.status);
    }

    /**
     * Check if transaction is rejected
     */
    public boolean isRejected() {
        return "REJECTED".equals(this.status);
    }

    /**
     * Check if this is a core capital deposit
     */
    public boolean isCoreCapitalDeposit() {
        return "CORE_CAPITAL_DEPOSIT".equals(this.transactionType);
    }

    /**
     * Approve transaction
     */
    public void approve(Long verifierId) {
        this.status = "APPROVED";
        this.verifiedByUserId = verifierId;
        this.verifiedAt = LocalDateTime.now();
    }

    /**
     * Reject transaction
     */
    public void reject(Long verifierId, String reason) {
        this.status = "REJECTED";
        this.verifiedByUserId = verifierId;
        this.rejectionReason = reason;
        this.verifiedAt = LocalDateTime.now();
    }
}

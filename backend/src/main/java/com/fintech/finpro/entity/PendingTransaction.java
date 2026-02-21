package com.fintech.finpro.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "pending_transactions")
public class PendingTransaction extends BaseEntity {

    @Column(name = "transaction_type", nullable = false, length = 50)
    private String transactionType;

    @Column(name = "amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal amount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id")
    private CustomerBankAccount account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "system_account_id")
    private SystemAccount systemAccount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "maker_user_id", nullable = false)
    private Long createdByUserId;

    @Column(name = "checker_user_id")
    private Long verifiedByUserId;

    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "is_bulk", nullable = false)
    @Builder.Default
    private Boolean isBulk = false;

    @Column(name = "bulk_data", columnDefinition = "TEXT")
    private String bulkData;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    public boolean isPending() {
        return "PENDING".equals(this.status);
    }

    public boolean isApproved() {
        return "APPROVED".equals(this.status);
    }

    public boolean isRejected() {
        return "REJECTED".equals(this.status);
    }

    public boolean isCoreCapitalDeposit() {
        return "CORE_CAPITAL_DEPOSIT".equals(this.transactionType);
    }

    public void approve(Long verifierId) {
        this.status = "APPROVED";
        this.verifiedByUserId = verifierId;
        this.verifiedAt = LocalDateTime.now();
    }

    public void reject(Long verifierId, String reason) {
        this.status = "REJECTED";
        this.verifiedByUserId = verifierId;
        this.rejectionReason = reason;
        this.verifiedAt = LocalDateTime.now();
    }
}

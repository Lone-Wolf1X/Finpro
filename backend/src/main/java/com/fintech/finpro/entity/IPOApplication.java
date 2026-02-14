package com.fintech.finpro.entity;

import com.fintech.finpro.enums.ApplicationStatus;
import com.fintech.finpro.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ipo_applications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IPOApplication extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ipo_id", nullable = false)
    private IPO ipo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_account_id")
    private CustomerBankAccount bankAccount;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "application_number", unique = true, length = 50)
    private String applicationNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "application_status", length = 20)
    @Builder.Default
    private ApplicationStatus applicationStatus = ApplicationStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", length = 20)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Column(name = "allotment_quantity")
    @Builder.Default
    private Integer allotmentQuantity = 0;

    @Column(name = "allotment_status", length = 20)
    @Builder.Default
    private String allotmentStatus = "PENDING"; // PENDING, ALLOTTED, NOT_ALLOTTED

    @Column(name = "applied_at")
    private LocalDateTime appliedAt;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "approved_by")
    private String approvedBy;

    @Column(name = "maker_id")
    private Long makerId;

    @Column(name = "checker_id")
    private Long checkerId;

    @Column(name = "status_updated_at")
    private LocalDateTime statusUpdatedAt;

    /**
     * Generate unique application number
     */
    @PrePersist
    public void generateApplicationNumber() {
        if (this.applicationNumber == null) {
            this.applicationNumber = "IPO" + System.currentTimeMillis();
        }
        if (this.appliedAt == null) {
            this.appliedAt = LocalDateTime.now();
        }
    }

    /**
     * Check if application is pending
     */
    public boolean isPending() {
        return ApplicationStatus.PENDING.equals(this.applicationStatus);
    }

    /**
     * Check if application is approved
     */
    public boolean isApproved() {
        return ApplicationStatus.APPROVED.equals(this.applicationStatus);
    }

    /**
     * Check if payment is completed
     */
    public boolean isPaymentCompleted() {
        return PaymentStatus.PAID.equals(this.paymentStatus);
    }
}

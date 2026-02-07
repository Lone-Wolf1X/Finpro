package com.fintech.finpro.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Investor Entity
 * Manages investors and their capital accounts
 */
@Entity
@Table(name = "investors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Investor extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "investor_code", nullable = false, unique = true, length = 20)
    private String investorCode; // Auto-generated: ADMIN, INV001, INV002

    @Column(name = "nickname", nullable = false, length = 100)
    private String nickname; // For easy identification in customer profiles

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "capital_account_id", nullable = false)
    private SystemAccount capitalAccount;

    @Column(name = "total_invested", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalInvested = BigDecimal.ZERO;

    @Column(name = "total_returns", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalReturns = BigDecimal.ZERO;

    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INACTIVE

    @Column(name = "is_admin", nullable = false)
    @Builder.Default
    private Boolean isAdmin = false; // true for admin investor (owns CORE_CAPITAL)

    /**
     * Check if this is the admin investor
     */
    public boolean isAdminInvestor() {
        return Boolean.TRUE.equals(this.isAdmin);
    }

    /**
     * Get capital balance from capital account
     */
    public BigDecimal getCapitalBalance() {
        return this.capitalAccount != null ? this.capitalAccount.getBalance() : BigDecimal.ZERO;
    }
}

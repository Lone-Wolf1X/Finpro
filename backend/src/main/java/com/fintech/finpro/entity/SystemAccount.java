package com.fintech.finpro.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * SystemAccount Entity
 * Represents core financial accounts: CORE_CAPITAL, EXPENSES_POOL,
 * SUBSCRIPTION_POOL
 */
@Entity
@Table(name = "system_accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemAccount extends BaseEntity {

    @Column(name = "account_number", nullable = false, unique = true, length = 20)
    private String accountNumber; // Numeric: 100002026001, 100002026002, etc.

    @Column(name = "account_code", nullable = false, unique = true, length = 50)
    private String accountCode; // CORE_CAPITAL, EXPENSES_POOL, SUBSCRIPTION_POOL

    @Column(name = "account_name", nullable = false, length = 200)
    private String accountName;

    @Column(name = "balance", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "is_system_account", nullable = false)
    @Builder.Default
    private Boolean isSystemAccount = true;

    @Column(name = "owner_id")
    private Long ownerId; // User ID for CORE_CAPITAL (admin)

    /**
     * Check if this is the CORE_CAPITAL account
     */
    public boolean isCoreCapital() {
        return "CORE_CAPITAL".equals(this.accountCode);
    }

    /**
     * Check if this is the EXPENSES_POOL account
     */
    public boolean isExpensesPool() {
        return "EXPENSES_POOL".equals(this.accountCode);
    }

    /**
     * Check if this is the SUBSCRIPTION_POOL account
     */
    public boolean isSubscriptionPool() {
        return "SUBSCRIPTION_POOL".equals(this.accountCode);
    }
}

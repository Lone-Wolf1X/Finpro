package com.fintech.finpro.entity;

import com.fintech.finpro.enums.LedgerTransactionType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "ledger_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LedgerTransaction extends com.fintech.finpro.entity.BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "debit_account_id")
    private LedgerAccount debitAccount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "credit_account_id")
    private LedgerAccount creditAccount;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(columnDefinition = "TEXT")
    private String particulars;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 50)
    private LedgerTransactionType transactionType;

    @Column(name = "reference_id", length = 100)
    private String referenceId;

    @Column(name = "maker_id")
    private Long makerId;

    @Column(name = "checker_id")
    private Long checkerId;

    @Column(length = 20)
    @Builder.Default
    private String status = "PENDING";

    // Enhanced tracking fields for core accounting system
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_bank_account_id")
    private CustomerBankAccount customerBankAccount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ledger_account_id")
    private SystemAccount ledgerAccount; // System account (CORE_CAPITAL, EXPENSES_POOL, etc.)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "investor_id")
    private Investor investor;

    @Column(name = "reference_type", length = 50)
    private String referenceType; // ipo, subscription, casba_charge, etc.

    @Column(name = "reference_id_long")
    private Long referenceIdLong; // ID of the referenced entity

    @Column(name = "is_dual_entry")
    @Builder.Default
    private Boolean isDualEntry = false; // true for investor-customer transactions
}

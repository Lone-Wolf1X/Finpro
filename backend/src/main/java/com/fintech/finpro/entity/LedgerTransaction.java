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
}

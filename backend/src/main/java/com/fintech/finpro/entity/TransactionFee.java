package com.fintech.finpro.entity;

import com.fintech.finpro.enums.FeeType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "transaction_fees")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionFee extends com.fintech.finpro.entity.BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id")
    private LedgerTransaction transaction;

    @Enumerated(EnumType.STRING)
    @Column(name = "fee_type", nullable = false, length = 50)
    private FeeType feeType;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;
}

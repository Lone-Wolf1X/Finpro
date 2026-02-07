package com.fintech.finpro.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "bulk_deposit_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkDepositItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", referencedColumnName = "batch_id")
    private BulkDeposit bulkDeposit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(length = 20)
    private String status; // PENDING, PROCESSED

    @Column(name = "tenant_id")
    private Long tenantId;
}

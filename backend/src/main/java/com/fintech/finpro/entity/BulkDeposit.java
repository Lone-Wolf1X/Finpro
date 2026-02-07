package com.fintech.finpro.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bulk_deposits")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkDeposit extends BaseEntity {

    @Column(name = "batch_id", unique = true, nullable = false, length = 50)
    private String batchId;

    @Column(name = "maker_id")
    private Long makerId;

    @Column(name = "checker_id")
    private Long checkerId;

    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "item_count", nullable = false)
    private Integer itemCount;

    @Column(length = 20, nullable = false)
    private String status; // PENDING, APPROVED, REJECTED, RETURNED

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @OneToMany(mappedBy = "bulkDeposit", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BulkDepositItem> items = new ArrayList<>();

    @Column(name = "tenant_id")
    private Long tenantId;
}

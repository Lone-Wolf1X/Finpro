package com.fintech.finpro.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "customer_portfolios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerPortfolio extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ipo_id")
    private IPO ipo;

    @Column(name = "scrip_symbol", nullable = false, length = 20)
    private String scripSymbol;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "purchase_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal purchasePrice;

    @Column(name = "total_cost", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalCost;

    @Column(name = "holding_since", nullable = false)
    private LocalDate holdingSince;

    @Column(length = 20)
    @Builder.Default
    private String status = "HELD";

    @Column(name = "is_bonus")
    @Builder.Default
    private Boolean isBonus = false;
}

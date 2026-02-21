package com.fintech.finpro.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "portfolio_transactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "scrip_symbol", nullable = false)
    private String scripSymbol;

    @Column(name = "transaction_type", nullable = false) // BUY, SELL, ALLOTMENT, BONUS
    private String transactionType;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "price_per_share", precision = 10, scale = 2)
    private BigDecimal pricePerShare;

    @Column(name = "total_amount", precision = 15, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "transaction_fee", precision = 10, scale = 2)
    private BigDecimal transactionFee;

    @Column(name = "reference_id")
    private String referenceId;

    @Column(name = "remarks")
    private String remarks;

    @CreationTimestamp
    @Column(name = "transaction_date", updatable = false)
    private LocalDateTime transactionDate;
}

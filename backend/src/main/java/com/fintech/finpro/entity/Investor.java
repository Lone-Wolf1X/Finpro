package com.fintech.finpro.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "investors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Investor extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "total_investment", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalInvestment = BigDecimal.ZERO;

    @Column(name = "held_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal heldAmount = BigDecimal.ZERO;

    @Column(name = "available_balance", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal availableBalance = BigDecimal.ZERO;

    @Column(name = "profit_share_percentage", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal profitSharePercentage = new BigDecimal("60.00");
}

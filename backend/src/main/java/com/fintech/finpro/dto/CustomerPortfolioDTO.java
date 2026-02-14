package com.fintech.finpro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerPortfolioDTO {
    private Long id;
    private Long customerId;
    private Long ipoId;
    private String ipoCompanyName;
    private String scripSymbol;
    private Integer quantity;
    private BigDecimal purchasePrice;
    private BigDecimal totalCost;
    private BigDecimal currentPrice; // For future use (LTP)
    private BigDecimal currentValue; // For future use (LTP * Qty)
    private BigDecimal profitLoss; // For future use
    private LocalDate holdingSince;
    private String status;
    private Boolean isBonus;
}

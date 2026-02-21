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
    private String customerName;
    private Long ipoId;
    private String ipoCompanyName;
    private String scripSymbol;
    private Integer quantity;
    private BigDecimal purchasePrice;
    private BigDecimal totalCost;
    private LocalDate holdingSince;
    private String status;
    private Boolean isBonus;
    private BigDecimal currentPrice;
    private BigDecimal currentValue;
    private BigDecimal lastClosingPrice;
    private BigDecimal valueAsOfLastClosingPrice;
    private BigDecimal profitLoss;
}

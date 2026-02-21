package com.fintech.finpro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfitSummaryDTO {
    private Long accountId;
    private String accountName;
    private BigDecimal currentBalance;
    private BigDecimal totalEarned;
    private BigDecimal totalWithdrawn;
}

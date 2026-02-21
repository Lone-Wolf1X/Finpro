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
public class ATBRequest {
    private String accountNumber;
    private BigDecimal amount;
    private String particulars;
    private String transactionType; // DEPOSIT or WITHDRAWAL
}

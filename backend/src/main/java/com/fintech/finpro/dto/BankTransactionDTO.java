package com.fintech.finpro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankTransactionDTO {
    private Long id;
    private LocalDateTime date;
    private String type; // DEPOSIT, WITHDRAWAL, etc.
    private BigDecimal amount;
    private BigDecimal balanceAfter;
    private String description;
    private String referenceId;
    private String status; // COMPLETED, PENDING (if we include pending in statement)
}

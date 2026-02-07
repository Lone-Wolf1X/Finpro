package com.fintech.finpro.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePendingTransactionDTO {

    @NotBlank(message = "Transaction type is required")
    private String transactionType; // DEPOSIT, WITHDRAWAL, BULK_DEPOSIT, CORE_CAPITAL_DEPOSIT

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private BigDecimal amount;

    private Long accountId; // Customer bank account ID

    private Long customerId;

    private String description;

    private Boolean isBulk;

    private String bulkData; // JSON string for bulk transactions
}

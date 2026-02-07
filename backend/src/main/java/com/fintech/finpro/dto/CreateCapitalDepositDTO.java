package com.fintech.finpro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

/**
 * DTO for creating capital deposit transactions
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCapitalDepositDTO {

    @NotNull(message = "Target account ID is required")
    private Long targetAccountId; // SystemAccount ID (CORE_CAPITAL or investor account)

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private BigDecimal amount;

    private String description;
}

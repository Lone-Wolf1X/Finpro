package com.fintech.finpro.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IPOApplicationCreateDTO {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotNull(message = "IPO ID is required")
    private Long ipoId;

    @NotNull(message = "Bank account ID is required")
    private Long bankAccountId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
}

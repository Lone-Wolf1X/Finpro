package com.fintech.finpro.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankDTO {
    private Long id;

    @NotBlank(message = "Bank name is required")
    private String name;

    private String branchName;

    private String localBody;

    private Boolean isCasba;

    @Min(value = 0, message = "CASBA charge cannot be negative")
    @Max(value = 5, message = "CASBA charge cannot exceed 5")
    private BigDecimal casbaCharge;

    private Boolean active;
}

package com.fintech.finpro.dto;

import com.fintech.finpro.enums.AccountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankAccountCreateDTO {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotBlank(message = "Bank name is required")
    @Size(max = 100, message = "Bank name must not exceed 100 characters")
    private String bankName;

    @NotBlank(message = "Account number is required")
    @Size(max = 50, message = "Account number must not exceed 50 characters")
    private String accountNumber;

    @NotNull(message = "Account type is required")
    private AccountType accountType;

    @Size(max = 20, message = "IFSC code must not exceed 20 characters")
    private String ifscCode;

    @Size(max = 100, message = "Branch name must not exceed 100 characters")
    private String branchName;

    @Builder.Default
    private Boolean isPrimary = false;
}

package com.fintech.finpro.dto;

import com.fintech.finpro.enums.AccountType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankAccountDTO {

    private Long id;
    private Long customerId;
    private String customerName;
    private String bankName;
    private String accountNumber;
    private AccountType accountType;
    private String ifscCode;
    private String branchName;
    private Boolean isPrimary;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

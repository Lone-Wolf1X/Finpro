package com.fintech.finpro.dto;

import com.fintech.finpro.enums.AccountType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddBankAccountDTO {
    private Long bankId;
    private String accountNumber;
    private AccountType accountType;
    private String branchName;
    private String ifscCode;
}

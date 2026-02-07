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
public class SystemAccountDTO {
    private Long id;
    private String accountNumber;
    private String accountCode;
    private String accountName;
    private BigDecimal balance;
    private Boolean isSystemAccount;
    private Long ownerId;
}

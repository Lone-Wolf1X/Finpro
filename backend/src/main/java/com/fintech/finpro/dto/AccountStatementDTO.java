package com.fintech.finpro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountStatementDTO {
    private Long accountId;
    private String accountNumber;
    private String bankName;
    private String customerName;
    private BigDecimal currentBalance;
    private List<BankTransactionDTO> transactions;
}

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
public class InvestorDTO {
    private Long id;
    private Long userId;
    private String investorCode;
    private String nickname;
    private Long capitalAccountId;
    private String capitalAccountNumber;
    private BigDecimal capitalBalance;
    private BigDecimal totalInvested;
    private BigDecimal totalReturns;
    private String status;
    private Boolean isAdmin;
    private Integer assignedCustomersCount;
}

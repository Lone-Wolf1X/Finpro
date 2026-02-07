package com.fintech.finpro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkDepositItemDTO {
    private Long id;
    private Long customerId;
    private String customerName;
    private String customerCode;
    private BigDecimal amount;
    private String remarks;
    private String status;
}

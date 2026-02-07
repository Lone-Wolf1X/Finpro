package com.fintech.finpro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingTransactionDTO {
    private Long id;
    private String transactionType;
    private BigDecimal amount;
    private Long accountId;
    private String accountDisplayName;
    private Long systemAccountId;
    private String systemAccountName;
    private Long customerId;
    private String customerName;
    private String description;
    private Long createdByUserId;
    private String createdByName;
    private Long verifiedByUserId;
    private String verifiedByName;
    private String status;
    private Boolean isBulk;
    private String rejectionReason;
    private LocalDateTime verifiedAt;
    private LocalDateTime createdAt;
}

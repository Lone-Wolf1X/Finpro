package com.fintech.finpro.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountLienDTO {
    private Long id;
    private Long bankAccountId;
    private BigDecimal amount;
    private String purpose;
    private String referenceId;
    private String status;
    private LocalDateTime startDate;
    private LocalDateTime expiryDate;
    private String reason;
    private LocalDateTime createdAt;
}

package com.fintech.finpro.dto;

import com.fintech.finpro.enums.ApplicationStatus;
import com.fintech.finpro.enums.PaymentStatus;
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
public class IPOApplicationDTO {

    private Long id;
    private Long customerId;
    private String customerName;
    private Long ipoId;
    private String ipoCompanyName;
    private Long bankAccountId;
    private String bankAccountNumber;
    private Integer quantity;
    private BigDecimal amount;
    private String applicationNumber;
    private ApplicationStatus applicationStatus;
    private PaymentStatus paymentStatus;
    private Integer allotmentQuantity;
    private String allotmentStatus;
    private LocalDateTime appliedAt;
    private LocalDateTime approvedAt;
    private LocalDateTime rejectedAt;
    private String rejectionReason;
    private String approvedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

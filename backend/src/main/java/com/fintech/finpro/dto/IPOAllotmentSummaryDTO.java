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
public class IPOAllotmentSummaryDTO {
    private Long id;
    private Long ipoId;
    private String companyName;
    private String symbol;

    private Integer totalApplications;
    private Integer totalAllotted;
    private Integer totalNotAllotted;
    private Integer totalSharesAllotted;
    private BigDecimal totalAmountSettled;

    private String initiatedBy;
    private LocalDateTime initiatedAt;

    private String completedBy;
    private LocalDateTime completedAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

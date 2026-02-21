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
public class AllotmentDraftDTO {
    private Long id;
    private Long ipoId;
    private String ipoCompanyName;
    private String ipoSymbol;

    private Long applicationId;
    private String applicationNumber;

    private Long customerId;
    private String customerName;

    private Integer appliedQuantity;
    private BigDecimal appliedAmount;

    private Boolean isAllotted;
    private Integer allottedQuantity;

    private String status;

    private Long makerId;
    private String makerName;

    private Long checkerId;
    private String checkerName;

    private LocalDateTime createdAt;
    private LocalDateTime submittedAt;
    private LocalDateTime verifiedAt;

    private String remarks;
}

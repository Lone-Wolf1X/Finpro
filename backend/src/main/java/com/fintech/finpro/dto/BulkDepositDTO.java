package com.fintech.finpro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkDepositDTO {
    private Long id;
    private String batchId;
    private Long makerId;
    private Long checkerId;
    private BigDecimal totalAmount;
    private Integer itemCount;
    private String status;
    private String remarks;
    private LocalDateTime createdAt;
    private List<BulkDepositItemDTO> items;
}

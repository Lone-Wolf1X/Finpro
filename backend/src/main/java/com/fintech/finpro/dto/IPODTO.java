package com.fintech.finpro.dto;

import com.fintech.finpro.enums.IPOStatus;
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
public class IPODTO {

    private Long id;
    private String companyName;
    private String symbol;
    private Long issueSize;
    private BigDecimal pricePerShare;
    private Integer minQuantity;
    private Integer maxQuantity;
    private LocalDateTime openDate;
    private LocalDateTime closeDate;
    private LocalDateTime allotmentDate;
    private LocalDateTime listingDate;
    private IPOStatus status;
    private String description;
    private boolean isOpen;
    private boolean isClosed;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

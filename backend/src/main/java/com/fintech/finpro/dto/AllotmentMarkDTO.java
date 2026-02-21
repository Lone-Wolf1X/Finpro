package com.fintech.finpro.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AllotmentMarkDTO {
    
    @NotNull(message = "Application ID is required")
    private Long applicationId;
    
    @NotNull(message = "Allotted quantity is required")
    private Integer quantity;
    
    @NotNull(message = "Status is required")
    private String status; // ALLOTTED, NOT_ALLOTTED
}

package com.fintech.finpro.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AllotmentSubmissionDTO {

    @NotNull(message = "IPO ID is required")
    private Long ipoId;

    @NotEmpty(message = "At least one allotment decision is required")
    @Valid
    private List<AllotmentItemDTO> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AllotmentItemDTO {

        @NotNull(message = "Application ID is required")
        private Long applicationId;

        @NotNull(message = "Allotment decision is required")
        private Boolean isAllotted;

        @NotNull(message = "Quantity is required")
        private Integer quantity;
    }
}

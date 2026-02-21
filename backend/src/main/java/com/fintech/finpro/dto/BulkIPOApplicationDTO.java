package com.fintech.finpro.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkIPOApplicationDTO {

    @NotNull(message = "IPO ID is required")
    private Long ipoId;

    @NotEmpty(message = "Application items list cannot be empty")
    private List<BulkIPOApplicationItemDTO> items;

    private Long makerId;
}

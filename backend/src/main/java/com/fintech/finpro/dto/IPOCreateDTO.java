package com.fintech.finpro.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IPOCreateDTO {

    @NotBlank(message = "Company name is required")
    @Size(max = 200, message = "Company name must not exceed 200 characters")
    private String companyName;

    @Size(max = 20, message = "Symbol must not exceed 20 characters")
    private String symbol;

    @NotNull(message = "Issue size is required")
    @Min(value = 1, message = "Issue size must be positive")
    private Long issueSize;

    @NotNull(message = "Price per share is required")
    @DecimalMin(value = "0.01", message = "Price must be positive")
    private BigDecimal pricePerShare;

    @NotNull(message = "Minimum quantity is required")
    @Min(value = 1, message = "Minimum quantity must be at least 1")
    private Integer minQuantity;

    @NotNull(message = "Maximum quantity is required")
    @Min(value = 1, message = "Maximum quantity must be at least 1")
    private Integer maxQuantity;

    @NotNull(message = "Open date is required")
    @FutureOrPresent(message = "Open date must be today or in the future")
    private LocalDate openDate;

    @NotNull(message = "Close date is required")
    @Future(message = "Close date must be in the future")
    private LocalDate closeDate;

    private LocalDate allotmentDate;
    private LocalDate listingDate;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;
}

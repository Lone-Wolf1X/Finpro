package com.fintech.finpro.entity;

import com.fintech.finpro.enums.IPOStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "ipos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IPO extends BaseEntity {

    @Column(name = "company_name", nullable = false, length = 200)
    private String companyName;

    @Column(length = 20)
    private String symbol;

    @Column(name = "issue_size", nullable = false)
    private Long issueSize;

    @Column(name = "price_per_share", nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerShare;

    @Column(name = "min_quantity", nullable = false)
    private Integer minQuantity;

    @Column(name = "max_quantity", nullable = false)
    private Integer maxQuantity;

    @Column(name = "open_date", nullable = false)
    private LocalDate openDate;

    @Column(name = "close_date", nullable = false)
    private LocalDate closeDate;

    @Column(name = "allotment_date")
    private LocalDate allotmentDate;

    @Column(name = "listing_date")
    private LocalDate listingDate;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private IPOStatus status = IPOStatus.UPCOMING;

    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * Check if IPO is currently open for applications
     */
    public boolean isOpen() {
        return IPOStatus.OPEN.equals(this.status) &&
                LocalDate.now().isAfter(this.openDate.minusDays(1)) &&
                LocalDate.now().isBefore(this.closeDate.plusDays(1));
    }

    /**
     * Check if IPO is closed
     */
    public boolean isClosed() {
        return IPOStatus.CLOSED.equals(this.status) ||
                LocalDate.now().isAfter(this.closeDate);
    }

    /**
     * Get IPO display name
     */
    public String getDisplayName() {
        return companyName + " (" + symbol + ")";
    }
}

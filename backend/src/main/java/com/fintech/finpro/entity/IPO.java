package com.fintech.finpro.entity;

import com.fintech.finpro.enums.IPOStatus;
import com.fintech.finpro.enums.IssueType;
import com.fintech.finpro.enums.SecurityType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "ipos")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class IPO extends BaseEntity {

    @Column(name = "company_name", nullable = false, length = 200)
    private String companyName;

    @Column(length = 20)
    private String symbol;

    @Column(name = "issue_size", nullable = false)
    private Long issueSize;

    @Column(name = "price_per_share", nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerShare;
    @Column(name = "current_price", precision = 10, scale = 2)
    private BigDecimal currentPrice;

    @Column(name = "last_closing_price", precision = 10, scale = 2)
    private BigDecimal lastClosingPrice;
    @Column(name = "min_quantity", nullable = false)
    private Integer minQuantity;

    @Column(name = "max_quantity", nullable = false)
    private Integer maxQuantity;

    @Column(name = "open_date", nullable = false)
    private java.time.LocalDateTime openDate;

    @Column(name = "close_date", nullable = false)
    private java.time.LocalDateTime closeDate;

    @Column(name = "allotment_date")
    private java.time.LocalDateTime allotmentDate;

    @Column(name = "listing_date")
    private java.time.LocalDateTime listingDate;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private IPOStatus status = IPOStatus.UPCOMING;

    @Enumerated(EnumType.STRING)
    @Column(name = "issue_type", length = 20)
    @Builder.Default
    private IssueType issueType = IssueType.IPO;

    @Enumerated(EnumType.STRING)
    @Column(name = "security_type", length = 20)
    @Builder.Default
    private SecurityType securityType = SecurityType.EQUITY;

    @Column(name = "area_affected_shares")
    private Long areaAffectedShares;

    @Column(name = "foreign_employment_shares")
    private Long foreignEmploymentShares;

    @Column(name = "local_shares")
    private Long localShares;

    @Column(name = "public_shares")
    private Long publicShares;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "allotment_initiated_at")
    private java.time.LocalDateTime allotmentInitiatedAt;

    @Column(name = "allotment_initiated_by", length = 100)
    private String allotmentInitiatedBy;

    /**
     * Check if IPO is currently open for applications
     */
    public boolean isOpen() {
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        return IPOStatus.OPEN.equals(this.status) &&
                now.isAfter(this.openDate) &&
                now.isBefore(this.closeDate);
    }

    /**
     * Check if IPO is closed
     */
    public boolean isClosed() {
        return IPOStatus.CLOSED.equals(this.status) ||
                java.time.LocalDateTime.now().isAfter(this.closeDate);
    }

    /**
     * Get IPO display name
     */
    public String getDisplayName() {
        return companyName + " (" + symbol + ")";
    }
}

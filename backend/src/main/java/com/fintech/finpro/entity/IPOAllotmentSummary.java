package com.fintech.finpro.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ipo_allotment_summary")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IPOAllotmentSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ipo_id", nullable = false, unique = true)
    private IPO ipo;

    @Column(name = "total_applications", nullable = false)
    @Builder.Default
    private Integer totalApplications = 0;

    @Column(name = "total_allotted", nullable = false)
    @Builder.Default
    private Integer totalAllotted = 0;

    @Column(name = "total_not_allotted", nullable = false)
    @Builder.Default
    private Integer totalNotAllotted = 0;

    @Column(name = "total_shares_allotted", nullable = false)
    @Builder.Default
    private Integer totalSharesAllotted = 0;

    @Column(name = "total_amount_settled", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalAmountSettled = BigDecimal.ZERO;

    @Column(name = "initiated_by")
    private Long initiatedBy;

    @Column(name = "initiated_at")
    private LocalDateTime initiatedAt;

    @Column(name = "completed_by")
    private Long completedBy;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}

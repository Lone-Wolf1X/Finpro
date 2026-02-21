package com.fintech.finpro.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "tenant_features", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"tenant_id", "feature_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenantFeature extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.EAGER) // Eager load feature details
    @JoinColumn(name = "feature_id", nullable = false)
    private Feature feature;

    @Column(name = "is_enabled")
    @Builder.Default
    private Boolean isEnabled = true;

    // JSONB support usually requires custom types or string mapping.
    // For simplicity in this iteration, we treat it as a String and handle JSON serialization in service layer if needed,
    // or use a library like hibernate-types. Given standard JPA, string is safest default without extra deps.
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String config; 

    @Column(name = "valid_until")
    private LocalDateTime validUntil;
}

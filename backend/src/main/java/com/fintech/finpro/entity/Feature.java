package com.fintech.finpro.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "features")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Feature extends BaseEntity {

    @Column(name = "feature_key", unique = true, nullable = false, length = 50)
    private String featureKey;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 50)
    private String category; // MODULE, LIMIT, API

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
}

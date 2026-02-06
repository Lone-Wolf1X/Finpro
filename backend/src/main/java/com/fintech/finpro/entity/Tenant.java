package com.fintech.finpro.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Tenant entity for multi-tenant SaaS architecture
 */
@Entity
@Table(name = "tenants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tenant extends BaseEntity {

    @Column(name = "tenant_key", unique = true, nullable = false, length = 50)
    private String tenantKey;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(unique = true, nullable = false, length = 100)
    private String subdomain;

    @Column(name = "contact_email", nullable = false)
    private String contactEmail;

    @Column(name = "contact_phone", length = 20)
    private String contactPhone;

    @Column(columnDefinition = "TEXT")
    private String address;

    // Subscription details
    @Column(name = "subscription_plan", length = 50)
    private String subscriptionPlan; // BASIC, SILVER, GOLD, PLATINUM

    @Column(name = "subscription_status", length = 20)
    private String subscriptionStatus; // ACTIVE, SUSPENDED, EXPIRED

    @Column(name = "subscription_start_date")
    private LocalDateTime subscriptionStartDate;

    @Column(name = "subscription_end_date")
    private LocalDateTime subscriptionEndDate;

    // Branding
    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "primary_color", length = 7)
    private String primaryColor;

    // Status
    @Column(length = 20)
    private String status; // ACTIVE, INACTIVE, SUSPENDED

    @PrePersist
    protected void onCreate() {
        if (subscriptionPlan == null) {
            subscriptionPlan = "BASIC";
        }
        if (subscriptionStatus == null) {
            subscriptionStatus = "ACTIVE";
        }
        if (status == null) {
            status = "ACTIVE";
        }
        if (primaryColor == null) {
            primaryColor = "#1976d2";
        }
    }
}

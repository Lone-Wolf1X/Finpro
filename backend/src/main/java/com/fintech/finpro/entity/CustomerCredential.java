package com.fintech.finpro.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "customer_credentials")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerCredential extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "credential_type", nullable = false, length = 50)
    private String credentialType; // MEROSHARE, TMS, MOBILE_BANKING, ATM_PIN, TRANSACTION_PIN

    @Column(name = "username", length = 100)
    private String username;

    @Column(name = "password", length = 255)
    private String password; // Should be encrypted

    @Column(name = "pin", length = 100)
    private String pin; // For ATM/Transaction PINs (encrypted)

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
}

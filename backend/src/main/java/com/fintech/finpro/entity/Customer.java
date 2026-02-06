package com.fintech.finpro.entity;

import com.fintech.finpro.enums.CustomerType;
import com.fintech.finpro.enums.Gender;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.Period;

@Entity
@Table(name = "customers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Customer extends BaseEntity {

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Gender gender;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "age")
    private Integer age;

    @Enumerated(EnumType.STRING)
    @Column(name = "customer_type", length = 10)
    private CustomerType customerType;

    @Column(name = "contact_number", length = 20)
    private String contactNumber;

    @Column(name = "bank_account_number", length = 50)
    private String bankAccountNumber;

    @ManyToOne
    @JoinColumn(name = "bank_id")
    private Bank bank;

    // Self-referencing relationship for guardian
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guardian_id")
    private Customer guardian;

    @Column(name = "guardian_name")
    private String guardianName;

    @Column(name = "guardian_relation")
    private String guardianRelation;

    @Column(name = "citizenship_number", unique = true)
    private String citizenshipNumber;

    @Column(name = "nid_number", unique = true)
    private String nidNumber;

    @Column(name = "customer_code", unique = true, nullable = false)
    private String customerCode;

    private String address;

    @Column(name = "kyc_status", nullable = false) // PENDING, APPROVED, REJECTED
    private String kycStatus;

    @Column(name = "created_by_user_id")
    private Long createdByUserId;

    @Column(name = "approved_by_user_id")
    private Long approvedByUserId;

    /**
     * Calculate age from date of birth
     */
    public void calculateAge() {
        if (this.dateOfBirth != null) {
            this.age = Period.between(this.dateOfBirth, LocalDate.now()).getYears();
        }
    }

    /**
     * Determine customer type based on age
     * MINOR if age < 18, MAJOR otherwise
     */
    public void determineCustomerType() {
        if (this.age != null) {
            this.customerType = this.age < 18 ? CustomerType.MINOR : CustomerType.MAJOR;
        }
    }

    /**
     * Get full name
     */
    public String getFullName() {
        return this.firstName + " " + this.lastName;
    }

    /**
     * Check if customer is a minor
     */
    public boolean isMinor() {
        return CustomerType.MINOR.equals(this.customerType);
    }

    /**
     * Check if customer requires guardian
     */
    public boolean requiresGuardian() {
        return isMinor();
    }

    /**
     * Lifecycle callback to calculate age and type before persisting
     */
    @PrePersist
    @PreUpdate
    public void prePersist() {
        calculateAge();
        determineCustomerType();
    }
}

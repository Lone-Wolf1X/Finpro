package com.fintech.finpro.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fintech.finpro.enums.Role;

import java.time.LocalDateTime;

/**
 * User entity for staff users (Admin, Maker, Checker, Investor)
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "user_id", unique = true, nullable = false, length = 50)
    private String userId;

    @Column(name = "staff_id", unique = true, nullable = false, length = 50)
    private String staffId;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String name;

    @Column(name = "first_name", length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(length = 20)
    private String phone;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role; // ADMIN, MAKER, CHECKER, INVESTOR

    @Column(length = 20)
    private String status; // ACTIVE, INACTIVE, BLOCKED

    @Column(name = "must_change_password")
    private Boolean mustChangePassword;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    /**
     * Get full name of the user
     */
    public String getFullName() {
        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        }
        return name != null ? name : userId;
    }

    @PrePersist
    protected void onCreate() {
        if (status == null) {
            status = "ACTIVE";
        }
        if (mustChangePassword == null) {
            mustChangePassword = false;
        }
    }
}

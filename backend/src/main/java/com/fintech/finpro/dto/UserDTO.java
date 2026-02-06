package com.fintech.finpro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String email;
    private String name;
    private String firstName;
    private String lastName;
    private String staffId;
    private String role;
    private String status;
    private Long tenantId;
    private String avatarUrl;
    private String phone;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;
}

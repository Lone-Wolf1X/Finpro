package com.fintech.finpro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {
    private String name;
    private String firstName;
    private String lastName;
    private String phone;
    private String role;
    private String status;
    private String avatarUrl;

    // New fields for updates
    private String password;
    private String userId;
    private String staffId;
}

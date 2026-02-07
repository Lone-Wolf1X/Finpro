package com.fintech.finpro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerCredentialDTO {
    private Long id;
    private Long customerId;
    private String credentialType;
    private String username;
    private String password;
    private String pin;
    private String notes;
    private Boolean isActive;
    private String createdAt;
    private String updatedAt;
}

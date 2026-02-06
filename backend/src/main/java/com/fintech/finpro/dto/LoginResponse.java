package com.fintech.finpro.dto;

import com.fintech.finpro.entity.Tenant;
import com.fintech.finpro.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private User user;
    private Tenant tenant;
    private String token;
}

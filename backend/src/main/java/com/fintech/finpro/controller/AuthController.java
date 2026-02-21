package com.fintech.finpro.controller;

import com.fintech.finpro.dto.LoginRequest;
import com.fintech.finpro.dto.LoginResponse;
import com.fintech.finpro.entity.Tenant;
import com.fintech.finpro.entity.User;
import com.fintech.finpro.repository.UserRepository;
import com.fintech.finpro.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final com.fintech.finpro.repository.TenantRepository tenantRepository; // Injected
    private final JwtService jwtService;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        System.out.println("\n=== LOGIN ATTEMPT ===");
        System.out.println("Email/UserID: " + request.getEmail());
        
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found after authentication"));

            // Fetch Real Tenant
            Tenant tenant = tenantRepository.findById(user.getTenantId())
                    .orElseThrow(() -> new RuntimeException("Tenant not found"));

            // Check Subscription Status
            if ("SUSPENDED".equalsIgnoreCase(tenant.getSubscriptionStatus()) || 
                "EXPIRED".equalsIgnoreCase(tenant.getSubscriptionStatus()) ||
                "INACTIVE".equalsIgnoreCase(tenant.getStatus())) {
                return ResponseEntity.status(403).body(Map.of("message", "Subscription is " + tenant.getSubscriptionStatus() + ". Please contact support."));
            }

            // Check Subscription Expiry Date
            if (tenant.getSubscriptionEndDate() != null && tenant.getSubscriptionEndDate().isBefore(java.time.LocalDateTime.now())) {
                 return ResponseEntity.status(403).body(Map.of("message", "Subscription expired on " + tenant.getSubscriptionEndDate()));
            }

            System.out.println("Generating JWT token...");
            java.util.Map<String, Object> extraClaims = new java.util.HashMap<>();
            extraClaims.put("userId", user.getId());
            extraClaims.put("role", user.getRole());
            extraClaims.put("tenantId", tenant.getId());
            String token = jwtService.generateToken(extraClaims, userDetails);

            LoginResponse response = new LoginResponse(user, tenant, token);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials: " + e.getMessage()));
        }
    }

    @GetMapping("/hash")
    public ResponseEntity<String> generateHash(@RequestParam String password) {
        System.err.println("Generated hash for: " + password);
        return ResponseEntity.ok(passwordEncoder.encode(password));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(user);
    }
}

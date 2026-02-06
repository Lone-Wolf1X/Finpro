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
    private final JwtService jwtService;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        System.out.println("\n=== LOGIN ATTEMPT ===");
        System.out.println("Email/UserID: " + request.getEmail());
        System.out.println("Password length: " + (request.getPassword() != null ? request.getPassword().length() : 0));

        try {
            System.out.println("Attempting authentication...");
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

            System.out.println("Authentication successful!");
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            System.out.println("Principal username: " + userDetails.getUsername());

            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found after authentication"));

            System.out.println("Generating JWT token...");
            String token = jwtService.generateToken(userDetails);

            Tenant tenant = new Tenant();
            tenant.setId(user.getTenantId() != null ? user.getTenantId() : 1L);
            tenant.setTenantKey("nextgen");
            tenant.setCompanyName("Next Gen Innovations Nepal");
            tenant.setStatus("ACTIVE");

            LoginResponse response = new LoginResponse(user, tenant, token);
            System.out.println("Login successful for user: " + user.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("=== LOGIN FAILED ===");
            System.err.println("User: " + request.getEmail());
            System.err.println("Error type: " + e.getClass().getName());
            System.err.println("Error message: " + e.getMessage());
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

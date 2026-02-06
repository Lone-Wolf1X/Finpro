package com.fintech.finpro.security;

import com.fintech.finpro.entity.User;
import com.fintech.finpro.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        System.out.println("=== CustomUserDetailsService.loadUserByUsername ===");
        System.out.println("Looking up user with identifier: " + username);

        // Try finding by email first, then by userId
        User user = userRepository.findByEmail(username)
                .or(() -> {
                    System.out.println("Not found by email, trying userId...");
                    return userRepository.findByUserId(username);
                })
                .orElseThrow(() -> {
                    System.err.println("User not found with identifier: " + username);
                    return new UsernameNotFoundException("User not found with identifier: " + username);
                });

        System.out.println("User found: " + user.getEmail() + " (ID: " + user.getId() + ")");
        System.out.println("User role: " + user.getRole());
        System.out.println("Password hash (first 20 chars): " + user.getPasswordHash().substring(0, 20));

        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail()) // Always use email as the principal's username
                .password(user.getPasswordHash())
                .roles(user.getRole().name())
                .build();

        System.out.println("UserDetails created successfully");
        return userDetails;
    }
}

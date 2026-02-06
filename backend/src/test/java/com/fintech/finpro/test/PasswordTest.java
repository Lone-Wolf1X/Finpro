package com.fintech.finpro.test;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordTest {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        String plainPassword = "100";
        String storedHash = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

        System.out.println("Testing password: " + plainPassword);
        System.out.println("Against hash: " + storedHash);
        System.out.println("Match result: " + encoder.matches(plainPassword, storedHash));

        // Generate a new hash for comparison
        String newHash = encoder.encode(plainPassword);
        System.out.println("\nNewly generated hash: " + newHash);
        System.out.println("New hash matches: " + encoder.matches(plainPassword, newHash));
    }
}

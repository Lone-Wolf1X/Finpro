package com.fintech.finpro.controller;

import com.fintech.finpro.dto.DashboardStats;
import com.fintech.finpro.repository.CustomerRepository;
import com.fintech.finpro.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStats> getStats() {
        long totalUsers = userRepository.count();
        long totalCustomers = customerRepository.count();
        long activeCustomers = customerRepository.countByKycStatus(com.fintech.finpro.enums.KycStatus.APPROVED);
        long pendingApprovals = customerRepository.countByKycStatus(com.fintech.finpro.enums.KycStatus.PENDING);

        DashboardStats stats = new DashboardStats(
                totalUsers,
                totalCustomers,
                activeCustomers,
                pendingApprovals);

        return ResponseEntity.ok(stats);
    }
}

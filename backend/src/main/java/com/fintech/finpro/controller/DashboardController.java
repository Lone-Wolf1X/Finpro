package com.fintech.finpro.controller;

import com.fintech.finpro.dto.DashboardStats;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @GetMapping("/stats")
    public ResponseEntity<DashboardStats> getStats() {
        // TODO: Implement actual stats calculation from database
        // For now, return mock data
        DashboardStats stats = new DashboardStats(
                5, // totalUsers
                10, // totalCustomers
                8, // activeCustomers
                3 // pendingApprovals
        );

        return ResponseEntity.ok(stats);
    }
}

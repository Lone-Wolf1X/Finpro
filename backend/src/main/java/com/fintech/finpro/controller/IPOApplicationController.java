package com.fintech.finpro.controller;

import com.fintech.finpro.dto.IPOApplicationCreateDTO;
import com.fintech.finpro.dto.IPOApplicationDTO;
import com.fintech.finpro.enums.ApplicationStatus;
import com.fintech.finpro.enums.PaymentStatus;
import com.fintech.finpro.service.IPOApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ipo-applications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class IPOApplicationController {

    private final IPOApplicationService applicationService;

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<IPOApplicationDTO> createApplication(@Valid @RequestBody IPOApplicationCreateDTO dto) {
        IPOApplicationDTO created = applicationService.createApplication(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<IPOApplicationDTO> getApplicationById(@PathVariable Long id) {
        IPOApplicationDTO application = applicationService.getApplicationById(id);
        return ResponseEntity.ok(application);
    }

    @GetMapping("/customer/{customerId}")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<IPOApplicationDTO>> getApplicationsByCustomerId(@PathVariable Long customerId) {
        List<IPOApplicationDTO> applications = applicationService.getApplicationsByCustomerId(customerId);
        return ResponseEntity.ok(applications);
    }

    @GetMapping("/ipo/{ipoId}")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<IPOApplicationDTO>> getApplicationsByIpoId(@PathVariable Long ipoId) {
        List<IPOApplicationDTO> applications = applicationService.getApplicationsByIpoId(ipoId);
        return ResponseEntity.ok(applications);
    }

    @GetMapping("/pending")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<IPOApplicationDTO>> getPendingApplications() {
        List<IPOApplicationDTO> applications = applicationService.getPendingApplications();
        return ResponseEntity.ok(applications);
    }

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<IPOApplicationDTO>> getApplicationsByStatus(@RequestParam String status) {
        List<IPOApplicationDTO> applications = applicationService.getApplicationsByStatus(
                ApplicationStatus.valueOf(status.toUpperCase()));
        return ResponseEntity.ok(applications);
    }

    @PutMapping("/{id}/approve")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('CHECKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<IPOApplicationDTO> approveApplication(
            @PathVariable Long id,
            @RequestParam String approvedBy) {
        IPOApplicationDTO approved = applicationService.approveApplication(id, approvedBy);
        return ResponseEntity.ok(approved);
    }

    @PutMapping("/{id}/reject")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('CHECKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<IPOApplicationDTO> rejectApplication(
            @PathVariable Long id,
            @RequestParam String reason) {
        IPOApplicationDTO rejected = applicationService.rejectApplication(id, reason);
        return ResponseEntity.ok(rejected);
    }

    @PutMapping("/{id}/payment-status")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('CHECKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<IPOApplicationDTO> updatePaymentStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        IPOApplicationDTO updated = applicationService.updatePaymentStatus(
                id, PaymentStatus.valueOf(status.toUpperCase()));
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/allot")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('CHECKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<IPOApplicationDTO> allotShares(
            @PathVariable Long id,
            @RequestParam Integer quantity) {
        IPOApplicationDTO allotted = applicationService.allotShares(id, quantity);
        return ResponseEntity.ok(allotted);
    }
}

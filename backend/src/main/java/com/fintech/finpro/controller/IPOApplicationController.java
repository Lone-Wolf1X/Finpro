package com.fintech.finpro.controller;

import com.fintech.finpro.dto.IPOApplicationCreateDTO;
import com.fintech.finpro.dto.IPOApplicationDTO;
import com.fintech.finpro.enums.ApplicationStatus;
import com.fintech.finpro.enums.PaymentStatus;
import com.fintech.finpro.service.IPOApplicationService;
import com.fintech.finpro.security.JwtService;
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

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(IPOApplicationController.class);

    private final IPOApplicationService applicationService;
    private final JwtService jwtService;

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
    public ResponseEntity<?> getApplicationsByCustomerId(@PathVariable Long customerId) {
        try {
            List<IPOApplicationDTO> applications = applicationService.getApplicationsByCustomerId(customerId);
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            e.printStackTrace();
            log.error("Error fetching IPO applications for customer {}: {}", customerId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of(
                            "error", e.getMessage() != null ? e.getMessage() : "Unknown error",
                            "exception", e.toString(),
                            "trace", java.util.Arrays.toString(e.getStackTrace()),
                            "customerId", customerId));
        }
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
    public ResponseEntity<List<IPOApplicationDTO>> getApplicationsByStatus(
            @RequestParam(required = false) String status) {
        if (status == null || status.trim().isEmpty() || "ALL".equalsIgnoreCase(status)) {
            // Return all or handled differently if we want, but for now let's return all
            // applications
            return ResponseEntity.ok(applicationService.getApplicationsByStatus(null));
        }
        List<IPOApplicationDTO> applications = applicationService.getApplicationsByStatus(
                ApplicationStatus.valueOf(status.toUpperCase()));
        return ResponseEntity.ok(applications);
    }

    @PutMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<IPOApplicationDTO> updateApplication(
            @PathVariable Long id,
            @Valid @RequestBody IPOApplicationCreateDTO dto) {
        IPOApplicationDTO updated = applicationService.updateApplication(id, dto);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/verify")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN', 'CHECKER')")
    public ResponseEntity<IPOApplicationDTO> verifyApplication(
            @PathVariable Long id,
            @RequestHeader("Authorization") String token) {

        Long checkerId = jwtService.extractUserId(token.substring(7));
        IPOApplicationDTO verified = applicationService.verifyApplication(id, checkerId);
        return ResponseEntity.ok(verified);
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

    @PostMapping("/bulk")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Void> bulkCreateApplications(
            @Valid @RequestBody com.fintech.finpro.dto.BulkIPOApplicationDTO dto) {
        applicationService.bulkCreateApplications(dto);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/mark-allotment")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<IPOApplicationDTO> markAllotment(
            @Valid @RequestBody com.fintech.finpro.dto.AllotmentMarkDTO dto,
            @RequestHeader("Authorization") String token) {
        Long makerId = jwtService.extractUserId(token.substring(7));
        IPOApplicationDTO marked = applicationService.markAllotment(dto, makerId);
        return ResponseEntity.ok(marked);
    }

    @PutMapping("/bulk-allot")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('CHECKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Void> bulkAllotShares(
            @RequestBody List<Long> ids,
            @RequestHeader("Authorization") String token) {
        Long checkerId = jwtService.extractUserId(token.substring(7));
        applicationService.bulkAllotShares(ids, checkerId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('CHECKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Void> deleteApplication(@PathVariable Long id) {
        applicationService.deleteApplication(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/reset-status")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<IPOApplicationDTO> resetStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        IPOApplicationDTO reset = applicationService.resetApplicationStatus(
                id, ApplicationStatus.valueOf(status.toUpperCase()));
        return ResponseEntity.ok(reset);
    }

    @PutMapping("/{id}/mark-result")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<IPOApplicationDTO> markAllotmentResult(
            @PathVariable Long id,
            @RequestParam boolean isAllotted,
            @RequestParam Integer quantity,
            @RequestHeader("Authorization") String token) {
        Long makerId = jwtService.extractUserId(token.substring(7));
        IPOApplicationDTO marked = applicationService.markAllotmentResult(id, isAllotted, quantity, makerId);
        return ResponseEntity.ok(marked);
    }

    @PutMapping("/{id}/verify-allotment")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('CHECKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<IPOApplicationDTO> verifyAllotment(
            @PathVariable Long id,
            @RequestHeader("Authorization") String token) {
        Long checkerId = jwtService.extractUserId(token.substring(7));
        IPOApplicationDTO verified = applicationService.verifyAndFinalizeAllotment(id, checkerId);
        return ResponseEntity.ok(verified);
    }

    @PutMapping("/bulk-verify")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('CHECKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Void> bulkVerifyAllotments(
            @RequestBody List<Long> ids,
            @RequestHeader("Authorization") String token) {
        Long checkerId = jwtService.extractUserId(token.substring(7));
        applicationService.bulkVerifyAndFinalize(ids, checkerId);
        return ResponseEntity.ok().build();
    }
}

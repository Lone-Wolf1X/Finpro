package com.fintech.finpro.controller;

import com.fintech.finpro.dto.AllotmentDraftDTO;
import com.fintech.finpro.dto.AllotmentSubmissionDTO;
import com.fintech.finpro.dto.IPODTO;
import com.fintech.finpro.dto.IPOAllotmentSummaryDTO;
import com.fintech.finpro.dto.IPOApplicationDTO;
import com.fintech.finpro.enums.IPOStatus;
import com.fintech.finpro.security.JwtService;
import com.fintech.finpro.service.AllotmentWorkflowService;
import com.fintech.finpro.service.IPOApplicationService;
import com.fintech.finpro.service.IPOService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/allotment")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AllotmentController {

    private final AllotmentWorkflowService allotmentService;
    private final IPOService ipoService;
    private final IPOApplicationService applicationService;
    private final JwtService jwtService;

    /**
     * Get all IPOs in ALLOTMENT_PHASE (for Maker dropdown)
     */
    @GetMapping("/ipos-in-allotment-phase")
    @PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<List<IPODTO>> getIPOsInAllotmentPhase() {
        List<IPODTO> ipos = ipoService.getIPOsByStatus(IPOStatus.ALLOTMENT_PHASE);
        return ResponseEntity.ok(ipos);
    }

    /**
     * Get all valid (APPROVED) applications for an IPO
     */
    @GetMapping("/{ipoId}/applications")
    @PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<List<IPOApplicationDTO>> getValidApplications(@PathVariable Long ipoId) {
        List<IPOApplicationDTO> applications = applicationService.getApplicationsByIpoIdAndStatus(
                ipoId, "APPROVED");
        return ResponseEntity.ok(applications);
    }

    /**
     * Maker submits allotment decisions
     */
    @PostMapping("/submit")
    @PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Map<String, String>> submitAllotmentDrafts(
            @Valid @RequestBody AllotmentSubmissionDTO dto,
            @RequestHeader("Authorization") String token) {

        Long makerId = jwtService.extractUserId(token.substring(7));
        String message = allotmentService.submitAllotmentDrafts(dto, makerId);
        return ResponseEntity.ok(Map.of("message", message));
    }

    /**
     * Get all pending drafts (for Checker)
     */
    @GetMapping("/pending-verification")
    @PreAuthorize("hasAnyRole('CHECKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<List<AllotmentDraftDTO>> getPendingDrafts() {
        List<AllotmentDraftDTO> drafts = allotmentService.getPendingDrafts();
        return ResponseEntity.ok(drafts);
    }

    /**
     * Get pending drafts for a specific IPO
     */
    @GetMapping("/{ipoId}/pending-drafts")
    @PreAuthorize("hasAnyRole('CHECKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<List<AllotmentDraftDTO>> getPendingDraftsByIPO(@PathVariable Long ipoId) {
        List<AllotmentDraftDTO> drafts = allotmentService.getPendingDraftsByIPO(ipoId);
        return ResponseEntity.ok(drafts);
    }

    /**
     * Checker verifies allotment drafts
     */
    @PostMapping("/{ipoId}/verify")
    @PreAuthorize("hasAnyRole('CHECKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Map<String, String>> verifyAllotment(
            @PathVariable Long ipoId,
            @RequestParam boolean approve,
            @RequestParam(required = false) String remarks,
            @RequestHeader("Authorization") String token) {

        Long checkerId = jwtService.extractUserId(token.substring(7));
        String message = allotmentService.verifyAllotmentDrafts(ipoId, checkerId, approve, remarks);
        return ResponseEntity.ok(Map.of("message", message));
    }

    /**
     * Get allotment summary for an IPO (Admin reporting)
     */
    @GetMapping("/summary/{ipoId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<IPOAllotmentSummaryDTO> getAllotmentSummary(@PathVariable Long ipoId) {
        IPOAllotmentSummaryDTO summary = allotmentService.getAllotmentSummary(ipoId);
        return ResponseEntity.ok(summary);
    }

    /**
     * Get all allotment summaries (Admin reporting)
     */
    @GetMapping("/all-summaries")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<List<IPOAllotmentSummaryDTO>> getAllSummaries() {
        List<IPOAllotmentSummaryDTO> summaries = allotmentService.getAllSummaries();
        return ResponseEntity.ok(summaries);
    }
}

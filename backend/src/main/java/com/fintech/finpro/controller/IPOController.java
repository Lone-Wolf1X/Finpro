package com.fintech.finpro.controller;

import com.fintech.finpro.dto.IPOCreateDTO;
import com.fintech.finpro.dto.IPODTO;
import com.fintech.finpro.enums.IPOStatus;
import com.fintech.finpro.service.IPOService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ipos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class IPOController {

    private final IPOService ipoService;

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<IPODTO> createIPO(@Valid @RequestBody IPOCreateDTO dto) {
        IPODTO created = ipoService.createIPO(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<IPODTO> getIPOById(@PathVariable Long id) {
        IPODTO ipo = ipoService.getIPOById(id);
        return ResponseEntity.ok(ipo);
    }

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<IPODTO>> getAllIPOs(@RequestParam(required = false) String status) {
        List<IPODTO> ipos;

        if (status != null && !status.isEmpty()) {
            ipos = ipoService.getIPOsByStatus(IPOStatus.valueOf(status.toUpperCase()));
        } else {
            ipos = ipoService.getAllIPOs();
        }

        return ResponseEntity.ok(ipos);
    }

    @GetMapping("/active")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<IPODTO>> getActiveIPOs() {
        List<IPODTO> ipos = ipoService.getActiveIPOs();
        return ResponseEntity.ok(ipos);
    }

    @GetMapping("/upcoming")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<IPODTO>> getUpcomingIPOs() {
        List<IPODTO> ipos = ipoService.getUpcomingIPOs();
        return ResponseEntity.ok(ipos);
    }

    @PutMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<IPODTO> updateIPO(
            @PathVariable Long id,
            @Valid @RequestBody IPOCreateDTO dto) {
        IPODTO updated = ipoService.updateIPO(id, dto);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/status")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<IPODTO> updateIPOStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        IPODTO updated = ipoService.updateIPOStatus(id, IPOStatus.valueOf(status.toUpperCase()));
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Map<String, String>> deleteIPO(@PathVariable Long id) {
        ipoService.deleteIPO(id);
        return ResponseEntity.ok(Map.of("message", "IPO deleted successfully"));
    }

    @PostMapping("/check-status")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Map<String, String>> triggerStatusCheck() {
        ipoService.checkAndSwitchStatus();
        return ResponseEntity.ok(Map.of("message", "IPO status check triggered successfully"));
    }

    @PostMapping("/{id}/allot")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<IPODTO> allotIPO(@PathVariable Long id) {
        IPODTO result = ipoService.processAllotment(id);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/list")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<IPODTO> listIPO(@PathVariable Long id) {
        IPODTO result = ipoService.listIPO(id);
        return ResponseEntity.ok(result);
    }
}

package com.fintech.finpro.controller;

import com.fintech.finpro.dto.BulkDepositCreateDTO;
import com.fintech.finpro.dto.BulkDepositDTO;
import com.fintech.finpro.service.BulkDepositService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bulk-deposits")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BulkDepositController {

    private final BulkDepositService bulkDepositService;

    @PostMapping
    @PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<BulkDepositDTO> createBulkDeposit(
            @RequestBody BulkDepositCreateDTO dto,
            @RequestParam Long makerId) {
        BulkDepositDTO created = bulkDepositService.createBulkDeposit(dto, makerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{batchId}/verify")
    @PreAuthorize("hasAnyRole('CHECKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<BulkDepositDTO> verifyBulkDeposit(
            @PathVariable String batchId,
            @RequestParam Long checkerId) {
        BulkDepositDTO verified = bulkDepositService.verifyBulkDeposit(batchId, checkerId);
        return ResponseEntity.ok(verified);
    }

    @PutMapping("/{batchId}/reject")
    @PreAuthorize("hasAnyRole('CHECKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<BulkDepositDTO> rejectBulkDeposit(
            @PathVariable String batchId,
            @RequestBody Map<String, String> payload,
            @RequestParam Long checkerId) {
        String remarks = payload.get("remarks");
        BulkDepositDTO rejected = bulkDepositService.rejectBulkDeposit(batchId, remarks, checkerId);
        return ResponseEntity.ok(rejected);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<BulkDepositDTO>> getAllBatches() {
        return ResponseEntity.ok(bulkDepositService.getAllBatches());
    }

    @GetMapping("/{batchId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BulkDepositDTO> getBatchByBatchId(@PathVariable String batchId) {
        return ResponseEntity.ok(bulkDepositService.getBatchByBatchId(batchId));
    }
}

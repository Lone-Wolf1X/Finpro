package com.fintech.finpro.controller;

import com.fintech.finpro.entity.LedgerAccount;
import com.fintech.finpro.enums.LedgerAccountType;
import com.fintech.finpro.service.LedgerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ledger")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class LedgerController {

    private final LedgerService ledgerService;
    private final com.fintech.finpro.util.CsvExportService csvExportService;

    @GetMapping("/system-accounts")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<List<LedgerAccount>> getAllSystemAccounts() {
        return ResponseEntity.ok(ledgerService.getAllSystemAccounts());
    }

    @GetMapping("/system-accounts/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<LedgerAccount> getSystemAccountById(@PathVariable Long id) {
        return ResponseEntity.ok(ledgerService.getAccountById(id));
    }

    @PostMapping("/system-accounts")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<LedgerAccount> createSystemAccount(@RequestBody Map<String, String> payload) {
        String name = payload.get("name");
        String typeStr = payload.get("type");

        if (name == null || typeStr == null) {
            throw new RuntimeException("Name and type are required");
        }

        LedgerAccountType type = LedgerAccountType.valueOf(typeStr.toUpperCase());
        LedgerAccount created = ledgerService.createInternalAccount(name, type);
        return ResponseEntity.ok(created);
    }

    @GetMapping("/{id}/statement")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<com.fintech.finpro.dto.AccountStatementDTO> getAccountStatement(
            @PathVariable Long id,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate endDate) {

        if (startDate == null)
            startDate = java.time.LocalDate.now().minusDays(30);
        if (endDate == null)
            endDate = java.time.LocalDate.now();

        return ResponseEntity.ok(ledgerService.getAccountStatement(id, startDate, endDate));
    }

    @GetMapping("/{id}/statement/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<byte[]> exportStatement(
            @PathVariable Long id,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate endDate) {

        if (startDate == null)
            startDate = java.time.LocalDate.now().minusDays(30);
        if (endDate == null)
            endDate = java.time.LocalDate.now();

        com.fintech.finpro.dto.AccountStatementDTO statement = ledgerService.getAccountStatement(id, startDate,
                endDate);
        byte[] csvData = csvExportService.generateStatementCsv(statement);

        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "statement_" + id + ".csv");

        return ResponseEntity.ok()
                .headers(headers)
                .body(csvData);
    }
}

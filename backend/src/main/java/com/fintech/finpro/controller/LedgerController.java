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

    @GetMapping("/system-accounts")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<List<LedgerAccount>> getAllSystemAccounts() {
        return ResponseEntity.ok(ledgerService.getAllSystemAccounts());
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
}

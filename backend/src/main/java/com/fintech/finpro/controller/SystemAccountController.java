package com.fintech.finpro.controller;

import com.fintech.finpro.entity.SystemAccount;
import com.fintech.finpro.service.SystemAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/system-accounts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SystemAccountController {

    private final SystemAccountService systemAccountService;

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN', 'MAKER')")
    public ResponseEntity<List<SystemAccount>> getAllSystemAccounts() {
        return ResponseEntity.ok(systemAccountService.getAllSystemAccounts());
    }

    @GetMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN', 'MAKER')")
    public ResponseEntity<SystemAccount> getSystemAccountById(@PathVariable Long id) {
        return ResponseEntity.ok(systemAccountService.getAccountById(id));
    }
}

package com.fintech.finpro.controller;

import com.fintech.finpro.dto.CustomerCredentialDTO;
import com.fintech.finpro.service.CustomerCredentialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers/{customerId}/credentials")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CustomerCredentialController {

    private final CustomerCredentialService credentialService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CHECKER', 'MAKER')")
    public ResponseEntity<List<CustomerCredentialDTO>> getCredentials(@PathVariable Long customerId) {
        return ResponseEntity.ok(credentialService.getCustomerCredentials(customerId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MAKER')")
    public ResponseEntity<CustomerCredentialDTO> createCredential(
            @PathVariable Long customerId,
            @RequestBody CustomerCredentialDTO dto) {
        return ResponseEntity.ok(credentialService.createCredential(customerId, dto));
    }

    @PutMapping("/{credentialId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MAKER')")
    public ResponseEntity<CustomerCredentialDTO> updateCredential(
            @PathVariable Long customerId,
            @PathVariable Long credentialId,
            @RequestBody CustomerCredentialDTO dto) {
        return ResponseEntity.ok(credentialService.updateCredential(customerId, credentialId, dto));
    }

    @DeleteMapping("/{credentialId}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<Void> deleteCredential(
            @PathVariable Long customerId,
            @PathVariable Long credentialId) {
        credentialService.deleteCredential(customerId, credentialId);
        return ResponseEntity.noContent().build();
    }
}

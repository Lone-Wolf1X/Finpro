package com.fintech.finpro.controller;

import com.fintech.finpro.dto.CustomerCreateDTO;
import com.fintech.finpro.dto.CustomerDTO;
import com.fintech.finpro.dto.CustomerDraftDTO;
import com.fintech.finpro.enums.CustomerType;
import com.fintech.finpro.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CustomerController {

    private final CustomerService customerService;

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<CustomerDTO> createCustomer(@Valid @RequestBody CustomerCreateDTO dto) {
        try {
            CustomerDTO created = customerService.createCustomer(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create customer: " + e.getMessage());
        }
    }

    @PostMapping(value = "/bulk-import", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<List<CustomerDTO>> bulkImportCustomers(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        List<CustomerDTO> created = customerService.bulkImport(file);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/draft")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<CustomerDTO> createDraft(@RequestBody CustomerDraftDTO dto) {
        CustomerDTO created = customerService.createDraft(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}/draft")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<CustomerDTO> updateDraft(
            @PathVariable Long id,
            @RequestBody CustomerDraftDTO dto) {
        CustomerDTO updated = customerService.updateDraft(id, dto);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<CustomerDTO> getCustomerById(@PathVariable Long id) {
        CustomerDTO customer = customerService.getCustomerById(id);
        return ResponseEntity.ok(customer);
    }

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CustomerDTO>> getAllCustomers(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String kycStatus,
            @RequestParam(required = false) String search) {

        List<CustomerDTO> customers;

        if (search != null && !search.isEmpty()) {
            customers = customerService.searchCustomers(search);
        } else if (type != null && !type.isEmpty()) {
            customers = customerService.getCustomersByType(CustomerType.valueOf(type.toUpperCase()));
        } else if (kycStatus != null && !kycStatus.isEmpty()) {
            customers = customerService.getCustomersByKycStatus(kycStatus.toUpperCase());
        } else {
            customers = customerService.getAllCustomers();
        }

        return ResponseEntity.ok(customers);
    }

    @GetMapping("/guardians")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CustomerDTO>> getEligibleGuardians() {
        List<CustomerDTO> guardians = customerService.getEligibleGuardians();
        return ResponseEntity.ok(guardians);
    }

    @PutMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<CustomerDTO> updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody CustomerCreateDTO dto) {
        CustomerDTO updated = customerService.updateCustomer(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Map<String, String>> deleteCustomer(@PathVariable Long id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.ok(Map.of("message", "Customer deleted successfully"));
    }

    @PutMapping("/{id}/approve")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('CHECKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<CustomerDTO> approveCustomer(
            @PathVariable Long id,
            @RequestParam Long approvedBy) {
        CustomerDTO approved = customerService.approveCustomer(id, approvedBy);
        return ResponseEntity.ok(approved);
    }

    @PutMapping("/{id}/reject")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('CHECKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<CustomerDTO> rejectCustomer(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String remarks = payload.get("remarks");
        CustomerDTO rejected = customerService.rejectCustomer(id, remarks);
        return ResponseEntity.ok(rejected);
    }

    @PutMapping("/{id}/return")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('CHECKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<CustomerDTO> returnCustomer(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String remarks = payload.get("remarks");
        CustomerDTO returned = customerService.returnCustomer(id, remarks);
        return ResponseEntity.ok(returned);
    }

    @PostMapping("/{id}/bank-accounts")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<com.fintech.finpro.entity.CustomerBankAccount> addBankAccount(
            @PathVariable Long id,
            @RequestBody com.fintech.finpro.dto.AddBankAccountDTO dto) {
        com.fintech.finpro.entity.CustomerBankAccount account = customerService.addSecondaryBankAccount(id, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(account);
    }

    @PostMapping(value = "/{id}/upload-photo", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Map<String, String>> uploadCustomerPhoto(
            @PathVariable Long id,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        String photoPath = customerService.uploadCustomerPhoto(id, file);
        return ResponseEntity.ok(Map.of("photoPath", photoPath));
    }

    @PostMapping(value = "/{id}/upload-signature", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Map<String, String>> uploadCustomerSignature(
            @PathVariable Long id,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        String signaturePath = customerService.uploadCustomerSignature(id, file);
        return ResponseEntity.ok(Map.of("signaturePath", signaturePath));
    }

    @PostMapping(value = "/{id}/upload-guardian-photo", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Map<String, String>> uploadGuardianPhoto(
            @PathVariable Long id,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        String photoPath = customerService.uploadGuardianPhoto(id, file);
        return ResponseEntity.ok(Map.of("guardianPhotoPath", photoPath));
    }

    @PostMapping(value = "/{id}/upload-guardian-signature", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Map<String, String>> uploadGuardianSignature(
            @PathVariable Long id,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        String signaturePath = customerService.uploadGuardianSignature(id, file);
        return ResponseEntity.ok(Map.of("guardianSignaturePath", signaturePath));
    }
}

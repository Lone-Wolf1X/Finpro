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
    public ResponseEntity<CustomerDTO> createCustomer(@Valid @RequestBody CustomerCreateDTO dto) {
        try {
            CustomerDTO created = customerService.createCustomer(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create customer: " + e.getMessage());
        }
    }

    @PostMapping(value = "/bulk-import", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<CustomerDTO>> bulkImportCustomers(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        List<CustomerDTO> created = customerService.bulkImport(file);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/draft")
    public ResponseEntity<CustomerDTO> createDraft(@RequestBody CustomerDraftDTO dto) {
        CustomerDTO created = customerService.createDraft(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}/draft")
    public ResponseEntity<CustomerDTO> updateDraft(
            @PathVariable Long id,
            @RequestBody CustomerDraftDTO dto) {
        CustomerDTO updated = customerService.updateDraft(id, dto);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerDTO> getCustomerById(@PathVariable Long id) {
        CustomerDTO customer = customerService.getCustomerById(id);
        return ResponseEntity.ok(customer);
    }

    @GetMapping
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
    public ResponseEntity<List<CustomerDTO>> getEligibleGuardians() {
        List<CustomerDTO> guardians = customerService.getEligibleGuardians();
        return ResponseEntity.ok(guardians);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomerDTO> updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody CustomerCreateDTO dto) {
        CustomerDTO updated = customerService.updateCustomer(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteCustomer(@PathVariable Long id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.ok(Map.of("message", "Customer deleted successfully"));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<CustomerDTO> approveCustomer(
            @PathVariable Long id,
            @RequestParam Long approvedBy) {
        CustomerDTO approved = customerService.approveCustomer(id, approvedBy);
        return ResponseEntity.ok(approved);
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<CustomerDTO> rejectCustomer(@PathVariable Long id) {
        CustomerDTO rejected = customerService.rejectCustomer(id);
        return ResponseEntity.ok(rejected);
    }
}

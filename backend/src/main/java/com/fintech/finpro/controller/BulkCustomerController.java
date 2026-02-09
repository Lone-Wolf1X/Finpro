package com.fintech.finpro.controller;

import com.fintech.finpro.security.JwtService;
import com.fintech.finpro.service.BulkCustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/customers/bulk")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BulkCustomerController {

    private final BulkCustomerService bulkCustomerService;
    private final JwtService jwtService;

    @PostMapping("/upload")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN', 'MAKER')")
    public ResponseEntity<List<String>> uploadBulkCustomers(
            @RequestParam("file") MultipartFile file,
            @RequestParam("bankId") Long bankId,
            @RequestHeader("Authorization") String token) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(List.of("Please select a file to upload"));
        }

        Long userId = jwtService.extractUserId(token.substring(7));
        List<String> report = bulkCustomerService.processBulkUpload(file, userId, bankId);

        return ResponseEntity.ok(report);
    }

    @GetMapping("/template")
    public ResponseEntity<byte[]> downloadTemplate() {
        String csvContent = "firstName,lastName,email,mobileNumber,dateOfBirth,gender,address,citizenshipNumber,bankAccountNumber,accountType,initialDeposit,isMinor,guardianId,guardianRelation\n"
                +
                "John,Doe,john.doe@example.com,9800000000,1990-01-01,MALE,Kathmandu 10 New Road,12345/67,SAV001,SAVINGS,0,FALSE,,\n"
                +
                "Baby,Doe,,9800000001,2020-01-01,FEMALE,Kathmandu 10 New Road,,SAV002,SAVINGS,0,TRUE,1,FATHER";

        byte[] content = csvContent.getBytes();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "bulk_customer_template.csv");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(content, headers, HttpStatus.OK);
    }
}

package com.fintech.finpro.service;

import com.fintech.finpro.dto.BulkCustomerCSVRecord;
import com.fintech.finpro.dto.CustomerCreateDTO;
import com.fintech.finpro.dto.CustomerDTO;
import com.fintech.finpro.enums.Gender;
import com.opencsv.bean.CsvToBean;
import com.opencsv.bean.CsvToBeanBuilder;
import com.opencsv.bean.HeaderColumnNameMappingStrategy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.fintech.finpro.repository.CustomerBankAccountRepository;
import com.fintech.finpro.repository.CustomerRepository;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.Reader;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BulkCustomerService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(BulkCustomerService.class);

    private final CustomerService customerService;
    private final CustomerRepository customerRepository;
    private final TransactionService transactionService;
    private final CustomerBankAccountRepository customerBankAccountRepository;

    public List<String> processBulkUpload(MultipartFile file, Long uploadedByUserId, Long bankId) {
        List<String> report = new ArrayList<>();
        int successCount = 0;
        int failureCount = 0;

        try (Reader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            HeaderColumnNameMappingStrategy<BulkCustomerCSVRecord> strategy = new HeaderColumnNameMappingStrategy<>();
            strategy.setType(BulkCustomerCSVRecord.class);

            CsvToBean<BulkCustomerCSVRecord> csvToBean = new CsvToBeanBuilder<BulkCustomerCSVRecord>(reader)
                    .withMappingStrategy(strategy)
                    .withIgnoreLeadingWhiteSpace(true)
                    .withThrowExceptions(false) // Handle exceptions manually via captured exceptions list if needed, or
                                                // iterator
                    .build();

            // We need to collect valid records first for Two-Pass processing
            List<BulkCustomerCSVRecord> validRecords = new ArrayList<>();

            // Use iterator to capture parsing errors per line
            for (BulkCustomerCSVRecord record : csvToBean) {
                validRecords.add(record);
            }

            // Capture parsing errors (e.g. type mismatch, invalid columns)
            csvToBean.getCapturedExceptions().forEach(e -> {
                // failureCount++; // We can count this or just log it
                report.add("CSV Parsing Error: Line " + e.getLineNumber() + " - " + e.getMessage());
                log.error("CSV Parsing Error at line {}: {}", e.getLineNumber(), e.getMessage());
            });

            failureCount += csvToBean.getCapturedExceptions().size();

            // Dictionary to store newly created customers (CitizenshipNumber -> ID)
            // This is needed because Transactional commit might not be visible immediately
            // in DB lookup within same transaction context
            // or simply to avoid DB hits.
            java.util.Map<String, Long> recentlyCreatedMajors = new java.util.HashMap<>();

            // Pass 1: Process Majors
            for (BulkCustomerCSVRecord record : validRecords) {
                if (!isMinorRecord(record)) {
                    try {
                        CustomerDTO created = processSingleRecord(record, uploadedByUserId, bankId,
                                recentlyCreatedMajors);
                        successCount++;
                        if (created != null && record.getCitizenshipNumber() != null) {
                            recentlyCreatedMajors.put(record.getCitizenshipNumber(), created.getId());
                        }
                    } catch (Exception e) {
                        failureCount++;
                        report.add("Failed (Major): " + record.getFirstName() + " " + record.getLastName() + " - "
                                + e.getMessage());
                        log.error("Error processing major record for {}: {}", record.getFirstName(), e.getMessage());
                    }
                }
            }

            // Pass 2: Process Minors
            for (BulkCustomerCSVRecord record : validRecords) {
                if (isMinorRecord(record)) {
                    try {
                        processSingleRecord(record, uploadedByUserId, bankId, recentlyCreatedMajors);
                        successCount++;
                    } catch (Exception e) {
                        failureCount++;
                        report.add("Failed (Minor): " + record.getFirstName() + " " + record.getLastName() + " - "
                                + e.getMessage());
                        log.error("Error processing minor record for {}: {}", record.getFirstName(), e.getMessage());
                    }
                }
            }

            report.add(0, "Summary: " + successCount + " successful, " + failureCount + " failed.");

        } catch (Exception e) {
            log.error("Failed to parse CSV file", e);
            throw new RuntimeException("Failed to process CSV file: " + e.getMessage());
        }

        return report;
    }

    private boolean isMinorRecord(BulkCustomerCSVRecord record) {
        if (record.getIsMinor() != null) {
            return record.getIsMinor();
        }
        // Auto-detect if null
        try {
            LocalDate dob = LocalDate.parse(record.getDateOfBirth());
            int age = java.time.Period.between(dob, LocalDate.now()).getYears();
            return age < 18;
        } catch (Exception e) {
            return false; // Default to major if date parse fails (will fail in processSingleRecord
                          // anyway)
        }
    }

    private CustomerDTO processSingleRecord(BulkCustomerCSVRecord record, Long uploadedByUserId, Long bankId,
            java.util.Map<String, Long> createdMajorsMap) {
        // 1. Map CSV Record to CustomerCreateDTO
        CustomerCreateDTO customerDTO = new CustomerCreateDTO();
        customerDTO.setFirstName(record.getFirstName());
        customerDTO.setLastName(record.getLastName());
        if (record.getEmail() != null && !record.getEmail().trim().isEmpty()) {
            customerDTO.setEmail(record.getEmail());
        }

        customerDTO.setPhone(record.getMobileNumber());
        customerDTO.setDateOfBirth(LocalDate.parse(record.getDateOfBirth()));
        customerDTO.setGender(Gender.valueOf(record.getGender().toUpperCase()));

        // Single Address field
        customerDTO.setAddress(record.getAddress());

        // Bank Info
        customerDTO.setBankId(bankId);
        customerDTO.setBankAccountNumber(record.getBankAccountNumber());

        // Minor/Guardian logic
        boolean isMinor = isMinorRecord(record);

        if (isMinor) {
            // Logic: guardianId (numeric or citizenship) > guardianCitizenshipNumber >
            // Error
            if (record.getGuardianId() != null && !record.getGuardianId().trim().isEmpty()) {
                String guardianIdStr = record.getGuardianId().trim();

                // Try to parse as numeric ID first
                try {
                    Long guardianId = Long.parseLong(guardianIdStr);
                    customerDTO.setGuardianId(guardianId);
                } catch (NumberFormatException e) {
                    // Not a number, treat as citizenship number
                    customerRepository.findByCitizenshipNumber(guardianIdStr)
                            .ifPresentOrElse(
                                    guardian -> customerDTO.setGuardianId(guardian.getId()),
                                    () -> {
                                        throw new RuntimeException("Guardian with Citizenship Number '"
                                                + guardianIdStr + "' not found in database.");
                                    });
                }
            } else if (record.getGuardianCitizenshipNumber() != null
                    && !record.getGuardianCitizenshipNumber().isEmpty()) {

                String guardianCitNum = record.getGuardianCitizenshipNumber();

                // CHECK 1: Look in recently created map (Pass 1)
                if (createdMajorsMap.containsKey(guardianCitNum)) {
                    customerDTO.setGuardianId(createdMajorsMap.get(guardianCitNum));
                } else {
                    // CHECK 2: Look in Database
                    customerRepository.findByCitizenshipNumber(guardianCitNum)
                            .ifPresentOrElse(
                                    guardian -> customerDTO.setGuardianId(guardian.getId()),
                                    () -> {
                                        throw new RuntimeException("Guardian with Citizenship Number '"
                                                + guardianCitNum + "' not found in this batch or database.");
                                    });
                }
            } else {
                throw new RuntimeException("Guardian ID or Citizenship Number is required for minor customers");
            }
            customerDTO.setGuardianRelation(record.getGuardianRelation());
            // Allow linking to pending guardians in bulk upload
            customerDTO.setSkipGuardianKycCheck(true);
        } else {
            // Majors need citizenship number
            if (record.getCitizenshipNumber() == null || record.getCitizenshipNumber().isEmpty()) {
                throw new RuntimeException("Citizenship Number is required for Major customers");
            }
            customerDTO.setCitizenshipNumber(record.getCitizenshipNumber());
        }

        // Always set NID and Citizenship if provided, even for minors (user
        // requirement)
        if (record.getCitizenshipNumber() != null && !record.getCitizenshipNumber().trim().isEmpty()) {
            customerDTO.setCitizenshipNumber(record.getCitizenshipNumber());
        }
        if (record.getNidNumber() != null && !record.getNidNumber().trim().isEmpty()) {
            customerDTO.setNidNumber(record.getNidNumber());
        }

        // 2. Create Customer
        CustomerDTO createdCustomer = customerService.createCustomer(customerDTO);

        // 3. Handle Initial Deposit
        if (record.getInitialDeposit() != null && record.getInitialDeposit().compareTo(java.math.BigDecimal.ZERO) > 0) {
            try {
                // Fetch the primary account freshly created/linked
                com.fintech.finpro.entity.CustomerBankAccount account = customerBankAccountRepository
                        .findByCustomerIdAndAccountNumber(createdCustomer.getId(),
                                createdCustomer.getBankAccountNumber())
                        .orElseThrow(() -> new RuntimeException("Bank account not found for deposit"));

                transactionService.depositToCustomer(
                        createdCustomer.getId(),
                        record.getInitialDeposit(),
                        "Initial Deposit via Bulk Upload",
                        uploadedByUserId,
                        account);
            } catch (Exception e) {
                log.error("Failed to process initial deposit for {}: {}", createdCustomer.getEmail(), e.getMessage());
                // Don't fail the whole customer creation, just log the deposit failure?
                // Or maybe we should allow it to be separate.
                // For now, let's log it. Ideally we might want to alert the user.
            }
        }
        return createdCustomer;
    }
}

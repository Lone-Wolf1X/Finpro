package com.fintech.finpro.dto;

import com.fintech.finpro.enums.CustomerType;
import com.fintech.finpro.enums.Gender;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDTO {

    private Long id;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String phone;
    private String customerCode; // Read-only from backend
    private String citizenshipNumber;
    private String nidNumber;
    private Gender gender;
    private LocalDate dateOfBirth;
    private Integer age;
    private CustomerType customerType;
    private String contactNumber;
    private String bankAccountNumber;
    private BankDTO bank;
    private String address;
    private String kycStatus;

    // Guardian info
    private Long guardianId;
    private String guardianName;

    // Audit fields
    private Long createdByUserId;
    private Long approvedByUserId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

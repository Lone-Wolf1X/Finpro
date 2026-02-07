package com.fintech.finpro.dto;

import com.fintech.finpro.enums.Gender;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDraftDTO {

    @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters")
    private String firstName;

    @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters")
    private String lastName;

    private String email;

    private String phone;

    private Gender gender;

    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    @Size(max = 20, message = "Contact number must not exceed 20 characters")
    private String contactNumber;

    @Size(max = 50, message = "Bank account number must not exceed 50 characters")
    private String bankAccountNumber;

    private Long bankId;

    // Guardian ID (required for MINOR customers, optional for draft)
    private Long guardianId;

    private String guardianName;

    private String guardianRelation;

    private String citizenshipNumber;

    private String nidNumber;

    @Size(max = 500, message = "Address must not exceed 500 characters")
    private String address;

    private String photoPath;
    private String signaturePath;
    private String guardianPhotoPath;
    private String guardianSignaturePath;
}

package com.fintech.finpro.dto;

import com.fintech.finpro.enums.Gender;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerCreateDTO {

    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Phone is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Phone must be 10 digits")
    private String phone;

    @NotNull(message = "Gender is required")
    private Gender gender;

    @NotNull(message = "Date of birth is required")
    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    @Size(max = 20, message = "Contact number must not exceed 20 characters")
    private String contactNumber;

    @NotBlank(message = "Bank account number is required")
    @Size(max = 50, message = "Bank account number must not exceed 50 characters")
    private String bankAccountNumber;

    @NotNull(message = "Bank is required")
    private Long bankId;

    // Guardian ID (required for MINOR customers)
    private Long guardianId;

    private String guardianName;

    private String guardianRelation;

    @Size(max = 50, message = "Citizenship number must not exceed 50 characters")
    private String citizenshipNumber;

    @Size(max = 50, message = "NID number must not exceed 50 characters")
    private String nidNumber;

    @Size(max = 500, message = "Address must not exceed 500 characters")
    private String address;

    private String photoPath;
    private String signaturePath;
    private String guardianPhotoPath;
    private String guardianSignaturePath;
}

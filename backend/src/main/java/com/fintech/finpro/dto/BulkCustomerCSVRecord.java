package com.fintech.finpro.dto;

import com.opencsv.bean.CsvBindByName;
import lombok.Data;

@Data
public class BulkCustomerCSVRecord {

    @CsvBindByName(column = "firstName", required = true)
    private String firstName;

    @CsvBindByName(column = "lastName", required = true)
    private String lastName;

    @CsvBindByName(column = "email")
    private String email;

    @CsvBindByName(column = "mobileNumber", required = true)
    private String mobileNumber;

    @CsvBindByName(column = "dateOfBirth", required = true)
    private String dateOfBirth; // YYYY-MM-DD

    @CsvBindByName(column = "gender", required = true)
    private String gender;

    @CsvBindByName(column = "citizenshipNumber")
    private String citizenshipNumber;

    @CsvBindByName(column = "nidNumber")
    private String nidNumber;

    @CsvBindByName(column = "address", required = true)
    private String address;

    @CsvBindByName(column = "bankAccountNumber", required = true)
    private String bankAccountNumber;

    @CsvBindByName(column = "accountType")
    private String accountType; // SAVINGS (default), CURRENT, FIXED

    @CsvBindByName(column = "initialDeposit")
    private java.math.BigDecimal initialDeposit;

    // Minor specific fields
    @CsvBindByName(column = "isMinor")
    private Boolean isMinor;

    @CsvBindByName(column = "guardianId")
    private String guardianId; // Can be numeric ID or citizenship number

    @CsvBindByName(column = "guardianCitizenshipNumber")
    private String guardianCitizenshipNumber;

    @CsvBindByName(column = "guardianRelation")
    private String guardianRelation;
}

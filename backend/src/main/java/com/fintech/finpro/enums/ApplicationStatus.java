package com.fintech.finpro.enums;

public enum ApplicationStatus {
    PENDING, // Application submitted, awaiting approval
    PENDING_VERIFICATION,
    VERIFIED,
    APPROVED, // Application approved by checker
    REJECTED, // Application rejected
    ALLOTTED // Shares allotted to customer
}

package com.fintech.finpro.enums;

public enum PaymentStatus {
    PENDING, // Payment not yet made
    PAID, // Payment completed
    REFUNDED, // Payment refunded (if not allotted)
    FAILED // Payment failed
}

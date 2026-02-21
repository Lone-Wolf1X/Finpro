package com.fintech.finpro.enums;

public enum IPOStatus {
    UPCOMING, // IPO announced but not open yet
    OPEN, // IPO is currently accepting applications
    CLOSED, // IPO application period closed
    ALLOTMENT_PHASE, // Admin has initiated allotment phase, Maker can mark results
    ALLOTTED, // Shares have been allotted
    LISTED // IPO is now listed on stock exchange
}

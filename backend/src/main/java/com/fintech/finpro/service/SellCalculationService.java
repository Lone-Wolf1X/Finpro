package com.fintech.finpro.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class SellCalculationService {

    /**
     * Calculate Broker Commission for Equity Shares
     */
    public BigDecimal calculateEquityCommission(BigDecimal transactionAmount) {
        if (transactionAmount.compareTo(new BigDecimal("2500")) <= 0) {
            return new BigDecimal("10.00");
        }

        BigDecimal rate;
        if (transactionAmount.compareTo(new BigDecimal("50000")) <= 0) {
            rate = new BigDecimal("0.0036"); // 0.36%
        } else if (transactionAmount.compareTo(new BigDecimal("500000")) <= 0) {
            rate = new BigDecimal("0.0033"); // 0.33%
        } else if (transactionAmount.compareTo(new BigDecimal("2000000")) <= 0) {
            rate = new BigDecimal("0.0031"); // 0.31%
        } else if (transactionAmount.compareTo(new BigDecimal("10000000")) <= 0) {
            rate = new BigDecimal("0.0027"); // 0.27%
        } else {
            rate = new BigDecimal("0.0024"); // 0.24%
        }

        return transactionAmount.multiply(rate).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Calculate SEBON Transaction Fee (0.015%)
     */
    public BigDecimal calculateSebonFee(BigDecimal transactionAmount) {
        return transactionAmount.multiply(new BigDecimal("0.00015")).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Calculate DP Transaction Charge (Rs 25 per stock)
     */
    public BigDecimal getDpCharge() {
        return new BigDecimal("25.00");
    }

    /**
     * Calculate Capital Gain Tax (CGT)
     * For Individuals: < 1yr (7.5%), >= 1yr (5%)
     * For Entities: 10%
     */
    public BigDecimal calculateCGT(BigDecimal netGain, boolean isIndividual, boolean isLongTerm) {
        if (netGain.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal rate;
        if (isIndividual) {
            rate = isLongTerm ? new BigDecimal("0.05") : new BigDecimal("0.075");
        } else {
            rate = new BigDecimal("0.10");
        }

        return netGain.multiply(rate).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Calculate Net Gain:
     * Net Gain = Sales Price - Fees and Commission - Purchase Cost
     */
    public BigDecimal calculateNetGain(BigDecimal salesPrice, BigDecimal totalFees, BigDecimal purchaseCost) {
        return salesPrice.subtract(totalFees).subtract(purchaseCost);
    }
}

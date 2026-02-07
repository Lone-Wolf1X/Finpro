package com.fintech.finpro.service;

import com.fintech.finpro.entity.*;
import com.fintech.finpro.enums.LedgerAccountType;
import com.fintech.finpro.enums.LedgerTransactionType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class ProfitSettlementService {

    private final LedgerService ledgerService;
    private final SellCalculationService sellCalcService;

    /**
     * Settle profit from a share sell.
     * 1. Recover Principal -> Source
     * 2. Split Remaining Profit 60/40
     */
    @Transactional
    public void settleShareSell(
            Customer customer,
            CustomerPortfolio portfolio,
            BigDecimal salesPrice,
            boolean isLongTerm,
            Long makerId) {

        // 1. Calculate Fees and Taxes
        BigDecimal commission = sellCalcService.calculateEquityCommission(salesPrice);
        BigDecimal sebonFee = sellCalcService.calculateSebonFee(salesPrice);
        BigDecimal dpCharge = sellCalcService.getDpCharge();
        BigDecimal totalFees = commission.add(sebonFee).add(dpCharge);

        BigDecimal netRealizable = salesPrice.subtract(totalFees);
        BigDecimal purchaseCost = portfolio.getTotalCost();
        BigDecimal netGain = netRealizable.subtract(purchaseCost);

        BigDecimal cgt = sellCalcService.calculateCGT(netGain, true, isLongTerm);
        BigDecimal netAfterTax = netRealizable.subtract(cgt);

        // 2. Principal Recovery (To Investor or Core Capital)
        LedgerAccount sourceAcc;
        if (customer.getInvestor() != null) {
            Investor inv = customer.getInvestor();
            sourceAcc = ledgerService.getOrCreateAccount(
                    inv.getUser().getFullName() + " - Investment Ledger",
                    LedgerAccountType.INVESTOR_LEDGER,
                    inv.getId());
        } else {
            sourceAcc = ledgerService.getOrCreateAccount("Core Capital", LedgerAccountType.CORE_CAPITAL, null);
        }

        // We assume the sales proceed initially hits an OFFICE_CASH or
        // BROKER_RECEIVABLE account
        LedgerAccount officeCash = ledgerService.getOrCreateAccount("Office Cash", LedgerAccountType.OFFICE, null);

        // Principal Recovery entry: Debit Office -> Credit Source
        ledgerService.recordTransaction(
                officeCash,
                sourceAcc,
                purchaseCost,
                String.format("Principal Recovery for %s - Scrip %s", customer.getFullName(),
                        portfolio.getScripSymbol()),
                LedgerTransactionType.SETTLEMENT,
                "PRIN-" + portfolio.getId(),
                makerId);

        // 3. Profit Splitting (60/40)
        BigDecimal totalProfitToDivide = netAfterTax.subtract(purchaseCost);
        if (totalProfitToDivide.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal investorProfit = totalProfitToDivide.multiply(new BigDecimal("0.60")).setScale(2,
                    RoundingMode.HALF_UP);
            BigDecimal customerProfit = totalProfitToDivide.multiply(new BigDecimal("0.40")).setScale(2,
                    RoundingMode.HALF_UP);

            // Entry 1: Investor/Admin Share (Debit Office -> Credit Source)
            ledgerService.recordTransaction(
                    officeCash,
                    sourceAcc,
                    investorProfit,
                    String.format("Profit Share (60%%) for %s - Scrip %s", customer.getFullName(),
                            portfolio.getScripSymbol()),
                    LedgerTransactionType.SETTLEMENT,
                    "PROF60-" + portfolio.getId(),
                    makerId);

            // Entry 2: Customer Share (Debit Office -> Credit Customer)
            LedgerAccount customerAcc = ledgerService.getOrCreateAccount(
                    customer.getFullName() + " - Ledger",
                    LedgerAccountType.CUSTOMER_LEDGER,
                    customer.getId());

            ledgerService.recordTransaction(
                    officeCash,
                    customerAcc,
                    customerProfit,
                    String.format("Profit Share (40%%) for Scrip %s", portfolio.getScripSymbol()),
                    LedgerTransactionType.SETTLEMENT,
                    "PROF40-" + portfolio.getId(),
                    makerId);
        }

        // 4. Record Taxes and Commission Payable (Internal accounting)
        // (Implementation omitted for brevity, but would involve debiting Office and
        // crediting CGT_PAYABLE, etc.)
    }
}

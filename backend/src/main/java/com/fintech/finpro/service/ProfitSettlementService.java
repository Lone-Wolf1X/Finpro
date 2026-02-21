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

        private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ProfitSettlementService.class);

        private final LedgerService ledgerService;
        private final SellCalculationService sellCalcService;
        private final com.fintech.finpro.repository.CustomerBankAccountRepository bankAccountRepository;

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

                log.info("Settling share sell for customer: {}, portfolio: {}, amount: {}", customer.getId(),
                                portfolio.getId(), salesPrice);

                try {
                        // 1. Calculate Fees and Taxes
                        BigDecimal commission = sellCalcService.calculateEquityCommission(salesPrice);
                        BigDecimal sebonFee = sellCalcService.calculateSebonFee(salesPrice,
                                        com.fintech.finpro.enums.SecurityType.EQUITY);
                        BigDecimal dpCharge = sellCalcService.getDpCharge();

                        BigDecimal totalNepseFees = commission.add(sebonFee).add(dpCharge);

                        BigDecimal netRealizable = salesPrice.subtract(totalNepseFees);

                        // Purchase cost (Principal)
                        BigDecimal purchaseCost = portfolio.getTotalCost();
                        if (purchaseCost == null)
                                purchaseCost = BigDecimal.ZERO;

                        // Calculate Net Profit for CGT: (Sales - SellFees) - (Purchase Cost)
                        BigDecimal totalProfit = netRealizable.subtract(purchaseCost);

                        // CGT calculation: for individuals (7.5% or 5%)
                        BigDecimal cgt = sellCalcService.calculateCGT(totalProfit, true, isLongTerm);

                        long portfolioId = portfolio.getId();

                        // 2. Prepare Ledger Accounts
                        LedgerAccount officeCash = ledgerService.getOrCreateAccount("Office Cash",
                                        LedgerAccountType.OFFICE,
                                        null);

                        LedgerAccount shareSettlementAcc = ledgerService.getOrCreateAccount("Share Settlement Account",
                                        LedgerAccountType.SUSPENSE, null);

                        LedgerAccount brokerPayableAcc = ledgerService.getOrCreateAccount("Broker Commission Payable",
                                        LedgerAccountType.TAX_PAYABLE, null);

                        LedgerAccount taxPayableAcc = ledgerService.getOrCreateAccount("Tax Payable (CGT)",
                                        LedgerAccountType.TAX_PAYABLE, null);

                        LedgerAccount adminProfitAcc = ledgerService.getOrCreateAccount("Admin Profits",
                                        LedgerAccountType.PROFIT_ACCOUNT, null);

                        LedgerAccount subFeeIncomeAcc = ledgerService.getOrCreateAccount("Subscription Fee Income",
                                        LedgerAccountType.FEE_INCOME, null);

                        LedgerAccount dematAmcPayableAcc = ledgerService.getOrCreateAccount("Demat AMC Payable",
                                        LedgerAccountType.TAX_PAYABLE, null);

                        LedgerAccount customerLedger = ledgerService.getOrCreateAccount(
                                        customer.getFullName() + " - Ledger",
                                        LedgerAccountType.CUSTOMER_LEDGER,
                                        customer.getId());

                        CustomerBankAccount customerBank = findCustomerBankAccount(customer.getId());

                        // --- PHASE 1: INFLOW (Market -> Share Settlement) ---
                        ledgerService.recordTransaction(
                                        officeCash,
                                        shareSettlementAcc,
                                        salesPrice,
                                        String.format("Sale Proceeds: %s", portfolio.getScripSymbol()),
                                        LedgerTransactionType.SETTLEMENT,
                                        "SELL-IN-" + portfolioId,
                                        makerId,
                                        null, // remarks
                                        null);

                        // --- PHASE 2: INTERNAL ALLOCATIONS (From Share Settlement) ---

                        // 2.1 Broker/NEPSE Fees
                        if (totalNepseFees.compareTo(BigDecimal.ZERO) > 0) {
                                ledgerService.recordTransaction(
                                                shareSettlementAcc,
                                                brokerPayableAcc,
                                                totalNepseFees,
                                                String.format("Broker/NEPSE Fees: %s", portfolio.getScripSymbol()),
                                                LedgerTransactionType.FEE,
                                                "FEE-" + portfolioId,
                                                makerId,
                                                null,
                                                null);
                        }

                        // 2.2 CGT (Tax)
                        if (cgt.compareTo(BigDecimal.ZERO) > 0) {
                                ledgerService.recordTransaction(
                                                shareSettlementAcc,
                                                taxPayableAcc,
                                                cgt,
                                                String.format("CGT: %s", portfolio.getScripSymbol()),
                                                LedgerTransactionType.FEE,
                                                "CGT-" + portfolioId,
                                                makerId,
                                                null,
                                                null);
                        }

                        // --- PHASE 3: CUSTOMER CREDIT (Net Receivable) ---
                        // Net Receivable = Sales Price - Fees - CGT
                        BigDecimal netReceivable = salesPrice.subtract(totalNepseFees).subtract(cgt);

                        if (netReceivable.compareTo(BigDecimal.ZERO) > 0) {
                                ledgerService.recordTransaction(
                                                shareSettlementAcc,
                                                customerLedger,
                                                netReceivable,
                                                String.format("Net Receivable (Sales - Fees/Tax): %s",
                                                                portfolio.getScripSymbol()),
                                                LedgerTransactionType.SETTLEMENT,
                                                "NET-REC-" + portfolioId,
                                                makerId,
                                                "Net Receivable",
                                                customerBank);
                        }

                        // --- PHASE 4: DEDUCTIONS FROM CUSTOMER (Admin Profit & Sub/AMC) ---

                        // 4.1 Admin Profit Share (60% of Divisible Profit)
                        if (totalProfit.compareTo(BigDecimal.ZERO) > 0) {
                                // Divisible Profit = Total Profit - CGT
                                BigDecimal divisibleProfit = totalProfit.subtract(cgt);
                                BigDecimal adminShare = divisibleProfit.multiply(new BigDecimal("0.60")).setScale(2,
                                                RoundingMode.HALF_UP);

                                if (adminShare.compareTo(BigDecimal.ZERO) > 0) {
                                        ledgerService.recordTransaction(
                                                        customerLedger,
                                                        adminProfitAcc,
                                                        adminShare,
                                                        String.format("Admin Profit Share (60%%): %s",
                                                                        portfolio.getScripSymbol()),
                                                        LedgerTransactionType.FEE,
                                                        "ADM-SHARE-" + portfolioId,
                                                        makerId,
                                                        "Admin Profit Deduction",
                                                        customerBank);
                                }
                        }

                        // 4.2 Subscription & AMC Deductions
                        BigDecimal subFee = BigDecimal.ZERO;
                        BigDecimal amcFee = BigDecimal.ZERO;
                        java.time.LocalDate today = java.time.LocalDate.now();

                        // Check Subscription
                        if (customer.getSubscriptionPaidUntil() == null
                                        || customer.getSubscriptionPaidUntil().isBefore(today)) {
                                subFee = new BigDecimal("1000.00");
                                customer.setSubscriptionPaidUntil(today.plusYears(1));
                        }

                        // Check Demat AMC
                        if (customer.getDematAmcPaidUntil() == null
                                        || customer.getDematAmcPaidUntil().isBefore(today)) {
                                amcFee = Boolean.TRUE.equals(customer.getIsDematRenewed())
                                                ? new BigDecimal("150.00")
                                                : new BigDecimal("200.00");
                                customer.setDematAmcPaidUntil(today.plusYears(1));
                                customer.setIsDematRenewed(true);
                        }

                        if (subFee.compareTo(BigDecimal.ZERO) > 0) {
                                ledgerService.recordTransaction(
                                                customerLedger,
                                                subFeeIncomeAcc,
                                                subFee,
                                                String.format("Annual Subscription Deduction: %s",
                                                                customer.getFullName()),
                                                LedgerTransactionType.FEE,
                                                "SUB-DED-" + portfolioId,
                                                makerId,
                                                "Subscription Fee",
                                                customerBank);
                        }

                        if (amcFee.compareTo(BigDecimal.ZERO) > 0) {
                                ledgerService.recordTransaction(
                                                customerLedger,
                                                dematAmcPayableAcc,
                                                amcFee,
                                                String.format("Demat AMC Deduction: %s", customer.getFullName()),
                                                LedgerTransactionType.FEE,
                                                "AMC-DED-" + portfolioId,
                                                makerId,
                                                "Demat AMC",
                                                customerBank);
                        }

                        // 4.3 Recovery of Admin/Fees to Office Cash (Admin Profit + Sub + AMC)
                        // 4.3 Recovery logic removed as it's handled via direct allocation
                        // Actually, these funds are now in AdminProfit/FeeIncome accounts.
                        // If we want to move them to OfficeCash, we can, but usually they stay in
                        // Income accounts until EOD.
                        // However, the previous logic had a "Recovery" step.
                        // If the funds were deducted from Customer Ledger (who got them from Share
                        // Settlement -> Office Cash),
                        // Then effectively the cash is back in the system.
                        // Ideally, we might want to sweep `Admin Profits` to `Office Cash` or similar?
                        // The user didn't ask for this specifically, but "Recovery" implies moving it
                        // to a Real Cash account?
                        // I will leave it in the respective Income/Payable accounts as that is cleaner
                        // accounting.
                        // adminProfitAcc -> Profit Account
                        // subFeeIncomeAcc -> Income Account
                        // dematAmcPayableAcc -> Payable (Liability)
                        // This is correct. No need to sweep to Office Cash immediately in this
                        // transaction.

                        log.info("Settlement (Net Receivable Flow) completed successfully.");

                } catch (Exception e) {
                        log.error("Error during settlement: ", e);
                        throw e;
                }
        }

        private CustomerBankAccount findCustomerBankAccount(Long customerId) {
                return bankAccountRepository.findByCustomerIdAndIsPrimaryTrue(customerId)
                                .orElse(bankAccountRepository.findByCustomerId(customerId).stream().findFirst()
                                                .orElse(null));
        }
}

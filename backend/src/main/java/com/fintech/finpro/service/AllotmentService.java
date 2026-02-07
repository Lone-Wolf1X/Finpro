package com.fintech.finpro.service;

import com.fintech.finpro.entity.*;
import com.fintech.finpro.enums.LedgerAccountType;
import com.fintech.finpro.enums.LedgerTransactionType;
import com.fintech.finpro.repository.CustomerPortfolioRepository;
import com.fintech.finpro.repository.IPOApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class AllotmentService {

        private final CustomerPortfolioRepository portfolioRepository;
        private final IPOApplicationRepository applicationRepository;
        private final LedgerService ledgerService;

        /**
         * Process Allotment for an application.
         * 1. Convert to Scrip in Portfolio.
         * 2. Finalize fund deduction (Held -> Paid).
         * 3. Apply CASBA charge (NPR 5).
         */
        @Transactional
        public void processAllotment(Long applicationId, Integer allottedQty, Long checkerId) {
                IPOApplication app = applicationRepository.findById(java.util.Objects.requireNonNull(applicationId))
                                .orElseThrow(() -> new RuntimeException("Application not found"));

                app.setAllotmentStatus("ALLOTTED");
                app.setAllotmentQuantity(allottedQty);

                Customer customer = app.getCustomer();
                IPO ipo = app.getIpo();

                // 1. Create Portfolio Entry
                BigDecimal unitPrice = ipo.getPricePerShare();
                BigDecimal totalCost = unitPrice.multiply(new BigDecimal(allottedQty));

                CustomerPortfolio portfolio = CustomerPortfolio.builder()
                                .customer(customer)
                                .ipo(ipo)
                                .scripSymbol(ipo.getSymbol())
                                .quantity(allottedQty)
                                .purchasePrice(unitPrice)
                                .totalCost(totalCost)
                                .holdingSince(LocalDate.now())
                                .status("HELD")
                                .build();

                portfolioRepository.save(java.util.Objects.requireNonNull(portfolio));

                // 2. Ledger Entries for CASBA Charge
                if (customer.getBank() != null && Boolean.TRUE.equals(customer.getBank().getIsCasba())) {
                        BigDecimal casbaFee = new BigDecimal("5.00");

                        LedgerAccount customerAcc = ledgerService.getOrCreateAccount(
                                        customer.getFullName() + " - Ledger",
                                        LedgerAccountType.CUSTOMER_LEDGER,
                                        customer.getId());

                        LedgerAccount casbaIncomeAcc = ledgerService.getOrCreateAccount(
                                        "CASBA Charges",
                                        LedgerAccountType.FEE_INCOME,
                                        null);

                        ledgerService.recordTransaction(
                                        customerAcc,
                                        casbaIncomeAcc,
                                        casbaFee,
                                        String.format("CASBA Charge for IPO %s - Scrip %s", ipo.getCompanyName(),
                                                        ipo.getSymbol()),
                                        LedgerTransactionType.FEE,
                                        "CASBA-" + app.getId(),
                                        java.util.Objects.requireNonNull(checkerId));
                }

                app.setApplicationStatus(com.fintech.finpro.enums.ApplicationStatus.APPROVED);
                applicationRepository.save(java.util.Objects.requireNonNull(app));
        }

        /**
         * Admin Reversal Logic
         */
        @Transactional
        public void reverseAllotment(Long applicationId, Long adminId) {
                // Implementation for reversing ledger entries and removing portfolio entry
        }
}

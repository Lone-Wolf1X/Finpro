package com.fintech.finpro.service;

import com.fintech.finpro.entity.CustomerPortfolio;
import com.fintech.finpro.entity.CustomerBankAccount;
import com.fintech.finpro.entity.LedgerAccount;
import com.fintech.finpro.repository.CustomerPortfolioRepository;
import com.fintech.finpro.repository.CustomerBankAccountRepository;
import com.fintech.finpro.repository.IPORepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class SecondaryMarketService {

        private final CustomerPortfolioRepository portfolioRepository;
        private final CustomerBankAccountRepository bankAccountRepository;
        private final LedgerService ledgerService;
        private final IPORepository ipoRepository;

        @Transactional
        public void sellShares(Long customerId, Long portfolioId, Integer quantity, BigDecimal pricePerShare) {
                CustomerPortfolio portfolio = portfolioRepository
                                .findById(java.util.Objects.requireNonNull(portfolioId))
                                .orElseThrow(() -> new RuntimeException("Portfolio item not found"));

                if (!portfolio.getCustomer().getId().equals(customerId)) {
                        throw new RuntimeException("Unauthorized access to portfolio");
                }

                if (portfolio.getQuantity() < quantity) {
                        throw new RuntimeException("Insufficient shares to sell");
                }

                // Calculate Total Value
                BigDecimal totalValue = pricePerShare.multiply(BigDecimal.valueOf(quantity));

                // 1. Update Portfolio
                portfolio.setQuantity(portfolio.getQuantity() - quantity);
                if (portfolio.getQuantity() == 0) {
                        portfolio.setStatus("SOLD"); // or delete? Keep for history.
                }
                portfolioRepository.save(portfolio);

                // 2. Update Bank Account (Credit)
                CustomerBankAccount bankAccount = bankAccountRepository.findByCustomerIdAndIsPrimaryTrue(customerId)
                                .orElse(bankAccountRepository.findByCustomerId(customerId).stream().findFirst()
                                                .orElseThrow(() -> new RuntimeException(
                                                                "No bank account found for customer")));

                bankAccount.setBalance(bankAccount.getBalance().add(totalValue));
                bankAccountRepository.save(bankAccount);

                // 3. Ledger Entry: Broker/Market -> Customer
                LedgerAccount customerLedger = ledgerService.getOrCreateAccount(
                                portfolio.getCustomer().getFullName() + " - Ledger",
                                com.fintech.finpro.enums.LedgerAccountType.CUSTOMER_LEDGER,
                                customerId);

                LedgerAccount marketSettlementAcc = ledgerService.getOrCreateAccount(
                                "Market Settlement",
                                com.fintech.finpro.enums.LedgerAccountType.SUSPENSE,
                                null);

                ledgerService.recordTransaction(
                                marketSettlementAcc,
                                customerLedger,
                                totalValue,
                                "Sell Shares: " + portfolio.getScripSymbol() + " (" + quantity + " @ " + pricePerShare
                                                + ")",
                                com.fintech.finpro.enums.LedgerTransactionType.DEPOSIT,
                                null,
                                null,
                                bankAccount);
        }

        @Transactional
        public void buyShares(Long customerId, String symbol, Integer quantity, BigDecimal pricePerShare) {
                // 1. Calculate Total Cost
                BigDecimal totalCost = pricePerShare.multiply(BigDecimal.valueOf(quantity));

                // 2. Check & Update Bank Account (Debit)
                CustomerBankAccount bankAccount = bankAccountRepository.findByCustomerIdAndIsPrimaryTrue(customerId)
                                .orElse(bankAccountRepository.findByCustomerId(customerId).stream().findFirst()
                                                .orElseThrow(() -> new RuntimeException(
                                                                "No bank account found for customer")));

                if (bankAccount.getBalance().compareTo(totalCost) < 0) {
                        throw new RuntimeException("Insufficient funds in bank account");
                }

                bankAccount.setBalance(bankAccount.getBalance().subtract(totalCost));
                bankAccountRepository.save(bankAccount);

                // 3. Update Portfolio (Credit)
                java.util.List<CustomerPortfolio> portfolios = portfolioRepository.findByCustomerIdAndScripSymbol(
                                customerId,
                                symbol);
                CustomerPortfolio portfolio;

                if (portfolios.isEmpty()) {
                        // Find IPO by symbol if possible
                        com.fintech.finpro.entity.IPO ipo = ipoRepository.findBySymbol(symbol).orElse(null);

                        portfolio = CustomerPortfolio.builder()
                                        .customer(bankAccount.getCustomer())
                                        .ipo(ipo) // Set IPO if found
                                        .scripSymbol(symbol)
                                        .quantity(quantity)
                                        .purchasePrice(pricePerShare)
                                        .totalCost(totalCost)
                                        .holdingSince(java.time.LocalDate.now())
                                        .status("HELD")
                                        .isBonus(false)
                                        .build();
                } else {
                        portfolio = portfolios.get(0);
                        // Weighted Average Price
                        BigDecimal currentTotalCost = portfolio.getTotalCost();
                        BigDecimal newTotalCost = currentTotalCost.add(totalCost);
                        int newQuantity = portfolio.getQuantity() + quantity;

                        if (newQuantity > 0) {
                                BigDecimal newAvgPrice = newTotalCost.divide(BigDecimal.valueOf(newQuantity), 2,
                                                java.math.RoundingMode.HALF_UP);
                                portfolio.setPurchasePrice(newAvgPrice);
                        }
                        portfolio.setQuantity(newQuantity);
                        portfolio.setTotalCost(newTotalCost);
                        portfolio.setStatus("HELD"); // Ensure status is active
                }
                portfolioRepository.save(java.util.Objects.requireNonNull(portfolio));

                // 4. Ledger Entry: Customer -> Broker/Market
                LedgerAccount customerLedger = ledgerService.getOrCreateAccount(
                                bankAccount.getCustomer().getFullName() + " - Ledger",
                                com.fintech.finpro.enums.LedgerAccountType.CUSTOMER_LEDGER,
                                customerId);

                LedgerAccount marketSettlementAcc = ledgerService.getOrCreateAccount(
                                "Market Settlement",
                                com.fintech.finpro.enums.LedgerAccountType.SUSPENSE,
                                null);

                ledgerService.recordTransaction(
                                customerLedger,
                                marketSettlementAcc,
                                totalCost,
                                "Buy Shares: " + symbol + " (" + quantity + " @ " + pricePerShare + ")",
                                com.fintech.finpro.enums.LedgerTransactionType.WITHDRAWAL,
                                null,
                                null,
                                bankAccount);
        }
}

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
        private final ProfitSettlementService profitSettlementService;
        private final PortfolioTransactionService portfolioTransactionService;
        private final com.fintech.finpro.repository.PendingTransactionRepository pendingTransactionRepository;
        private final SellCalculationService sellCalcService;
        private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

        @Transactional
        public void sellShares(Long customerId, Long portfolioId, Integer quantity, BigDecimal pricePerShare,
                        Long makerId) {
                CustomerPortfolio portfolio = portfolioRepository
                                .findById(java.util.Objects.requireNonNull(portfolioId))
                                .orElseThrow(() -> new RuntimeException("Portfolio item not found"));

                if (!portfolio.getCustomer().getId().equals(customerId)) {
                        throw new RuntimeException("Unauthorized access to portfolio");
                }

                if (portfolio.getQuantity() < quantity) {
                        throw new RuntimeException("Insufficient shares to sell");
                }

                // Check for pending sell orders to prevent overselling
                java.util.List<com.fintech.finpro.entity.PendingTransaction> pendingSells = pendingTransactionRepository
                                .findByCustomer_IdAndStatusAndTransactionType(
                                                customerId, "PENDING", "SELL_SHARES");

                int pendingQuantity = 0;
                for (com.fintech.finpro.entity.PendingTransaction pt : pendingSells) {
                        try {
                                java.util.Map<String, Object> data = objectMapper.readValue(pt.getBulkData(),
                                                new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, Object>>() {
                                                });

                                Long pendingPortfolioId = Long.valueOf(data.get("portfolioId").toString());
                                if (pendingPortfolioId.equals(portfolioId)) {
                                        pendingQuantity += (Integer) data.get("quantity");
                                }
                        } catch (Exception e) {
                                // Ignore parse errors, just skip
                        }
                }

                if (portfolio.getQuantity() < (quantity + pendingQuantity)) {
                        throw new RuntimeException("Insufficient shares. You have " + portfolio.getQuantity() +
                                        " shares, but " + pendingQuantity
                                        + " are already locked in pending sell orders.");
                }

                // Calculate Fees Preview
                BigDecimal salesPrice = pricePerShare.multiply(BigDecimal.valueOf(quantity));
                com.fintech.finpro.entity.IPO ipo = ipoRepository.findBySymbol(portfolio.getScripSymbol()).orElse(null);
                com.fintech.finpro.enums.SecurityType secType = (ipo != null) ? ipo.getSecurityType()
                                : com.fintech.finpro.enums.SecurityType.EQUITY;

                BigDecimal commission;
                if (secType == com.fintech.finpro.enums.SecurityType.BOND) {
                        commission = sellCalcService.calculateBondCommission(salesPrice);
                } else if (secType == com.fintech.finpro.enums.SecurityType.MUTUAL_FUND) {
                        commission = sellCalcService.calculateMutualFundCommission(salesPrice);
                } else {
                        commission = sellCalcService.calculateEquityCommission(salesPrice);
                }

                BigDecimal sebonFee = sellCalcService.calculateSebonFee(salesPrice, secType);
                BigDecimal dpCharge = sellCalcService.getDpCharge();
                BigDecimal totalFees = commission.add(sebonFee).add(dpCharge);

                try {
                        java.util.Map<String, Object> tradeData = new java.util.HashMap<>();
                        tradeData.put("portfolioId", portfolioId);
                        tradeData.put("quantity", quantity);
                        tradeData.put("price", pricePerShare);

                        com.fintech.finpro.entity.PendingTransaction pending = com.fintech.finpro.entity.PendingTransaction
                                        .builder()
                                        .transactionType("SELL_SHARES")
                                        .amount(salesPrice)
                                        .customer(portfolio.getCustomer())
                                        .description(String.format("Sell %d units of %s @ %s. Fees: %s", quantity,
                                                        portfolio.getScripSymbol(), pricePerShare, totalFees))
                                        .createdByUserId(makerId)
                                        .status("PENDING")
                                        .bulkData(objectMapper.writeValueAsString(tradeData))
                                        .build();

                        pendingTransactionRepository.save(pending);
                } catch (Exception e) {
                        throw new RuntimeException("Failed to initiate sell trade: " + e.getMessage());
                }
        }

        @Transactional
        public void buyShares(Long customerId, String symbol, Integer quantity, BigDecimal pricePerShare,
                        Long makerId) {
                BigDecimal totalCost = pricePerShare.multiply(BigDecimal.valueOf(quantity));
                CustomerBankAccount bankAccount = bankAccountRepository.findByCustomerIdAndIsPrimaryTrue(customerId)
                                .orElse(bankAccountRepository.findByCustomerId(customerId).stream().findFirst()
                                                .orElseThrow(() -> new RuntimeException(
                                                                "No bank account found for customer")));

                if (bankAccount.getBalance().compareTo(totalCost) < 0) {
                        throw new RuntimeException("Insufficient funds in bank account");
                }

                try {
                        java.util.Map<String, Object> tradeData = new java.util.HashMap<>();
                        tradeData.put("symbol", symbol);
                        tradeData.put("quantity", quantity);
                        tradeData.put("price", pricePerShare);

                        com.fintech.finpro.entity.PendingTransaction pending = com.fintech.finpro.entity.PendingTransaction
                                        .builder()
                                        .transactionType("BUY_SHARES")
                                        .amount(totalCost)
                                        .customer(bankAccount.getCustomer())
                                        .account(bankAccount)
                                        .description(String.format("Buy %d units of %s @ %s", quantity, symbol,
                                                        pricePerShare))
                                        .createdByUserId(makerId)
                                        .status("PENDING")
                                        .bulkData(objectMapper.writeValueAsString(tradeData))
                                        .build();

                        pendingTransactionRepository.save(pending);
                } catch (Exception e) {
                        throw new RuntimeException("Failed to initiate buy trade: " + e.getMessage());
                }
        }

        @Transactional
        public void executeTradeSettlement(com.fintech.finpro.entity.PendingTransaction pending, Long checkerId) {
                try {
                        java.util.Map<String, Object> data = objectMapper.readValue(pending.getBulkData(),
                                        new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, Object>>() {
                                        });

                        if ("BUY_SHARES".equals(pending.getTransactionType())) {
                                String symbol = (String) data.get("symbol");
                                Integer quantity = (Integer) data.get("quantity");
                                BigDecimal price = new BigDecimal(data.get("price").toString());
                                executeBuySettlement(pending.getCustomer().getId(), symbol, quantity, price, checkerId);
                        } else if ("SELL_SHARES".equals(pending.getTransactionType())) {
                                Long portfolioId = Long.valueOf(data.get("portfolioId").toString());
                                Integer quantity = (Integer) data.get("quantity");
                                BigDecimal price = new BigDecimal(data.get("price").toString());
                                executeSellSettlement(pending.getCustomer().getId(), portfolioId, quantity, price,
                                                checkerId);
                        }
                } catch (Exception e) {
                        throw new RuntimeException("Trade settlement failed: " + e.getMessage());
                }
        }

        private void executeBuySettlement(Long customerId, String symbol, Integer quantity, BigDecimal pricePerShare,
                        Long checkerId) {
                // 1. Calculate Buy-side Fees to determine Total Cost for WACC
                BigDecimal transactionAmount = pricePerShare.multiply(BigDecimal.valueOf(quantity));

                com.fintech.finpro.entity.IPO ipo = ipoRepository.findBySymbol(symbol).orElse(null);
                com.fintech.finpro.enums.SecurityType secType = (ipo != null) ? ipo.getSecurityType()
                                : com.fintech.finpro.enums.SecurityType.EQUITY;

                BigDecimal commission;
                if (secType == com.fintech.finpro.enums.SecurityType.BOND) {
                        commission = sellCalcService.calculateBondCommission(transactionAmount);
                } else if (secType == com.fintech.finpro.enums.SecurityType.MUTUAL_FUND) {
                        commission = sellCalcService.calculateMutualFundCommission(transactionAmount);
                } else {
                        commission = sellCalcService.calculateEquityCommission(transactionAmount);
                }

                BigDecimal sebonFee = sellCalcService.calculateSebonFee(transactionAmount, secType);
                BigDecimal dpCharge = sellCalcService.getDpCharge();

                BigDecimal totalFees = commission.add(sebonFee).add(dpCharge);
                BigDecimal totalCostWithFees = transactionAmount.add(totalFees); // WACC Base

                // 2. Check Bank Balance (using just the transaction amount? Or total cost?
                // Usually total cost including fees is deducted)
                // Screenshot implies fees are separate? No, Buy Calculator usually shows "Total
                // Amount Payable".
                // Let's assume bank is deducted for (Price * Qty) + Fees

                CustomerBankAccount bankAccount = bankAccountRepository.findByCustomerIdAndIsPrimaryTrue(customerId)
                                .orElse(bankAccountRepository.findByCustomerId(customerId).stream().findFirst()
                                                .orElseThrow(() -> new RuntimeException("No bank account found")));

                if (bankAccount.getBalance().compareTo(totalCostWithFees) < 0) {
                        throw new RuntimeException("Insufficient funds including fees");
                }

                bankAccount.setBalance(bankAccount.getBalance().subtract(totalCostWithFees));
                bankAccountRepository.save(bankAccount);

                java.util.List<CustomerPortfolio> portfolios = portfolioRepository
                                .findByCustomerIdAndScripSymbol(customerId, symbol);
                CustomerPortfolio portfolio;

                if (portfolios.isEmpty()) {
                        portfolio = CustomerPortfolio.builder()
                                        .customer(bankAccount.getCustomer())
                                        .ipo(ipo)
                                        .scripSymbol(symbol)
                                        .quantity(quantity)
                                        .purchasePrice(totalCostWithFees.divide(BigDecimal.valueOf(quantity), 2,
                                                        java.math.RoundingMode.HALF_UP)) // WACC per share
                                        .totalCost(totalCostWithFees)
                                        .holdingSince(java.time.LocalDate.now())
                                        .status("HELD")
                                        .isBonus(false)
                                        .build();
                } else {
                        portfolio = portfolios.get(0);
                        BigDecimal newTotalCost = portfolio.getTotalCost().add(totalCostWithFees);
                        int newQuantity = portfolio.getQuantity() + quantity;
                        BigDecimal newAvgPrice = newTotalCost.divide(BigDecimal.valueOf(newQuantity), 2,
                                        java.math.RoundingMode.HALF_UP);

                        portfolio.setQuantity(newQuantity);
                        portfolio.setPurchasePrice(newAvgPrice);
                        portfolio.setTotalCost(newTotalCost);
                        portfolio.setStatus("HELD");
                }
                portfolioRepository.save(portfolio);

                recordBuyLedgersAndTx(bankAccount, symbol, quantity, pricePerShare, totalCostWithFees, checkerId);
        }

        private void executeSellSettlement(Long customerId, Long portfolioId, Integer quantity,
                        BigDecimal pricePerShare, Long checkerId) {
                CustomerPortfolio portfolio = portfolioRepository.findById(portfolioId).orElseThrow();
                BigDecimal totalSalesPrice = pricePerShare.multiply(BigDecimal.valueOf(quantity));

                portfolio.setQuantity(portfolio.getQuantity() - quantity);
                if (portfolio.getQuantity() == 0)
                        portfolio.setStatus("SOLD");
                portfolioRepository.save(portfolio);

                java.time.LocalDate buyDate = portfolio.getHoldingSince();
                if (buyDate == null) {
                        buyDate = java.time.LocalDate.now(); // Default to now if missing to prevent NPE
                }
                boolean isLongTerm = buyDate.plusYears(1).isBefore(java.time.LocalDate.now());

                // Ensure totalCost is not null for WACC calculation in settleShareSell
                if (portfolio.getTotalCost() == null) {
                        portfolio.setTotalCost(BigDecimal.ZERO);
                }

                profitSettlementService.settleShareSell(portfolio.getCustomer(), portfolio, totalSalesPrice, isLongTerm,
                                checkerId);

                portfolioTransactionService.recordTransaction(portfolio.getCustomer(), portfolio.getScripSymbol(),
                                "SELL", quantity, pricePerShare, null, "Sold " + quantity + " units",
                                "SELL-" + System.currentTimeMillis());
        }

        private void recordBuyLedgersAndTx(CustomerBankAccount bankAccount, String symbol, int quantity,
                        BigDecimal price, BigDecimal totalCost, Long checkerId) {
                LedgerAccount customerLedger = ledgerService.getOrCreateAccount(
                                bankAccount.getCustomer().getFullName() + " - Ledger",
                                com.fintech.finpro.enums.LedgerAccountType.CUSTOMER_LEDGER,
                                bankAccount.getCustomer().getId());
                LedgerAccount investedAcc = ledgerService.getOrCreateAccount("Invested Account",
                                com.fintech.finpro.enums.LedgerAccountType.INVESTED_ACCOUNT, null);

                ledgerService.recordTransaction(customerLedger, investedAcc, totalCost,
                                "Buy Shares: " + symbol + " (" + quantity + " @ " + price + ")",
                                com.fintech.finpro.enums.LedgerTransactionType.WITHDRAWAL, null, checkerId, null,
                                bankAccount);

                portfolioTransactionService.recordTransaction(bankAccount.getCustomer(), symbol, "BUY", quantity, price,
                                null, "Bought " + quantity + " units", "BUY-" + System.currentTimeMillis());
        }

        @Transactional
        public void updatePrice(Long ipoId, BigDecimal newPrice, Long adminId) {
                com.fintech.finpro.entity.IPO ipo = ipoRepository.findById(ipoId)
                                .orElseThrow(() -> new RuntimeException("IPO not found"));

                if (!com.fintech.finpro.enums.IPOStatus.LISTED.equals(ipo.getStatus())) {
                        throw new RuntimeException("IPO must be LISTED to update price");
                }

                BigDecimal lastClosingPrice = ipo.getLastClosingPrice();
                if (lastClosingPrice != null) {
                        BigDecimal lowerBound = lastClosingPrice.multiply(BigDecimal.valueOf(0.90));
                        BigDecimal upperBound = lastClosingPrice.multiply(BigDecimal.valueOf(1.10));

                        if (newPrice.compareTo(lowerBound) < 0 || newPrice.compareTo(upperBound) > 0) {
                                throw new RuntimeException("Price update rejected: New price " + newPrice +
                                                " is outside the 10% circuit breaker limit (" + lowerBound + " - "
                                                + upperBound + ")");
                        }
                } else {
                        // First time update after listing, set LCP if null
                        ipo.setLastClosingPrice(newPrice);
                }

                ipo.setCurrentPrice(newPrice);
                ipoRepository.save(ipo);
        }

        @Transactional
        public void listIPO(Long ipoId, BigDecimal listingPrice, Long adminId) {
                com.fintech.finpro.entity.IPO ipo = ipoRepository.findById(ipoId)
                                .orElseThrow(() -> new RuntimeException("IPO not found"));

                if (!com.fintech.finpro.enums.IPOStatus.ALLOTTED.equals(ipo.getStatus())) {
                        throw new RuntimeException("IPO must be ALLOTTED to be LISTED");
                }

                ipo.setStatus(com.fintech.finpro.enums.IPOStatus.LISTED);
                ipo.setListingDate(java.time.LocalDateTime.now());
                ipo.setCurrentPrice(listingPrice);
                ipo.setLastClosingPrice(listingPrice); // Initial LCP = Listing Price
                ipoRepository.save(ipo);

                // Activate all portfolios for this IPO? (Optional, might be handled elsewhere)
                // Here we just update the IPO status to allow trading.
        }

        @Transactional
        public void manualShareAdjustment(Long customerId, String symbol, Integer quantity, BigDecimal price,
                        String type, Long adminId) {
                // 1. Get/Create Portfolio
                java.util.List<CustomerPortfolio> portfolios = portfolioRepository.findByCustomerIdAndScripSymbol(
                                customerId,
                                symbol);
                CustomerPortfolio portfolio;

                if (portfolios.isEmpty()) {
                        if ("DEBIT".equalsIgnoreCase(type)) {
                                throw new RuntimeException("Cannot debit: Customer does not own shares of " + symbol);
                        }

                        // Fetch customer to ensure they exist and get full object
                        CustomerBankAccount dummyAccount = bankAccountRepository.findByCustomerId(customerId)
                                        .stream().findFirst()
                                        .orElseThrow(() -> new RuntimeException("Customer bank account not found"));
                        com.fintech.finpro.entity.Customer customer = dummyAccount.getCustomer();

                        com.fintech.finpro.entity.IPO ipo = ipoRepository.findBySymbol(symbol).orElse(null);

                        portfolio = CustomerPortfolio.builder()
                                        .customer(customer)
                                        .ipo(ipo)
                                        .scripSymbol(symbol)
                                        .quantity(quantity)
                                        .purchasePrice(price)
                                        .totalCost(price.multiply(BigDecimal.valueOf(quantity)))
                                        .holdingSince(java.time.LocalDate.now())
                                        .status("HELD")
                                        .build();

                } else {
                        portfolio = portfolios.get(0);
                        if ("CREDIT".equalsIgnoreCase(type)) {
                                portfolio.setQuantity(portfolio.getQuantity() + quantity);
                                portfolio.setTotalCost(portfolio.getTotalCost()
                                                .add(price.multiply(BigDecimal.valueOf(quantity))));
                                portfolio.setStatus("HELD");
                        } else {
                                if (portfolio.getQuantity() < quantity) {
                                        throw new RuntimeException("Insufficient shares to debit");
                                }
                                portfolio.setQuantity(portfolio.getQuantity() - quantity);
                                if (portfolio.getQuantity() == 0) {
                                        portfolio.setStatus("SOLD");
                                }
                        }
                }
                portfolioRepository.save(portfolio);

                // 2. Record Portfolio Transaction (ADJUSTMENT)
                portfolioTransactionService.recordTransaction(
                                portfolio.getCustomer(),
                                symbol,
                                type,
                                quantity,
                                price,
                                BigDecimal.ZERO,
                                "Manual adjustment: " + type + " (" + quantity + " @ " + price + ")",
                                "ADJ-" + System.currentTimeMillis());
        }

        @Transactional
        public void resetSellTransactions(Long adminId) {
                // 1. Fetch all SELL transactions
                java.util.List<com.fintech.finpro.entity.PortfolioTransaction> sellTransactions = portfolioTransactionService
                                .getTransactionsByType("SELL");

                for (com.fintech.finpro.entity.PortfolioTransaction tx : sellTransactions) {
                        // 2. Restore Portfolio Quantity
                        CustomerPortfolio portfolio = portfolioRepository.findByCustomerIdAndScripSymbol(
                                        tx.getCustomer().getId(), tx.getScripSymbol()).stream().findFirst()
                                        .orElse(null);

                        if (portfolio != null) {
                                portfolio.setQuantity(portfolio.getQuantity() + tx.getQuantity());
                                if ("SOLD".equals(portfolio.getStatus())) {
                                        portfolio.setStatus("HELD");
                                }
                                portfolioRepository.save(portfolio);
                        }

                        // 3. Delete Portfolio Transaction
                        portfolioTransactionService.deleteTransaction(tx);
                }

                // 4. Delete Ledger Transactions (using Reference ID patterns)
                // Patterns from ProfitSettlementService:
                // "SELL-IN-" + portfolioId
                // "NET-REC-" + portfolioId
                // "FEE-" + portfolioId
                // "CGT-" + portfolioId
                // "ADM-SHARE-" + portfolioId
                // "SUB-DED-" + portfolioId
                // "AMC-DED-" + portfolioId

                // We need to access LedgerTransactionRepository to delete by prefix.
                // Since it's inside LedgerService, and LedgerService might not expose it,
                // we should check if we can add a method to LedgerService or use the repository
                // if available.
                // In this file 'ledgerService' is available. Let's check if we can add a method
                // there.
                // Or better, just autowire LedgerTransactionRepository here temporarily or
                // permanently.
                // Let's assume we can add the method to LedgerService.

                ledgerService.deleteTransactionsByReferenceIdPrefix("SELL-IN-");
                ledgerService.deleteTransactionsByReferenceIdPrefix("NET-REC-");
                ledgerService.deleteTransactionsByReferenceIdPrefix("FEE-");
                ledgerService.deleteTransactionsByReferenceIdPrefix("CGT-");
                ledgerService.deleteTransactionsByReferenceIdPrefix("ADM-SHARE-");
                ledgerService.deleteTransactionsByReferenceIdPrefix("SUB-DED-");
                ledgerService.deleteTransactionsByReferenceIdPrefix("AMC-DED-");
        }
}

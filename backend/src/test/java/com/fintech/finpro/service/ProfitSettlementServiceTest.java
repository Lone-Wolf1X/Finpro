package com.fintech.finpro.service;

import com.fintech.finpro.entity.Customer;
import com.fintech.finpro.entity.CustomerBankAccount;
import com.fintech.finpro.entity.CustomerPortfolio;
import com.fintech.finpro.entity.LedgerAccount;
import com.fintech.finpro.enums.LedgerTransactionType;
import com.fintech.finpro.repository.CustomerBankAccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ProfitSettlementServiceTest {

        @Mock
        private LedgerService ledgerService;

        @Mock
        private SellCalculationService sellCalcService;

        @Mock
        private CustomerBankAccountRepository bankAccountRepository;

        @InjectMocks
        private ProfitSettlementService profitSettlementService;

        @BeforeEach
        void setUp() {
                MockitoAnnotations.openMocks(this);
        }

        @Test
        void testSettleShareSell_NetReceivableFlow() {
                // Setup Data
                Customer customer = new Customer();
                customer.setId(1L);
                customer.setFirstName("Test");
                customer.setLastName("Customer");

                CustomerPortfolio portfolio = new CustomerPortfolio();
                portfolio.setId(100L);
                portfolio.setScripSymbol("TEST");
                portfolio.setTotalCost(new BigDecimal("8000.00")); // Principal

                BigDecimal salesPrice = new BigDecimal("10000.00");
                boolean isLongTerm = true;
                Long makerId = 999L;

                // Mock Calculation Service
                when(sellCalcService.calculateEquityCommission(any())).thenReturn(new BigDecimal("50.00"));
                when(sellCalcService.calculateSebonFee(any(), any())).thenReturn(new BigDecimal("1.50"));
                when(sellCalcService.getDpCharge()).thenReturn(new BigDecimal("25.00"));

                // Net Realizable = 10000 - (50 + 1.5 + 25) = 10000 - 76.5 = 9923.5
                // Profit = 9923.5 - 8000 = 1923.5

                when(sellCalcService.calculateCGT(any(), eq(true), eq(true))).thenReturn(new BigDecimal("96.18")); // Approx
                                                                                                                   // 5%
                                                                                                                   // of
                                                                                                                   // 1923.5

                // Mock Ledger Service Account Creation
                when(ledgerService.getOrCreateAccount(anyString(), any(), any())).thenReturn(new LedgerAccount());

                // Mock Bank Account
                when(bankAccountRepository.findByCustomerIdAndIsPrimaryTrue(anyLong()))
                                .thenReturn(Optional.of(new CustomerBankAccount()));

                // Execute
                profitSettlementService.settleShareSell(customer, portfolio, salesPrice, isLongTerm, makerId);

                // Verify "Net Receivable" Flow

                // 1. Office Cash -> Share Settlement (Sales Price: 10000)
                verify(ledgerService).recordTransaction(
                                any(LedgerAccount.class), // Office
                                any(LedgerAccount.class), // Share Settlement
                                eq(new BigDecimal("10000.00")),
                                contains("Sale Proceeds"),
                                eq(LedgerTransactionType.SETTLEMENT),
                                eq("SELL-IN-100"),
                                eq(makerId),
                                isNull(),
                                isNull());

                // 2. Share Settlement -> Broker (Fees: 76.5)
                verify(ledgerService).recordTransaction(
                                any(LedgerAccount.class), // Share Settlement
                                any(LedgerAccount.class), // Broker
                                eq(new BigDecimal("76.50")),
                                contains("Broker/NEPSE Fees"),
                                eq(LedgerTransactionType.FEE),
                                eq("FEE-100"),
                                eq(makerId),
                                isNull(),
                                isNull());

                // 3. Share Settlement -> Tax (CGT: 96.18)
                verify(ledgerService).recordTransaction(
                                any(LedgerAccount.class), // Share Settlement
                                any(LedgerAccount.class), // Tax
                                eq(new BigDecimal("96.18")),
                                contains("CGT"),
                                eq(LedgerTransactionType.FEE),
                                eq("CGT-100"),
                                eq(makerId),
                                isNull(),
                                isNull());

                // 4. Share Settlement -> Customer (Net Receivable: 10000 - 76.5 - 96.18 =
                // 9827.32)
                verify(ledgerService).recordTransaction(
                                any(LedgerAccount.class), // Share Settlement
                                any(LedgerAccount.class), // Customer
                                eq(new BigDecimal("9827.32")),
                                contains("Net Receivable"),
                                eq(LedgerTransactionType.SETTLEMENT),
                                eq("NET-REC-100"),
                                eq(makerId),
                                eq("Net Receivable"),
                                any(CustomerBankAccount.class));

                // 5. Customer -> Admin Profit (Admin Share)
                // Profit = 1923.5. Divisible = 1923.5 - 96.18 = 1827.32. Admin Share (60%) =
                // 1096.39
                verify(ledgerService).recordTransaction(
                                any(LedgerAccount.class), // Customer
                                any(LedgerAccount.class), // Admin
                                eq(new BigDecimal("1096.39")),
                                contains("Admin Profit Share"),
                                eq(LedgerTransactionType.FEE),
                                eq("ADM-SHARE-100"),
                                eq(makerId),
                                eq("Admin Profit Deduction"),
                                any(CustomerBankAccount.class));
        }
}

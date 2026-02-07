package com.fintech.finpro.service;

import com.fintech.finpro.entity.*;
import com.fintech.finpro.enums.LedgerAccountType;
import com.fintech.finpro.enums.LedgerTransactionType;
import com.fintech.finpro.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class TransactionService {

        private final LedgerService ledgerService;
        private final CustomerRepository customerRepository;

        /**
         * Deposit funds to a customer's ledger account.
         * Logic: If Investor assigned -> Debit Investor, else -> Debit Core Capital.
         */
        @Transactional
        public void depositToCustomer(Long customerId, BigDecimal amount, String remarks, Long makerId,
                        com.fintech.finpro.entity.CustomerBankAccount bankAccount) {
                Customer customer = customerRepository.findById(java.util.Objects.requireNonNull(customerId))
                                .orElseThrow(() -> new RuntimeException("Customer not found"));

                // Get or Create Customer Ledger Account
                LedgerAccount customerAcc = ledgerService.getOrCreateAccount(
                                customer.getFullName() + " - Ledger",
                                LedgerAccountType.CUSTOMER_LEDGER,
                                customer.getId());

                LedgerAccount sourceAcc;
                String sourceParticulars;

                if (customer.getInvestor() != null) {
                        // Debit Investor Account
                        Investor investor = customer.getInvestor();
                        sourceAcc = ledgerService.getOrCreateAccount(
                                        investor.getUser().getFullName() + " - Investment Ledger",
                                        LedgerAccountType.INVESTOR_LEDGER,
                                        investor.getId());

                        sourceParticulars = String.format("Investment for %s (%s): %s",
                                        customer.getFullName(), customer.getBank().getName(), remarks);
                } else {
                        // Debit Core Capital
                        sourceAcc = ledgerService.getOrCreateAccount(
                                        "Core Capital",
                                        LedgerAccountType.CORE_CAPITAL,
                                        null);

                        sourceParticulars = String.format("Core Capital Deposit for %s (%s): %s",
                                        customer.getFullName(), customer.getBank().getName(), remarks);
                }

                // Run Double Entry: Debit Source -> Credit Customer
                ledgerService.recordTransaction(
                                sourceAcc,
                                customerAcc,
                                amount,
                                sourceParticulars,
                                LedgerTransactionType.DEPOSIT,
                                null,
                                makerId,
                                bankAccount);
        }

        /**
         * Backward compatibility
         */
        @Transactional
        public void depositToCustomer(Long customerId, BigDecimal amount, String remarks, Long makerId) {
                depositToCustomer(customerId, amount, remarks, makerId, null);
        }

        /**
         * Withdrawal from a customer's ledger account.
         * Logic: Debit Customer -> Credit Source (Investor or Core).
         */
        @Transactional
        public void withdrawalFromCustomer(Long customerId, BigDecimal amount, String remarks, Long makerId,
                        com.fintech.finpro.entity.CustomerBankAccount bankAccount) {
                Customer customer = customerRepository.findById(java.util.Objects.requireNonNull(customerId))
                                .orElseThrow(() -> new RuntimeException("Customer not found"));

                LedgerAccount customerAcc = ledgerService.getOrCreateAccount(
                                customer.getFullName() + " - Ledger",
                                LedgerAccountType.CUSTOMER_LEDGER,
                                customer.getId());

                if (customerAcc.getBalance().compareTo(amount) < 0) {
                        throw new RuntimeException("Insufficient balance in customer ledger");
                }

                LedgerAccount destinationAcc;
                String destinationParticulars;

                if (customer.getInvestor() != null) {
                        Investor investor = customer.getInvestor();
                        destinationAcc = ledgerService.getOrCreateAccount(
                                        investor.getUser().getFullName() + " - Investment Ledger",
                                        LedgerAccountType.INVESTOR_LEDGER,
                                        investor.getId());

                        destinationParticulars = String.format("Investment Recovery from %s: %s",
                                        customer.getFullName(), remarks);
                } else {
                        destinationAcc = ledgerService.getOrCreateAccount(
                                        "Core Capital",
                                        LedgerAccountType.CORE_CAPITAL,
                                        null);

                        destinationParticulars = String.format("Capital Recovery from %s: %s",
                                        customer.getFullName(), remarks);
                }

                // Run Double Entry: Debit Customer -> Credit Source
                ledgerService.recordTransaction(
                                customerAcc,
                                destinationAcc,
                                amount,
                                destinationParticulars,
                                LedgerTransactionType.WITHDRAWAL,
                                null,
                                makerId,
                                bankAccount);
        }

        @Transactional
        public void withdrawalFromCustomer(Long customerId, BigDecimal amount, String remarks, Long makerId) {
                withdrawalFromCustomer(customerId, amount, remarks, makerId, null);
        }
}

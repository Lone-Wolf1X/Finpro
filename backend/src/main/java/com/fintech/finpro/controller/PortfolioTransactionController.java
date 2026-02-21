package com.fintech.finpro.controller;

import com.fintech.finpro.entity.Customer;
import com.fintech.finpro.entity.PortfolioTransaction;
import com.fintech.finpro.service.CustomerService;
import com.fintech.finpro.service.PortfolioTransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/portfolio/transactions")
@RequiredArgsConstructor
public class PortfolioTransactionController {

    private final PortfolioTransactionService transactionService;
    private final CustomerService customerService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<PortfolioTransaction>> getMyTransactions() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        Customer customer = customerService.getCustomerByEmail(email);

        if (customer == null) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(transactionService.getCustomerTransactions(customer.getId()));
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN', 'CHECKER', 'MAKER')")
    public ResponseEntity<List<PortfolioTransaction>> getCustomerTransactions(
            @org.springframework.web.bind.annotation.PathVariable Long customerId) {
        return ResponseEntity.ok(transactionService.getCustomerTransactions(customerId));
    }
}

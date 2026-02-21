package com.fintech.finpro.controller;

import com.fintech.finpro.dto.CustomerPortfolioDTO;
import com.fintech.finpro.service.PortfolioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/portfolios")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PortfolioController {

    private final PortfolioService portfolioService;

    @GetMapping("/customer/{customerId}")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CustomerPortfolioDTO>> getCustomerPortfolio(@PathVariable Long customerId) {
        List<CustomerPortfolioDTO> portfolios = portfolioService.getCustomerPortfolio(customerId);
        return ResponseEntity.ok(portfolios);
    }
}

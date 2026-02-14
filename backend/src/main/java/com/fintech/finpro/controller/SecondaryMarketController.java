package com.fintech.finpro.controller;

import com.fintech.finpro.service.SecondaryMarketService;
import com.fintech.finpro.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/secondary-market")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SecondaryMarketController {

    private final SecondaryMarketService secondaryMarketService;
    private final JwtService jwtService;

    @PostMapping("/sell")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<String> sellShares(
            @RequestHeader("Authorization") String token,
            @RequestParam Long portfolioId,
            @RequestParam Integer quantity,
            @RequestParam BigDecimal price) {

        // Ensure the user is selling their own shares
        Long customerId = jwtService.extractUserId(token.substring(7));

        secondaryMarketService.sellShares(customerId, portfolioId, quantity, price);
        return ResponseEntity.ok("Shares sold successfully. Funds credited to your primary bank account.");
    }

    @PostMapping("/buy")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<String> buyShares(
            @RequestHeader("Authorization") String token,
            @RequestParam String symbol,
            @RequestParam Integer quantity,
            @RequestParam BigDecimal price) {

        Long customerId = jwtService.extractUserId(token.substring(7));

        secondaryMarketService.buyShares(customerId, symbol, quantity, price);
        return ResponseEntity.ok("Shares purchased successfully. Portfolio updated.");
    }
}

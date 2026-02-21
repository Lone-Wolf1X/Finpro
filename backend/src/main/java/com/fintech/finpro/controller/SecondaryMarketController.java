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

        secondaryMarketService.sellShares(customerId, portfolioId, quantity, price, customerId);
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

        secondaryMarketService.buyShares(customerId, symbol, quantity, price, customerId);

        return ResponseEntity.ok("Shares purchased successfully. Portfolio updated.");
    }

    @PostMapping("/admin/update-price")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<String> updatePrice(
            @RequestHeader("Authorization") String token,
            @RequestParam Long ipoId,
            @RequestParam BigDecimal newPrice) {

        Long adminId = jwtService.extractUserId(token.substring(7));
        secondaryMarketService.updatePrice(ipoId, newPrice, adminId);
        return ResponseEntity.ok("Stock price updated successfully.");
    }

    @PostMapping("/admin/list-ipo")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<String> listIPO(
            @RequestHeader("Authorization") String token,
            @RequestParam Long ipoId,
            @RequestParam BigDecimal listingPrice) {

        Long adminId = jwtService.extractUserId(token.substring(7));
        secondaryMarketService.listIPO(ipoId, listingPrice, adminId);
        return ResponseEntity.ok("IPO listed on secondary market successfully.");
    }

    @PostMapping("/admin/buy")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<String> buyOnBehalf(
            @RequestHeader("Authorization") String token,
            @RequestParam Long customerId,
            @RequestParam String symbol,
            @RequestParam Integer quantity,
            @RequestParam BigDecimal price) {

        Long makerId = jwtService.extractUserId(token.substring(7));
        secondaryMarketService.buyShares(customerId, symbol, quantity, price, makerId);

        return ResponseEntity.ok("Buy order processed for customer.");
    }

    @PostMapping("/admin/sell")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<String> sellOnBehalf(
            @RequestHeader("Authorization") String token,
            @RequestParam Long customerId,
            @RequestParam Long portfolioId,
            @RequestParam Integer quantity,
            @RequestParam BigDecimal price) {

        Long makerId = jwtService.extractUserId(token.substring(7));
        secondaryMarketService.sellShares(customerId, portfolioId, quantity, price, makerId);
        return ResponseEntity.ok("Sell order processed for customer.");
    }

    @PostMapping("/admin/manual-adjustment")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MAKER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<String> manualAdjustment(
            @RequestHeader("Authorization") String token,
            @RequestParam Long customerId,
            @RequestParam String symbol,
            @RequestParam Integer quantity,
            @RequestParam BigDecimal price,
            @RequestParam String type) {

        Long adminId = jwtService.extractUserId(token.substring(7));
        secondaryMarketService.manualShareAdjustment(customerId, symbol, quantity, price, type, adminId);
        return ResponseEntity.ok("Manual adjustment successful.");
    }

    @PostMapping("/admin/reset-sells")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<String> resetSellTransactions(
            @RequestHeader("Authorization") String token) {

        Long adminId = jwtService.extractUserId(token.substring(7));
        secondaryMarketService.resetSellTransactions(adminId);
        return ResponseEntity.ok("All sell transactions have been reset and portfolios restored.");
    }
}

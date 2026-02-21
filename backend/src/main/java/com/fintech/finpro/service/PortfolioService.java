package com.fintech.finpro.service;

import com.fintech.finpro.dto.CustomerPortfolioDTO;
import com.fintech.finpro.entity.CustomerPortfolio;
import com.fintech.finpro.repository.CustomerPortfolioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PortfolioService {

    private final CustomerPortfolioRepository portfolioRepository;

    @Transactional(readOnly = true)
    public List<CustomerPortfolioDTO> getCustomerPortfolio(Long customerId) {
        List<CustomerPortfolio> portfolios = portfolioRepository.findByCustomerId(customerId);
        return portfolios.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private CustomerPortfolioDTO mapToDTO(CustomerPortfolio portfolio) {
        // Determine Current Price (LTP)
        BigDecimal currentPrice = (portfolio.getIpo() != null && portfolio.getIpo().getCurrentPrice() != null)
                ? portfolio.getIpo().getCurrentPrice()
                : portfolio.getPurchasePrice();

        // Determine Last Closing Price (LCP)
        BigDecimal lastClosingPrice = (portfolio.getIpo() != null && portfolio.getIpo().getLastClosingPrice() != null)
                ? portfolio.getIpo().getLastClosingPrice()
                : currentPrice; // Fallback

        // Calculate Values
        BigDecimal currentValue = currentPrice.multiply(new BigDecimal(portfolio.getQuantity()));
        BigDecimal valueAsOfLastClosingPrice = lastClosingPrice.multiply(new BigDecimal(portfolio.getQuantity()));
        BigDecimal profitLoss = currentValue.subtract(portfolio.getTotalCost());

        return CustomerPortfolioDTO.builder()
                .id(portfolio.getId())
                .customerId(portfolio.getCustomer().getId())
                .customerName(portfolio.getCustomer().getFullName())
                .ipoId(portfolio.getIpo() != null ? portfolio.getIpo().getId() : null)
                .ipoCompanyName(portfolio.getIpo() != null ? portfolio.getIpo().getCompanyName() : null)
                .scripSymbol(portfolio.getScripSymbol())
                .quantity(portfolio.getQuantity())
                .purchasePrice(portfolio.getPurchasePrice())
                .totalCost(portfolio.getTotalCost())
                .holdingSince(portfolio.getHoldingSince())
                .status(portfolio.getStatus())
                .isBonus(portfolio.getIsBonus())
                .currentPrice(currentPrice)
                .currentValue(currentValue)
                .lastClosingPrice(lastClosingPrice)
                .valueAsOfLastClosingPrice(valueAsOfLastClosingPrice)
                .profitLoss(profitLoss)
                .build();
    }
}

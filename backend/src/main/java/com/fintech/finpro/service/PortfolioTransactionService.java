package com.fintech.finpro.service;

import com.fintech.finpro.entity.Customer;
import com.fintech.finpro.entity.PortfolioTransaction;
import com.fintech.finpro.repository.PortfolioTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PortfolioTransactionService {

    private final PortfolioTransactionRepository repository;

    @Transactional
    public void recordTransaction(
            Customer customer,
            String scripSymbol,
            String type,
            Integer quantity,
            BigDecimal price,
            BigDecimal fee,
            String remarks,
            String referenceId) {

        BigDecimal total = price.multiply(BigDecimal.valueOf(quantity));

        PortfolioTransaction transaction = PortfolioTransaction.builder()
                .customer(customer)
                .scripSymbol(scripSymbol)
                .transactionType(type)
                .quantity(quantity)
                .pricePerShare(price)
                .totalAmount(total)
                .transactionFee(fee != null ? fee : BigDecimal.ZERO)
                .remarks(remarks)
                .referenceId(referenceId)
                .build();

        repository.save(transaction);
    }

    public List<PortfolioTransaction> getCustomerTransactions(Long customerId) {
        return repository.findByCustomerIdOrderByTransactionDateDesc(customerId);
    }

    public List<PortfolioTransaction> getTransactionsByType(String type) {
        return repository.findByTransactionType(type);
    }

    public void deleteTransaction(PortfolioTransaction transaction) {
        repository.delete(transaction);
    }
}

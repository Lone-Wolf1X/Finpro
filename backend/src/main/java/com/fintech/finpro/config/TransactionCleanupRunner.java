package com.fintech.finpro.config;

import com.fintech.finpro.repository.PendingTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TransactionCleanupRunner implements CommandLineRunner {

    private final PendingTransactionRepository pendingTransactionRepository;

    @Override
    public void run(String... args) throws Exception {
        Long stuckTransactionId = 9L;
        if (pendingTransactionRepository.existsById(stuckTransactionId)) {
            System.out.println("Cleaning up stuck transaction ID: " + stuckTransactionId);
            pendingTransactionRepository.deleteById(stuckTransactionId);
            System.out.println("Stuck transaction deleted successfully.");
        } else {
            System.out.println("Stuck transaction ID " + stuckTransactionId + " not found (already cleaned).");
        }
    }
}

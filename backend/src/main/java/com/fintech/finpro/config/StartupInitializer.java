package com.fintech.finpro.config;

import com.fintech.finpro.service.LedgerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class StartupInitializer implements CommandLineRunner {

    private final LedgerService ledgerService;

    @Override
    public void run(String... args) throws Exception {
        log.info("Initializing system ledger accounts...");
        ledgerService.initializeSystemAccounts();
        log.info("System ledger accounts initialized.");
    }
}

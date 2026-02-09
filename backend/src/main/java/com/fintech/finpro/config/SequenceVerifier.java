package com.fintech.finpro.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class SequenceVerifier implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            log.info("Verifying transaction_id_seq...");
            Long nextVal = jdbcTemplate.queryForObject("SELECT nextval('transaction_id_seq')", Long.class);
            log.info("Sequence transaction_id_seq exists. Next val: {}", nextVal);
        } catch (Exception e) {
            log.error("FAILED to query transaction_id_seq: {}", e.getMessage());
        }
    }
}

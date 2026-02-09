package com.fintech.finpro;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
@org.springframework.scheduling.annotation.EnableScheduling
public class FinproBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(FinproBackendApplication.class, args);
        System.out.println("\n" +
                "╔═══════════════════════════════════════════════════════════╗\n" +
                "║                                                           ║\n" +
                "║   Finpro Backend API is running!                          ║\n" +
                "║                                                           ║\n" +
                "║   🚀 Server: http://localhost:8080/api                    ║\n" +
                "║   📚 Swagger: http://localhost:8080/api/swagger-ui.html   ║\n" +
                "║   🗄️  Database: PostgreSQL (fintech_saas)                 ║\n" +
                "║                                                           ║\n" +
                "╚═══════════════════════════════════════════════════════════╝\n");
    }
}

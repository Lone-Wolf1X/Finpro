package com.fintech.finpro.entity;

import com.fintech.finpro.enums.LedgerAccountType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "ledger_accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LedgerAccount extends com.fintech.finpro.entity.BaseEntity {

    @Column(name = "account_name", nullable = false)
    private String accountName;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", nullable = false)
    private LedgerAccountType accountType;

    @Column(name = "owner_id")
    private Long ownerId;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(length = 10)
    @Builder.Default
    private String currency = "NPR";

    @Column(length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    public String getAccountName() {
        return this.accountName;
    }
}

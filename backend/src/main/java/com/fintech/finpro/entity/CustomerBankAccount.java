package com.fintech.finpro.entity;

import com.fintech.finpro.enums.AccountType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "customer_bank_accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerBankAccount extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_id")
    private Bank bank;

    @Column(name = "bank_name", nullable = false, length = 100)
    private String bankName;

    @Column(name = "account_number", nullable = false, length = 50)
    private String accountNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", length = 20)
    @Builder.Default
    private AccountType accountType = AccountType.SAVINGS;

    @Column(name = "ifsc_code", length = 20)
    private String ifscCode;

    @Column(name = "branch_name", length = 100)
    private String branchName;

    @Column(name = "is_primary")
    @Builder.Default
    private Boolean isPrimary = false;

    @Column(length = 20)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, CLOSED

    /**
     * Get account display name
     */
    public String getAccountDisplayName() {
        return bankName + " - " + accountNumber;
    }
}

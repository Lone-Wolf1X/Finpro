package com.fintech.finpro.entity;

import com.fintech.finpro.enums.LedgerTransactionType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "ledger_transactions")
@NoArgsConstructor
@AllArgsConstructor
public class LedgerTransaction extends com.fintech.finpro.entity.BaseEntity {

    public static LedgerTransactionBuilder builder() {
        return new LedgerTransactionBuilder();
    }

    public static class LedgerTransactionBuilder {
        private LedgerAccount debitAccount;
        private LedgerAccount creditAccount;
        private BigDecimal amount;
        private String particulars;
        private String remarks;
        private LedgerTransactionType transactionType;
        private String referenceId;
        private Long makerId;
        private Long checkerId;
        private String status = "PENDING";
        private Customer customer;
        private CustomerBankAccount customerBankAccount;
        private SystemAccount ledgerAccount;
        private Investor investor;
        private String referenceType;
        private Long referenceIdLong;
        private Boolean isDualEntry = false;
        private BigDecimal debitBalanceAfter;
        private BigDecimal creditBalanceAfter;

        public LedgerTransactionBuilder debitAccount(LedgerAccount debitAccount) {
            this.debitAccount = debitAccount;
            return this;
        }

        public LedgerTransactionBuilder creditAccount(LedgerAccount creditAccount) {
            this.creditAccount = creditAccount;
            return this;
        }

        public LedgerTransactionBuilder amount(BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        public LedgerTransactionBuilder particulars(String particulars) {
            this.particulars = particulars;
            return this;
        }

        public LedgerTransactionBuilder remarks(String remarks) {
            this.remarks = remarks;
            return this;
        }

        public LedgerTransactionBuilder transactionType(LedgerTransactionType transactionType) {
            this.transactionType = transactionType;
            return this;
        }

        public LedgerTransactionBuilder referenceId(String referenceId) {
            this.referenceId = referenceId;
            return this;
        }

        public LedgerTransactionBuilder makerId(Long makerId) {
            this.makerId = makerId;
            return this;
        }

        public LedgerTransactionBuilder checkerId(Long checkerId) {
            this.checkerId = checkerId;
            return this;
        }

        public LedgerTransactionBuilder status(String status) {
            this.status = status;
            return this;
        }

        public LedgerTransactionBuilder customer(Customer customer) {
            this.customer = customer;
            return this;
        }

        public LedgerTransactionBuilder customerBankAccount(CustomerBankAccount customerBankAccount) {
            this.customerBankAccount = customerBankAccount;
            return this;
        }

        public LedgerTransactionBuilder ledgerAccount(SystemAccount ledgerAccount) {
            this.ledgerAccount = ledgerAccount;
            return this;
        }

        public LedgerTransactionBuilder investor(Investor investor) {
            this.investor = investor;
            return this;
        }

        public LedgerTransactionBuilder referenceType(String referenceType) {
            this.referenceType = referenceType;
            return this;
        }

        public LedgerTransactionBuilder referenceIdLong(Long referenceIdLong) {
            this.referenceIdLong = referenceIdLong;
            return this;
        }

        public LedgerTransactionBuilder isDualEntry(Boolean isDualEntry) {
            this.isDualEntry = isDualEntry;
            return this;
        }

        public LedgerTransactionBuilder debitBalanceAfter(BigDecimal debitBalanceAfter) {
            this.debitBalanceAfter = debitBalanceAfter;
            return this;
        }

        public LedgerTransactionBuilder creditBalanceAfter(BigDecimal creditBalanceAfter) {
            this.creditBalanceAfter = creditBalanceAfter;
            return this;
        }

        public LedgerTransaction build() {
            LedgerTransaction transaction = new LedgerTransaction();
            transaction.setDebitAccount(debitAccount);
            transaction.setCreditAccount(creditAccount);
            transaction.setAmount(amount);
            transaction.setParticulars(particulars);
            transaction.setRemarks(remarks);
            transaction.setTransactionType(transactionType);
            transaction.setReferenceId(referenceId);
            transaction.setMakerId(makerId);
            transaction.setCheckerId(checkerId);
            transaction.setStatus(status);
            transaction.setCustomer(customer);
            transaction.setCustomerBankAccount(customerBankAccount);
            transaction.setLedgerAccount(ledgerAccount);
            transaction.setInvestor(investor);
            transaction.setReferenceType(referenceType);
            transaction.setReferenceIdLong(referenceIdLong);
            transaction.setIsDualEntry(isDualEntry);
            transaction.setDebitBalanceAfter(debitBalanceAfter);
            transaction.setCreditBalanceAfter(creditBalanceAfter);
            return transaction;
        }
    }

    public LedgerAccount getDebitAccount() {
        return debitAccount;
    }

    public void setDebitAccount(LedgerAccount debitAccount) {
        this.debitAccount = debitAccount;
    }

    public LedgerAccount getCreditAccount() {
        return creditAccount;
    }

    public void setCreditAccount(LedgerAccount creditAccount) {
        this.creditAccount = creditAccount;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getParticulars() {
        return particulars;
    }

    public void setParticulars(String particulars) {
        this.particulars = particulars;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public LedgerTransactionType getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(LedgerTransactionType transactionType) {
        this.transactionType = transactionType;
    }

    public String getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(String referenceId) {
        this.referenceId = referenceId;
    }

    public Long getMakerId() {
        return makerId;
    }

    public void setMakerId(Long makerId) {
        this.makerId = makerId;
    }

    public Long getCheckerId() {
        return checkerId;
    }

    public void setCheckerId(Long checkerId) {
        this.checkerId = checkerId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public CustomerBankAccount getCustomerBankAccount() {
        return customerBankAccount;
    }

    public void setCustomerBankAccount(CustomerBankAccount customerBankAccount) {
        this.customerBankAccount = customerBankAccount;
    }

    public SystemAccount getLedgerAccount() {
        return ledgerAccount;
    }

    public void setLedgerAccount(SystemAccount ledgerAccount) {
        this.ledgerAccount = ledgerAccount;
    }

    public Investor getInvestor() {
        return investor;
    }

    public void setInvestor(Investor investor) {
        this.investor = investor;
    }

    public String getReferenceType() {
        return referenceType;
    }

    public void setReferenceType(String referenceType) {
        this.referenceType = referenceType;
    }

    public Long getReferenceIdLong() {
        return referenceIdLong;
    }

    public void setReferenceIdLong(Long referenceIdLong) {
        this.referenceIdLong = referenceIdLong;
    }

    public Boolean getIsDualEntry() {
        return isDualEntry;
    }

    public void setIsDualEntry(Boolean isDualEntry) {
        this.isDualEntry = isDualEntry;
    }

    public BigDecimal getDebitBalanceAfter() {
        return debitBalanceAfter;
    }

    public void setDebitBalanceAfter(BigDecimal debitBalanceAfter) {
        this.debitBalanceAfter = debitBalanceAfter;
    }

    public BigDecimal getCreditBalanceAfter() {
        return creditBalanceAfter;
    }

    public void setCreditBalanceAfter(BigDecimal creditBalanceAfter) {
        this.creditBalanceAfter = creditBalanceAfter;
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "debit_account_id")
    private LedgerAccount debitAccount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "credit_account_id")
    private LedgerAccount creditAccount;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(columnDefinition = "TEXT")
    private String particulars;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 50)
    private LedgerTransactionType transactionType;

    @Column(name = "reference_id", length = 100)
    private String referenceId;

    @Column(name = "maker_id")
    private Long makerId;

    @Column(name = "checker_id")
    private Long checkerId;

    @Column(length = 20)
    private String status = "PENDING";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_bank_account_id")
    private CustomerBankAccount customerBankAccount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ledger_account_id")
    private SystemAccount ledgerAccount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "investor_id")
    private Investor investor;

    @Column(name = "reference_type", length = 50)
    private String referenceType;

    @Column(name = "reference_id_long")
    private Long referenceIdLong;

    @Column(name = "is_dual_entry")
    private Boolean isDualEntry = false;

    @Column(name = "debit_balance_after", precision = 19, scale = 2)
    private BigDecimal debitBalanceAfter;

    @Column(name = "credit_balance_after", precision = 19, scale = 2)
    private BigDecimal creditBalanceAfter;
}

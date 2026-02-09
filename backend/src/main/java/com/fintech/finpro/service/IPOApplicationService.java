package com.fintech.finpro.service;

import com.fintech.finpro.dto.IPOApplicationCreateDTO;
import com.fintech.finpro.dto.IPOApplicationDTO;
import com.fintech.finpro.entity.Customer;
import com.fintech.finpro.entity.CustomerBankAccount;
import com.fintech.finpro.entity.IPO;
import com.fintech.finpro.entity.IPOApplication;
import com.fintech.finpro.enums.ApplicationStatus;
import com.fintech.finpro.enums.PaymentStatus;
import com.fintech.finpro.repository.CustomerBankAccountRepository;
import com.fintech.finpro.repository.CustomerRepository;
import com.fintech.finpro.repository.IPOApplicationRepository;
import com.fintech.finpro.repository.IPORepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IPOApplicationService {

    private final IPOApplicationRepository applicationRepository;
    private final CustomerRepository customerRepository;
    private final IPORepository ipoRepository;
    private final CustomerBankAccountRepository bankAccountRepository;
    private final LedgerService ledgerService;

    @Transactional
    public IPOApplicationDTO createApplication(IPOApplicationCreateDTO dto) {
        // Validate customer
        Customer customer = customerRepository.findById(java.util.Objects.requireNonNull(dto.getCustomerId()))
                .orElseThrow(() -> new RuntimeException("Customer not found with ID: " + dto.getCustomerId()));

        // Validate customer KYC status
        if (!"APPROVED".equals(customer.getKycStatus())) {
            throw new RuntimeException("Customer KYC must be APPROVED to apply for IPO");
        }

        // Validate IPO
        IPO ipo = ipoRepository.findById(java.util.Objects.requireNonNull(dto.getIpoId()))
                .orElseThrow(() -> new RuntimeException("IPO not found with ID: " + dto.getIpoId()));

        // Check if IPO is open
        if (!ipo.isOpen()) {
            throw new RuntimeException("IPO is not currently open for applications");
        }

        // Check for duplicate application
        if (applicationRepository.existsByCustomerIdAndIpoId(dto.getCustomerId(), dto.getIpoId())) {
            throw new RuntimeException("Customer has already applied for this IPO");
        }

        // Validate quantity
        if (dto.getQuantity() < ipo.getMinQuantity()) {
            throw new RuntimeException("Quantity must be at least " + ipo.getMinQuantity());
        }
        if (dto.getQuantity() > ipo.getMaxQuantity()) {
            throw new RuntimeException("Quantity cannot exceed " + ipo.getMaxQuantity());
        }

        // Validate bank account
        CustomerBankAccount bankAccount = bankAccountRepository
                .findById(java.util.Objects.requireNonNull(dto.getBankAccountId()))
                .orElseThrow(() -> new RuntimeException("Bank account not found with ID: " + dto.getBankAccountId()));

        // Verify bank account belongs to customer
        if (!bankAccount.getCustomer().getId().equals(dto.getCustomerId())) {
            throw new RuntimeException("Bank account does not belong to this customer");
        }

        // Calculate amount
        BigDecimal amount = ipo.getPricePerShare().multiply(BigDecimal.valueOf(dto.getQuantity()));

        // Check and Hold funds
        BigDecimal availableBalance = bankAccount.getBalance().subtract(bankAccount.getHeldBalance());
        if (availableBalance.compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient available balance (Total - Held) in bank account");
        }

        // 1. Update Bank Account: Increase Held Balance
        bankAccount.setHeldBalance(bankAccount.getHeldBalance().add(amount));
        bankAccountRepository.save(bankAccount);

        // 2. Perform Ledger Entry: Customer Ledger -> IPO Fund Hold
        com.fintech.finpro.entity.LedgerAccount customerLedger = ledgerService.getOrCreateAccount(
                customer.getFullName() + " - Ledger",
                com.fintech.finpro.enums.LedgerAccountType.CUSTOMER_LEDGER,
                customer.getId());

        com.fintech.finpro.entity.LedgerAccount ipoHoldAcc = ledgerService.getOrCreateAccount(
                "IPO Fund Hold",
                com.fintech.finpro.enums.LedgerAccountType.IPO_FUND_HOLD,
                null);

        ledgerService.recordTransaction(
                customerLedger,
                ipoHoldAcc,
                amount,
                "IPO Application for " + ipo.getCompanyName() + " (" + dto.getQuantity() + " shares)",
                com.fintech.finpro.enums.LedgerTransactionType.WITHDRAWAL, // Customer logic
                null,
                null, // Maker ID (could be customer but usually maker)
                bankAccount);

        // Create application
        IPOApplication application = IPOApplication.builder()
                .customer(customer)
                .ipo(ipo)
                .bankAccount(bankAccount)
                .quantity(dto.getQuantity())
                .amount(amount)
                .applicationStatus(ApplicationStatus.PENDING)
                .paymentStatus(PaymentStatus.PAID) // Fund held successfully
                .allotmentQuantity(0)
                .allotmentStatus("PENDING")
                .appliedAt(LocalDateTime.now())
                .build();

        IPOApplication saved = applicationRepository.save(java.util.Objects.requireNonNull(application));
        return mapToDTO(saved);
    }

    @Transactional(readOnly = true)
    public IPOApplicationDTO getApplicationById(Long id) {
        IPOApplication application = applicationRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("IPO application not found with ID: " + id));
        return mapToDTO(application);
    }

    @Transactional(readOnly = true)
    public List<IPOApplicationDTO> getApplicationsByCustomerId(Long customerId) {
        return applicationRepository.findByCustomerId(customerId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<IPOApplicationDTO> getApplicationsByIpoId(Long ipoId) {
        return applicationRepository.findByIpoId(ipoId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<IPOApplicationDTO> getPendingApplications() {
        return applicationRepository.findPendingApplications().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<IPOApplicationDTO> getApplicationsByStatus(ApplicationStatus status) {
        return applicationRepository.findByApplicationStatus(status).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private final com.fintech.finpro.repository.BankRepository bankRepository;

    @Transactional
    public IPOApplicationDTO approveApplication(Long id, String approvedBy) {
        IPOApplication application = applicationRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("IPO application not found with ID: " + id));

        if (!ApplicationStatus.PENDING.equals(application.getApplicationStatus())) {
            throw new RuntimeException("Only PENDING applications can be approved");
        }

        // CASBA Logic: Deduct Charge if applicable
        CustomerBankAccount bankAccount = application.getBankAccount();
        if (bankAccount != null) {
            // Determine CASBA Charge
            BigDecimal casbaCharge = BigDecimal.ZERO;
            com.fintech.finpro.entity.Bank bank = bankAccount.getBank();

            // If bank relationship is missing, try to find by name
            if (bank == null && bankAccount.getBankName() != null) {
                bank = bankRepository.findByName(bankAccount.getBankName()).orElse(null);
            }

            if (bank != null && Boolean.TRUE.equals(bank.getIsCasba())) {
                casbaCharge = bank.getCasbaCharge();
            }

            if (casbaCharge.compareTo(BigDecimal.ZERO) > 0) {
                // Check available balance (excluding held amount)
                BigDecimal available = bankAccount.getBalance().subtract(bankAccount.getHeldBalance());

                // Deduct if sufficient balance (or force debit logic if desired)
                if (available.compareTo(casbaCharge) >= 0) {
                    // Deduct from Actual Balance
                    bankAccount.setBalance(bankAccount.getBalance().subtract(casbaCharge));
                    bankAccountRepository.save(bankAccount);

                    // Deduct from Ledger: Customer -> Fee Income (CASBA Charges)
                    com.fintech.finpro.entity.LedgerAccount customerLedger = ledgerService.getOrCreateAccount(
                            application.getCustomer().getFullName() + " - Ledger",
                            com.fintech.finpro.enums.LedgerAccountType.CUSTOMER_LEDGER,
                            application.getCustomer().getId());

                    com.fintech.finpro.entity.LedgerAccount feeIncomeAcc = ledgerService.getOrCreateAccount(
                            "CASBA Charges",
                            com.fintech.finpro.enums.LedgerAccountType.FEE_INCOME,
                            null);

                    ledgerService.recordTransaction(
                            customerLedger,
                            feeIncomeAcc,
                            casbaCharge,
                            "CASBA Charge for IPO " + application.getIpo().getCompanyName() + " (" + bank.getName()
                                    + ")",
                            com.fintech.finpro.enums.LedgerTransactionType.FEE,
                            null,
                            null,
                            bankAccount);
                }
            }
        }

        application.setApplicationStatus(ApplicationStatus.APPROVED);
        application.setApprovedAt(LocalDateTime.now());
        application.setApprovedBy(approvedBy);

        IPOApplication approved = applicationRepository.save(application);
        return mapToDTO(approved);
    }

    @Transactional
    public IPOApplicationDTO rejectApplication(Long id, String reason) {
        IPOApplication application = applicationRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("IPO application not found with ID: " + id));

        if (!ApplicationStatus.PENDING.equals(application.getApplicationStatus())) {
            throw new RuntimeException("Only PENDING applications can be rejected");
        }

        application.setApplicationStatus(ApplicationStatus.REJECTED);
        application.setRejectedAt(LocalDateTime.now());
        application.setRejectionReason(reason);

        IPOApplication rejected = applicationRepository.save(application);
        return mapToDTO(rejected);
    }

    @Transactional
    public IPOApplicationDTO updatePaymentStatus(Long id, PaymentStatus paymentStatus) {
        IPOApplication application = applicationRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("IPO application not found with ID: " + id));

        application.setPaymentStatus(paymentStatus);
        IPOApplication updated = applicationRepository.save(application);

        return mapToDTO(updated);
    }

    @Transactional
    public IPOApplicationDTO allotShares(Long id, Integer allottedQuantity) {
        IPOApplication application = applicationRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("IPO application not found with ID: " + id));

        if (!ApplicationStatus.APPROVED.equals(application.getApplicationStatus())) {
            throw new RuntimeException("Only APPROVED applications can be allotted");
        }

        if (allottedQuantity > application.getQuantity()) {
            throw new RuntimeException("Allotted quantity cannot exceed applied quantity");
        }

        application.setApplicationStatus(ApplicationStatus.ALLOTTED);
        application.setAllotmentQuantity(allottedQuantity);
        application.setAllotmentStatus(allottedQuantity > 0 ? "ALLOTTED" : "NOT_ALLOTTED");

        // Settlement Logic
        CustomerBankAccount bankAccount = application.getBankAccount();
        BigDecimal totalAppliedAmount = application.getAmount(); // Original amount held
        BigDecimal allottedAmount = application.getIpo().getPricePerShare()
                .multiply(BigDecimal.valueOf(allottedQuantity));
        BigDecimal refundAmount = totalAppliedAmount.subtract(allottedAmount);

        if (bankAccount != null) {
            // 1. Release Held Amount
            bankAccount.setHeldBalance(bankAccount.getHeldBalance().subtract(totalAppliedAmount));

            // 2. Deduct Allotted Amount from Actual Balance
            bankAccount.setBalance(bankAccount.getBalance().subtract(allottedAmount));
            bankAccountRepository.save(bankAccount);
        }

        // Ledger Settlement
        com.fintech.finpro.entity.LedgerAccount ipoHoldAcc = ledgerService.getOrCreateAccount(
                "IPO Fund Hold",
                com.fintech.finpro.enums.LedgerAccountType.IPO_FUND_HOLD,
                null);

        com.fintech.finpro.entity.LedgerAccount customerLedger = ledgerService.getOrCreateAccount(
                application.getCustomer().getFullName() + " - Ledger",
                com.fintech.finpro.enums.LedgerAccountType.CUSTOMER_LEDGER,
                application.getCustomer().getId());

        com.fintech.finpro.entity.LedgerAccount coreCapitalAcc = ledgerService.getOrCreateAccount(
                "Core Capital",
                com.fintech.finpro.enums.LedgerAccountType.CORE_CAPITAL,
                null);

        if (allottedQuantity > 0) {
            // Transfer Allotted Amount: IPO Hold -> Core Capital
            ledgerService.recordTransaction(
                    ipoHoldAcc,
                    coreCapitalAcc,
                    allottedAmount,
                    "IPO Allotment: " + application.getIpo().getCompanyName() + " (" + allottedQuantity + " shares)",
                    com.fintech.finpro.enums.LedgerTransactionType.TRANSFER,
                    null,
                    null);
        }

        if (refundAmount.compareTo(BigDecimal.ZERO) > 0) {
            // Transfer Refund Amount: IPO Hold -> Customer Ledger
            ledgerService.recordTransaction(
                    ipoHoldAcc,
                    customerLedger,
                    refundAmount,
                    "IPO Refund: " + application.getIpo().getCompanyName(),
                    com.fintech.finpro.enums.LedgerTransactionType.DEPOSIT,
                    null,
                    null,
                    bankAccount);
        }

        IPOApplication allotted = applicationRepository.save(application);
        return mapToDTO(allotted);
    }

    private IPOApplicationDTO mapToDTO(IPOApplication application) {
        return IPOApplicationDTO.builder()
                .id(application.getId())
                .customerId(application.getCustomer().getId())
                .customerName(application.getCustomer().getFullName())
                .ipoId(application.getIpo().getId())
                .ipoCompanyName(application.getIpo().getCompanyName())
                .bankAccountId(application.getBankAccount() != null ? application.getBankAccount().getId() : null)
                .bankAccountNumber(
                        application.getBankAccount() != null ? application.getBankAccount().getAccountNumber() : null)
                .quantity(application.getQuantity())
                .amount(application.getAmount())
                .applicationNumber(application.getApplicationNumber())
                .applicationStatus(application.getApplicationStatus())
                .paymentStatus(application.getPaymentStatus())
                .allotmentQuantity(application.getAllotmentQuantity())
                .allotmentStatus(application.getAllotmentStatus())
                .appliedAt(application.getAppliedAt())
                .approvedAt(application.getApprovedAt())
                .rejectedAt(application.getRejectedAt())
                .rejectionReason(application.getRejectionReason())
                .approvedBy(application.getApprovedBy())
                .createdAt(application.getCreatedAt())
                .updatedAt(application.getUpdatedAt())
                .build();
    }
}

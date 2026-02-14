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
    private final com.fintech.finpro.repository.CustomerPortfolioRepository customerPortfolioRepository;
    private final LedgerService ledgerService;
    private final com.fintech.finpro.repository.BankRepository bankRepository;

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
        ApplicationStatus initialStatus = dto.getMakerId() != null ? ApplicationStatus.PENDING_VERIFICATION
                : ApplicationStatus.PENDING;

        IPOApplication application = IPOApplication.builder()
                .customer(customer)
                .ipo(ipo)
                .bankAccount(bankAccount)
                .quantity(dto.getQuantity())
                .amount(amount)
                .applicationStatus(initialStatus)
                .paymentStatus(PaymentStatus.PAID) // Fund held successfully
                .allotmentQuantity(0)
                .allotmentStatus("PENDING")
                .appliedAt(LocalDateTime.now())
                .makerId(dto.getMakerId())
                .build();

        IPOApplication saved = applicationRepository.save(java.util.Objects.requireNonNull(application));
        return mapToDTO(saved);
    }

    @Transactional
    public IPOApplicationDTO verifyApplication(Long id, Long checkerId) {
        IPOApplication application = applicationRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("IPO application not found with ID: " + id));

        if (!ApplicationStatus.PENDING_VERIFICATION.equals(application.getApplicationStatus())) {
            throw new RuntimeException("Only PENDING_VERIFICATION applications can be verified");
        }

        if (application.getMakerId() != null && application.getMakerId().equals(checkerId)) {
            throw new RuntimeException("Maker cannot verify their own application");
        }

        // Transition: PENDING_VERIFICATION -> PENDING (Normal flow, ready for
        // approval/allotment)
        // OR -> VERIFIED if we want a distinct state. But let's use PENDING to start
        // with standard flow.
        // Actually, let's use VERIFIED if PENDING is for "Submitted by Customer".
        // But system treats PENDING as "Valid". So PENDING is fine.
        application.setApplicationStatus(ApplicationStatus.PENDING);
        application.setCheckerId(checkerId);
        application.setApprovedAt(LocalDateTime.now()); // Verification time
        application.setApprovedBy(String.valueOf(checkerId));

        return mapToDTO(applicationRepository.save(application));
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
        if (status == null) {
            return applicationRepository.findAll().stream()
                    .map(this::mapToDTO)
                    .collect(Collectors.toList());
        }
        return applicationRepository.findByApplicationStatus(status).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public IPOApplicationDTO updateApplication(Long id, IPOApplicationCreateDTO dto) {
        IPOApplication application = applicationRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("IPO application not found with ID: " + id));

        // Allow updates only if PENDING, PENDING_VERIFICATION, or REJECTED
        if (!ApplicationStatus.PENDING.equals(application.getApplicationStatus()) &&
                !ApplicationStatus.PENDING_VERIFICATION.equals(application.getApplicationStatus()) &&
                !ApplicationStatus.REJECTED.equals(application.getApplicationStatus())) {
            throw new RuntimeException(
                    "Application cannot be edited in its current status: " + application.getApplicationStatus());
        }

        IPO ipo = application.getIpo();
        if (!ipo.isOpen()) {
            throw new RuntimeException("IPO is closed. Application cannot be modified.");
        }

        // Handle quantity and amount change logic
        BigDecimal oldAmount = application.getAmount();
        BigDecimal newAmount = ipo.getPricePerShare().multiply(BigDecimal.valueOf(dto.getQuantity()));

        if (newAmount.compareTo(oldAmount) != 0) {
            CustomerBankAccount bankAccount = application.getBankAccount();

            // Release old hold
            bankAccount.setHeldBalance(bankAccount.getHeldBalance().subtract(oldAmount));

            // Check if new hold is possible
            BigDecimal available = bankAccount.getBalance().subtract(bankAccount.getHeldBalance());
            if (available.compareTo(newAmount) < 0) {
                // Rollback hold change if insufficient
                bankAccount.setHeldBalance(bankAccount.getHeldBalance().add(oldAmount));
                bankAccountRepository.save(bankAccount);
                throw new RuntimeException("Insufficient available balance for updated quantity");
            }

            // Apply new hold
            bankAccount.setHeldBalance(bankAccount.getHeldBalance().add(newAmount));
            bankAccountRepository.save(bankAccount);

            // Ledger Adjustment (Simplified: Record a reversing and then a new one or just
            // a net adjustment)
            // For now, let's update application fields
            application.setAmount(newAmount);
            application.setQuantity(dto.getQuantity());
        }

        // If it was rejected, move it back to PENDING_VERIFICATION (or PENDING if no
        // maker)
        if (ApplicationStatus.REJECTED.equals(application.getApplicationStatus())) {
            application.setApplicationStatus(
                    dto.getMakerId() != null ? ApplicationStatus.PENDING_VERIFICATION : ApplicationStatus.PENDING);
            application.setRejectedAt(null);
            application.setRejectionReason(null);
        }

        // Update basic fields if they changed (bankAccount might need more complex
        // logic if changed, but frontend usually restricts it)
        // For now, only quantity is the main editable field.

        application.setUpdatedAt(LocalDateTime.now());

        return mapToDTO(applicationRepository.save(application));
    }

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

                    String bankName = bank != null ? bank.getName()
                            : (bankAccount.getBankName() != null ? bankAccount.getBankName() : "Unknown Bank");
                    ledgerService.recordTransaction(
                            customerLedger,
                            feeIncomeAcc,
                            casbaCharge,
                            "CASBA Charge for IPO " + application.getIpo().getCompanyName() + " (" + bankName + ")",
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

        if (!ApplicationStatus.PENDING.equals(application.getApplicationStatus())
                && !ApplicationStatus.PENDING_VERIFICATION.equals(application.getApplicationStatus())) {
            throw new RuntimeException("Only PENDING or PENDING_VERIFICATION applications can be rejected");
        }

        application.setApplicationStatus(ApplicationStatus.REJECTED);
        application.setRejectedAt(LocalDateTime.now());
        application.setRejectionReason(reason);

        // Release holds if rejected
        CustomerBankAccount bankAccount = application.getBankAccount();
        if (bankAccount != null) {
            bankAccount.setHeldBalance(bankAccount.getHeldBalance().subtract(application.getAmount()));
            bankAccountRepository.save(bankAccount);

            // Ledger Reversal (Withdrawal Reversal -> Deposit)
            // ...
        }

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
            // 1. Release Held Amount (Release ALL held amount first)
            bankAccount.setHeldBalance(bankAccount.getHeldBalance().subtract(totalAppliedAmount));

            // 2. Deduct Allotted Amount from Actual Balance (if allotted > 0)
            if (allottedAmount.compareTo(BigDecimal.ZERO) > 0) {
                bankAccount.setBalance(bankAccount.getBalance().subtract(allottedAmount));
            }
            // Refund is automatic because we only subtract `allottedAmount` from balance.
            // The `totalAppliedAmount` was only HELD, not deducted.
            // So if we release HELD and deduct ALLOTTED, the REFUND remains in Balance.

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
            // Transfer Allotted Amount: IPO Hold -> Core Capital (Realizing Revenue/Equity)
            ledgerService.recordTransaction(
                    ipoHoldAcc,
                    coreCapitalAcc,
                    allottedAmount,
                    "IPO Allotment: " + application.getIpo().getCompanyName() + " (" + allottedQuantity + " shares)",
                    com.fintech.finpro.enums.LedgerTransactionType.ALLOTMENT,
                    null,
                    null,
                    bankAccount); // Linking bank account for reference

            // --- PORTFOLIO UPDATE START ---
            // Check if portfolio already exists for this Scrip
            String symbol = application.getIpo().getSymbol();
            List<com.fintech.finpro.entity.CustomerPortfolio> portfolios = customerPortfolioRepository
                    .findByCustomerIdAndScripSymbol(application.getCustomer().getId(), symbol);

            com.fintech.finpro.entity.CustomerPortfolio portfolio;
            if (portfolios.isEmpty()) {
                // Create New
                portfolio = com.fintech.finpro.entity.CustomerPortfolio.builder()
                        .customer(application.getCustomer())
                        .ipo(application.getIpo()) // Link to this IPO
                        .scripSymbol(symbol)
                        .quantity(allottedQuantity)
                        .purchasePrice(application.getIpo().getPricePerShare())
                        .totalCost(allottedAmount)
                        .holdingSince(java.time.LocalDate.now())
                        .status("HELD")
                        .isBonus(false)
                        .build();
            } else {
                // Update Existing (FIFO or Weighted Average? Simple add for now)
                portfolio = portfolios.get(0);
                // Weighted Average Price Calculation
                BigDecimal currentTotalCost = portfolio.getTotalCost();
                BigDecimal newTotalCost = currentTotalCost.add(allottedAmount);
                int newQuantity = portfolio.getQuantity() + allottedQuantity;
                // BigDecimal newAvgPrice = newTotalCost.divide(BigDecimal.valueOf(newQuantity),
                // 2, java.math.RoundingMode.HALF_UP);

                portfolio.setQuantity(newQuantity);
                portfolio.setTotalCost(newTotalCost);
                // portfolio.setPurchasePrice(newAvgPrice); // Consider if we want to update avg
                // price
            }
            customerPortfolioRepository.save(portfolio);
            // --- PORTFOLIO UPDATE END ---
        }

        if (refundAmount.compareTo(BigDecimal.ZERO) > 0) {
            // Transfer Refund Amount: IPO Hold -> Customer Ledger (Unblock logic)
            ledgerService.recordTransaction(
                    ipoHoldAcc,
                    customerLedger,
                    refundAmount,
                    "IPO Refund: " + application.getIpo().getCompanyName(),
                    com.fintech.finpro.enums.LedgerTransactionType.REFUND,
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
                .customerId(application.getCustomer() != null ? application.getCustomer().getId() : null)
                .customerName(application.getCustomer() != null ? application.getCustomer().getFullName() : null)
                .ipoId(application.getIpo() != null ? application.getIpo().getId() : null)
                .ipoCompanyName(application.getIpo() != null ? application.getIpo().getCompanyName() : null)
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
                .makerId(application.getMakerId())
                .checkerId(application.getCheckerId())
                .createdAt(application.getCreatedAt())
                .updatedAt(application.getUpdatedAt())
                .build();
    }
}

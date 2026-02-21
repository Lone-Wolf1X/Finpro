package com.fintech.finpro.service;

import com.fintech.finpro.dto.CustomerCreateDTO;
import com.fintech.finpro.dto.CustomerDraftDTO;
import com.fintech.finpro.dto.CustomerDTO;
import com.fintech.finpro.entity.Customer;
import com.fintech.finpro.enums.CustomerType;
import com.fintech.finpro.enums.KycStatus;
import com.fintech.finpro.enums.LedgerAccountType;
import com.fintech.finpro.repository.CustomerRepository;
import com.fintech.finpro.repository.UserRepository;
import com.fintech.finpro.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final com.fintech.finpro.repository.BankRepository bankRepository;
    private final com.fintech.finpro.repository.CustomerBankAccountRepository customerBankAccountRepository;
    private final com.fintech.finpro.repository.IPOApplicationRepository ipoApplicationRepository;
    private final com.fintech.finpro.repository.CustomerCredentialRepository customerCredentialRepository;
    private final com.fintech.finpro.repository.CustomerPortfolioRepository customerPortfolioRepository;
    private final com.fintech.finpro.repository.LedgerAccountRepository ledgerAccountRepository;
    private final com.fintech.finpro.repository.BulkDepositItemRepository bulkDepositItemRepository;
    private final com.fintech.finpro.repository.PendingTransactionRepository pendingTransactionRepository;
    private final com.fintech.finpro.repository.LedgerTransactionRepository ledgerTransactionRepository;
    private final com.fintech.finpro.repository.TransactionFeeRepository transactionFeeRepository;
    private final UserRepository userRepository;
    private final LedgerService ledgerService;
    private final org.modelmapper.ModelMapper modelMapper;

    @Transactional
    public CustomerDTO createCustomer(CustomerCreateDTO dto) {
        // Validate email uniqueness check removed as per requirement

        // Build customer entity
        Customer customer = Customer.builder()
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .gender(dto.getGender())
                .dateOfBirth(dto.getDateOfBirth())
                .contactNumber(dto.getContactNumber())
                .bankAccountNumber(dto.getBankAccountNumber())
                .address(dto.getAddress())
                .citizenshipNumber(dto.getCitizenshipNumber())
                .nidNumber(dto.getNidNumber())
                .customerCode(generateCustomerCode())
                .photoPath(dto.getPhotoPath())
                .signaturePath(dto.getSignaturePath())
                .guardianPhotoPath(dto.getGuardianPhotoPath())
                .guardianSignaturePath(dto.getGuardianSignaturePath())
                .build();

        // Set creator
        String email = SecurityUtils.getCurrentUserEmail();
        if (email != null) {
            userRepository.findByEmail(email).ifPresent(u -> customer.setCreatedByUserId(u.getId()));
        }

        // Enforce DRAFT for MAKER
        if (SecurityUtils.isMaker()) {
            customer.setKycStatus(KycStatus.DRAFT);
        } else {
            customer.setKycStatus(KycStatus.PENDING);
        }

        // Set Bank
        com.fintech.finpro.entity.Bank bank = bankRepository.findById(java.util.Objects.requireNonNull(dto.getBankId()))
                .orElseThrow(() -> new RuntimeException("Bank not found with ID: " + dto.getBankId()));
        customer.setBank(bank);

        // Uniqueness validation
        if (dto.getCitizenshipNumber() != null && !dto.getCitizenshipNumber().trim().isEmpty()) {
            customerRepository.findByCitizenshipNumber(dto.getCitizenshipNumber())
                    .ifPresent(existing -> {
                        throw new RuntimeException(
                                "Citizenship Number '" + dto.getCitizenshipNumber() + "' already exists");
                    });
        }
        if (dto.getNidNumber() != null && !dto.getNidNumber().trim().isEmpty()) {
            customerRepository.findByNidNumber(dto.getNidNumber())
                    .ifPresent(existing -> {
                        throw new RuntimeException("National ID (NID) '" + dto.getNidNumber() + "' already exists");
                    });
        }

        // Calculate age and determine type (will be done in @PrePersist)
        customer.calculateAge();
        customer.determineCustomerType();

        // Validate and set guardian for MINOR customers
        if (customer.isMinor()) {
            if (dto.getGuardianId() == null) {
                throw new RuntimeException("Guardian is required for minor customers (age < 18)");
            }
            Customer guardian = customerRepository.findById(java.util.Objects.requireNonNull(dto.getGuardianId()))
                    .orElseThrow(() -> new RuntimeException("Guardian not found with ID: " + dto.getGuardianId()));

            // Validate guardian is MAJOR and APPROVED (unless skipped for Bulk Upload)
            if (!CustomerType.MAJOR.equals(guardian.getCustomerType())) {
                throw new RuntimeException("Guardian must be a MAJOR customer (age >= 18)");
            }
            if (!dto.isSkipGuardianKycCheck() && !KycStatus.APPROVED.equals(guardian.getKycStatus())) {
                throw new RuntimeException("Guardian must have APPROVED KYC status");
            }

            customer.setGuardian(guardian);
        } else {
            // MAJOR customers should not have guardian
            if (dto.getGuardianId() != null) {
                throw new RuntimeException("MAJOR customers (age >= 18) cannot have a guardian");
            }
        }

        Customer saved = customerRepository.save(customer);

        // Sync primary bank account to customer_bank_accounts table with initial
        // deposit
        java.math.BigDecimal initialDeposit = dto.getInitialDeposit() != null ? dto.getInitialDeposit()
                : java.math.BigDecimal.ZERO;
        syncPrimaryBankAccount(saved, initialDeposit);

        return mapToDTO(saved);
    }

    @Transactional(readOnly = true)
    public CustomerDTO getCustomerById(Long id) {
        Customer customer = customerRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Customer not found with ID: " + id));
        return mapToDTO(customer);
    }

    @Transactional(readOnly = true)
    public Customer getCustomerByEmail(String email) {
        List<Customer> customers = customerRepository.findByEmail(email);
        return customers.isEmpty() ? null : customers.get(0);
    }

    @Transactional(readOnly = true)
    public List<CustomerDTO> getAllCustomers() {
        return customerRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CustomerDTO> getCustomersByType(CustomerType type) {
        return customerRepository.findByCustomerType(type).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CustomerDTO> getCustomersByKycStatus(String status) {
        return customerRepository.findByKycStatus(KycStatus.valueOf(status)).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CustomerDTO> searchCustomers(String search) {
        return customerRepository.searchCustomers(search).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CustomerDTO> getEligibleGuardians() {
        return customerRepository.findEligibleGuardians().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public CustomerDTO updateCustomer(Long id, CustomerCreateDTO dto) {
        Customer customer = customerRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Customer not found with ID: " + id));

        // Uniqueness validation (excluding current customer)
        if (dto.getCitizenshipNumber() != null && !dto.getCitizenshipNumber().trim().isEmpty()) {
            customerRepository.findByCitizenshipNumber(dto.getCitizenshipNumber())
                    .ifPresent(existing -> {
                        if (!existing.getId().equals(id)) {
                            throw new RuntimeException("Citizenship Number '" + dto.getCitizenshipNumber()
                                    + "' already exists for another customer");
                        }
                    });
        }
        if (dto.getNidNumber() != null && !dto.getNidNumber().trim().isEmpty()) {
            customerRepository.findByNidNumber(dto.getNidNumber())
                    .ifPresent(existing -> {
                        if (!existing.getId().equals(id)) {
                            throw new RuntimeException("National ID (NID) '" + dto.getNidNumber()
                                    + "' already exists for another customer");
                        }
                    });
        }

        // Update basic fields
        customer.setFirstName(dto.getFirstName());
        customer.setLastName(dto.getLastName());
        customer.setPhone(dto.getPhone());
        customer.setGender(dto.getGender());
        customer.setDateOfBirth(dto.getDateOfBirth());
        customer.setContactNumber(dto.getContactNumber());
        customer.setBankAccountNumber(dto.getBankAccountNumber());

        // Update Bank
        if (dto.getBankId() != null
                && (customer.getBank() == null || !customer.getBank().getId().equals(dto.getBankId()))) {
            com.fintech.finpro.entity.Bank bank = bankRepository
                    .findById(java.util.Objects.requireNonNull(dto.getBankId()))
                    .orElseThrow(() -> new RuntimeException("Bank not found with ID: " + dto.getBankId()));
            customer.setBank(bank);
        }

        customer.setAddress(dto.getAddress());
        customer.setCitizenshipNumber(dto.getCitizenshipNumber());
        customer.setNidNumber(dto.getNidNumber());
        customer.setPhotoPath(dto.getPhotoPath());
        customer.setSignaturePath(dto.getSignaturePath());
        customer.setGuardianPhotoPath(dto.getGuardianPhotoPath());
        customer.setGuardianSignaturePath(dto.getGuardianSignaturePath());

        // Recalculate age and type
        customer.calculateAge();
        customer.determineCustomerType();

        // Handle guardian update (Fixed Guardian logic naturally applies here)
        if (customer.isMinor()) {
            if (dto.getGuardianId() == null) {
                throw new RuntimeException("Guardian is required for minor customers");
            }
            // If guardian is already set, we usually don't want to change it via profile
            // update
            // unless special case. For now, we allow it in service but frontend will lock
            // it.
            // However, let's add a check if user explicitly requested to prevent it here
            // too.
            if (customer.getGuardian() != null && !customer.getGuardian().getId().equals(dto.getGuardianId())) {
                // Future: Add a flag like 'forceGuardianChange' if we want to allow it via
                // legal authority
                // For now, let's keep it but frontend will lock.
                // To be safe as per user request: "mostly ye jyada use nahi hoga"
                // customer.setGuardian(existingGuardian); // No change
            }

            Customer guardian = customerRepository.findById(java.util.Objects.requireNonNull(dto.getGuardianId()))
                    .orElseThrow(() -> new RuntimeException("Guardian not found"));
            customer.setGuardian(guardian);
        } else {
            customer.setGuardian(null);
        }

        // If status was DRAFT, REJECTED, or RETURNED, move to PENDING on "Submit"
        if (KycStatus.DRAFT.equals(customer.getKycStatus()) || KycStatus.REJECTED.equals(customer.getKycStatus())
                || KycStatus.RETURNED.equals(customer.getKycStatus())) {
            customer.setKycStatus(KycStatus.PENDING);
            customer.setRemarks(null); // Clear remarks on resubmit
        }

        Customer saved = customerRepository.save(customer);

        // Sync primary bank account to customer_bank_accounts table if bank info
        // provided
        if (saved.getBank() != null && saved.getBankAccountNumber() != null) {
            java.math.BigDecimal initialDeposit = dto.getInitialDeposit() != null ? dto.getInitialDeposit()
                    : java.math.BigDecimal.ZERO;
            syncPrimaryBankAccount(saved, initialDeposit);
        }

        return mapToDTO(saved);
    }

    @Transactional
    public CustomerDTO createDraft(CustomerDraftDTO dto) {
        // Build customer entity with minimal validation
        Customer customer = Customer.builder()
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .gender(dto.getGender())
                .dateOfBirth(dto.getDateOfBirth())
                .contactNumber(dto.getContactNumber())
                .bankAccountNumber(dto.getBankAccountNumber())
                .address(dto.getAddress())
                .citizenshipNumber(dto.getCitizenshipNumber())
                .nidNumber(dto.getNidNumber())
                .customerCode(generateCustomerCode())
                .kycStatus(KycStatus.DRAFT)
                .photoPath(dto.getPhotoPath())
                .signaturePath(dto.getSignaturePath())
                .guardianPhotoPath(dto.getGuardianPhotoPath())
                .guardianSignaturePath(dto.getGuardianSignaturePath())
                .build();

        // Set creator
        String creatorEmail = SecurityUtils.getCurrentUserEmail();
        if (creatorEmail != null) {
            userRepository.findByEmail(creatorEmail).ifPresent(u -> customer.setCreatedByUserId(u.getId()));
        }

        // Bank is optional for draft
        if (dto.getBankId() != null && dto.getBankId() > 0) {
            Long bankId = dto.getBankId();
            if (bankId != null) {
                com.fintech.finpro.entity.Bank bank = bankRepository.findById(bankId).orElse(null);
                customer.setBank(bank);
            }
        }

        // Calculate age/type if DOB present
        if (dto.getDateOfBirth() != null) {
            customer.calculateAge();
            customer.determineCustomerType();
        }

        // Guardian optional for draft
        if (dto.getGuardianId() != null) {
            customerRepository.findById(java.util.Objects.requireNonNull(dto.getGuardianId()))
                    .ifPresent(customer::setGuardian);
        }

        // Manual fields
        customer.setGuardianName(dto.getGuardianName());
        customer.setGuardianRelation(dto.getGuardianRelation());

        // Note: We might need to relax 'nullable=false' constraints in Entity or ensure
        // we handle them.
        // Looking at Entity: firstName, lastName, email, phone, kycStatus are
        // nullable=false.
        // So Draft MUST at least have these.
        if (customer.getFirstName() == null)
            customer.setFirstName("Draft"); // Placeholder? Or require Name?
        if (customer.getLastName() == null)
            customer.setLastName("Customer");

        // For Draft, we probably want to allow these to be null in DB, but Entity sends
        // constraints.
        // User workflow: "Maker input minimum details".
        // Let's assume Name is required even for Draft.

        Customer saved = customerRepository.save(customer);
        return mapToDTO(saved);
    }

    @Transactional
    public CustomerDTO updateDraft(Long id, CustomerDraftDTO dto) {
        Customer customer = customerRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Customer not found with ID: " + id));

        if (dto.getFirstName() != null)
            customer.setFirstName(dto.getFirstName());
        if (dto.getLastName() != null)
            customer.setLastName(dto.getLastName());
        if (dto.getEmail() != null)
            customer.setEmail(dto.getEmail());
        if (dto.getPhone() != null)
            customer.setPhone(dto.getPhone());
        if (dto.getGender() != null)
            customer.setGender(dto.getGender());
        if (dto.getDateOfBirth() != null)
            customer.setDateOfBirth(dto.getDateOfBirth());
        if (dto.getContactNumber() != null)
            customer.setContactNumber(dto.getContactNumber());
        if (dto.getBankAccountNumber() != null)
            customer.setBankAccountNumber(dto.getBankAccountNumber());
        if (dto.getAddress() != null)
            customer.setAddress(dto.getAddress());
        if (dto.getCitizenshipNumber() != null)
            customer.setCitizenshipNumber(dto.getCitizenshipNumber());
        if (dto.getNidNumber() != null)
            customer.setNidNumber(dto.getNidNumber());

        if (dto.getBankId() != null && dto.getBankId() > 0) {
            bankRepository.findById(java.util.Objects.requireNonNull(dto.getBankId())).ifPresent(customer::setBank);
        }

        if (dto.getGuardianId() != null) {
            customerRepository.findById(java.util.Objects.requireNonNull(dto.getGuardianId()))
                    .ifPresent(customer::setGuardian);
        }

        if (dto.getGuardianName() != null)
            customer.setGuardianName(dto.getGuardianName());
        if (dto.getGuardianRelation() != null)
            customer.setGuardianRelation(dto.getGuardianRelation());

        // Re-calc
        customer.calculateAge();
        customer.determineCustomerType();

        Customer updated = customerRepository.save(customer);
        syncPrimaryBankAccount(updated, java.math.BigDecimal.ZERO);
        return mapToDTO(updated);
    }

    @Transactional
    public void deleteCustomer(Long id) {
        Customer customer = customerRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Customer not found with ID: " + id));

        // Check if customer is a guardian for any minors (referential integrity)
        List<Customer> dependents = customerRepository.findByGuardianId(id);
        if (!dependents.isEmpty()) {
            throw new RuntimeException(
                    "Cannot delete customer who is a guardian for " + dependents.size()
                            + " minor(s). Please reassign or delete minors first.");
        }

        // 1. Identify and Delete ALL Ledger Transactions (Direct + Indirect via
        // Accounts)
        List<com.fintech.finpro.entity.LedgerAccount> customerLedgerAccounts = ledgerAccountRepository
                .findByOwnerId(id);
        List<Long> ledgerAccountIds = customerLedgerAccounts.stream()
                .map(com.fintech.finpro.entity.LedgerAccount::getId).collect(java.util.stream.Collectors.toList());

        // Find transactions where customer is explicitly set OR involved via their
        // ledger accounts
        List<com.fintech.finpro.entity.LedgerTransaction> relatedLedgerTransactions = new java.util.ArrayList<>();

        // Direct
        relatedLedgerTransactions.addAll(ledgerTransactionRepository.findByCustomerId(id));

        // Indirect via Ledger Accounts
        if (!ledgerAccountIds.isEmpty()) {
            relatedLedgerTransactions.addAll(ledgerTransactionRepository
                    .findByDebitAccountIdInOrCreditAccountIdIn(ledgerAccountIds, ledgerAccountIds));
        }

        // Deduplicate
        List<com.fintech.finpro.entity.LedgerTransaction> uniqueLedgerTransactions = relatedLedgerTransactions.stream()
                .distinct().collect(java.util.stream.Collectors.toList());

        // Delete Fees and Transactions
        for (com.fintech.finpro.entity.LedgerTransaction tx : uniqueLedgerTransactions) {
            transactionFeeRepository.deleteByTransactionId(tx.getId());
            ledgerTransactionRepository.delete(tx);
        }

        // 2. Delete Pending Transactions
        List<com.fintech.finpro.entity.PendingTransaction> pendingTransactions = pendingTransactionRepository
                .findByCustomer_IdOrderByCreatedAtDesc(id);
        if (!pendingTransactions.isEmpty()) {
            pendingTransactionRepository.deleteAll(pendingTransactions);
        }

        // 3. Delete dependent IPO applications (must be before bank accounts)
        List<com.fintech.finpro.entity.IPOApplication> applications = ipoApplicationRepository.findByCustomerId(id);
        if (!applications.isEmpty()) {
            ipoApplicationRepository.deleteAll(applications);
        }

        // 4. Delete dependent Credentials
        List<com.fintech.finpro.entity.CustomerCredential> credentials = customerCredentialRepository
                .findByCustomerId(id);
        if (!credentials.isEmpty()) {
            customerCredentialRepository.deleteAll(credentials);
        }

        // 5. Delete dependent Portfolios
        List<com.fintech.finpro.entity.CustomerPortfolio> portfolios = customerPortfolioRepository.findByCustomerId(id);
        if (!portfolios.isEmpty()) {
            customerPortfolioRepository.deleteAll(portfolios);
        }

        // 6. Delete Ledger Accounts
        if (!customerLedgerAccounts.isEmpty()) {
            ledgerAccountRepository.deleteAll(customerLedgerAccounts);
        }

        // 7. Delete dependent Bulk Deposit Items
        List<com.fintech.finpro.entity.BulkDepositItem> depositItems = bulkDepositItemRepository.findByCustomerId(id);
        if (!depositItems.isEmpty()) {
            bulkDepositItemRepository.deleteAll(depositItems);
        }

        // 8. Delete dependent bank accounts
        List<com.fintech.finpro.entity.CustomerBankAccount> accounts = customerBankAccountRepository
                .findByCustomerId(id);
        if (!accounts.isEmpty()) {
            customerBankAccountRepository.deleteAll(accounts);
        }

        customerRepository.delete(java.util.Objects.requireNonNull(customer));
    }

    @Transactional
    public CustomerDTO approveCustomer(Long id, Long approvedByUserId) {
        Customer customer = customerRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Customer not found with ID: " + id));

        customer.setKycStatus(KycStatus.APPROVED);
        customer.setApprovedByUserId(approvedByUserId);

        Customer approved = customerRepository.save(customer);
        return mapToDTO(approved);
    }

    @Transactional
    public CustomerDTO rejectCustomer(Long id, String remarks) {
        Customer customer = customerRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Customer not found with ID: " + id));

        customer.setKycStatus(KycStatus.REJECTED);
        customer.setRemarks(remarks);

        Customer rejected = customerRepository.save(customer);
        return mapToDTO(rejected);
    }

    @Transactional
    public CustomerDTO returnCustomer(Long id, String remarks) {
        Customer customer = customerRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Customer not found with ID: " + id));

        customer.setKycStatus(KycStatus.RETURNED);
        customer.setRemarks(remarks);

        Customer returned = customerRepository.save(customer);
        return mapToDTO(returned);
    }

    @Transactional
    public List<CustomerDTO> bulkImport(org.springframework.web.multipart.MultipartFile file) {
        try (java.io.Reader reader = new java.io.InputStreamReader(file.getInputStream())) {
            com.opencsv.bean.CsvToBean<CustomerCreateDTO> csvToBean = new com.opencsv.bean.CsvToBeanBuilder<CustomerCreateDTO>(
                    reader)
                    .withType(CustomerCreateDTO.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .build();

            List<CustomerCreateDTO> dtos = csvToBean.parse();
            List<CustomerDTO> result = new java.util.ArrayList<>();

            for (CustomerCreateDTO dto : dtos) {
                // Determine Bank ID from name if ID is missing but name provided (optional
                // enhancement, but for now expect valid ID or handle mapping)
                // For simplicity, let's assume CSV provides valid IDs or we map it.
                // Actually, OpenCSV maps by header name matching field name.
                // Field is `bankId`. So CSV header should be `bankId`.

                try {
                    result.add(createCustomer(dto));
                } catch (Exception e) {
                    // Log error and continue or throw? For now let's capture successful ones or
                    // fail all?
                    // Let's fail all for data integrity if one fails in transactional?
                    // Or maybe return partial success? Transactional will rollback all if runtime
                    // exception.
                    // Let's keep it checking uniqueness and throwing.
                    throw new RuntimeException("Error processing customer " + dto.getEmail() + ": " + e.getMessage());
                }
            }
            return result;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse CSV file: " + e.getMessage());
        }
    }

    private CustomerDTO mapToDTO(Customer customer) {
        CustomerDTO dto = CustomerDTO.builder()
                .id(customer.getId())
                .firstName(customer.getFirstName())
                .lastName(customer.getLastName())
                .fullName(customer.getFullName())
                .email(customer.getEmail())
                .phone(customer.getPhone())
                .gender(customer.getGender())
                .dateOfBirth(customer.getDateOfBirth())
                .age(customer.getAge())
                .customerType(customer.getCustomerType())
                .contactNumber(customer.getContactNumber())
                .bankAccountNumber(customer.getBankAccountNumber())
                .bankAccountNumber(customer.getBankAccountNumber())
                .bank(customer.getBank() != null
                        ? modelMapper.map(customer.getBank(), com.fintech.finpro.dto.BankDTO.class)
                        : null)
                .address(customer.getAddress())
                .kycStatus(customer.getKycStatus() != null ? customer.getKycStatus().name() : null)
                .remarks(customer.getRemarks())
                .createdByUserId(customer.getCreatedByUserId())
                .approvedByUserId(customer.getApprovedByUserId())
                .createdAt(customer.getCreatedAt())
                .updatedAt(customer.getUpdatedAt())
                .build();

        // Add guardian info if present
        if (customer.getGuardian() != null) {
            dto.setGuardianId(customer.getGuardian().getId());
            dto.setGuardianName(customer.getGuardian().getFullName());
        }

        dto.setCitizenshipNumber(customer.getCitizenshipNumber());
        dto.setNidNumber(customer.getNidNumber());
        dto.setCustomerCode(customer.getCustomerCode());
        dto.setPhotoPath(customer.getPhotoPath());
        dto.setSignaturePath(customer.getSignaturePath());
        dto.setGuardianPhotoPath(customer.getGuardianPhotoPath());
        dto.setGuardianSignaturePath(customer.getGuardianSignaturePath());

        return dto;
    }

    private synchronized String generateCustomerCode() {
        String yearPrefix = String.valueOf(java.time.Year.now().getValue());
        String maxCode = customerRepository.findMaxCustomerCodeByYear(yearPrefix);

        if (maxCode == null) {
            return yearPrefix + "0000001";
        }

        long currentSequence = Long.parseLong(maxCode.substring(4));
        long nextSequence = currentSequence + 1;
        return yearPrefix + String.format("%07d", nextSequence);
    }

    @Transactional
    public void syncPrimaryBankAccount(Customer customer, java.math.BigDecimal initialDeposit) {
        if (customer.getBank() != null && customer.getBankAccountNumber() != null) {
            // Check if already exists
            java.util.Optional<com.fintech.finpro.entity.CustomerBankAccount> existingAccount = customerBankAccountRepository
                    .findByCustomerIdAndAccountNumber(
                            customer.getId(), customer.getBankAccountNumber());

            if (existingAccount.isEmpty()) {
                // Create new bank account with initial deposit as balance
                com.fintech.finpro.entity.CustomerBankAccount account = com.fintech.finpro.entity.CustomerBankAccount
                        .builder()
                        .customer(customer)
                        .bank(customer.getBank())
                        .bankName(customer.getBank().getName())
                        .accountNumber(customer.getBankAccountNumber())
                        .accountType(com.fintech.finpro.enums.AccountType.SAVINGS)
                        .isPrimary(true)
                        .balance(initialDeposit) // Set initial deposit as balance
                        .status("ACTIVE")
                        .build();
                com.fintech.finpro.entity.CustomerBankAccount savedAccount = java.util.Objects
                        .requireNonNull(customerBankAccountRepository
                                .save(account));

                // If initial deposit > 0, create ledger transaction
                if (initialDeposit.compareTo(java.math.BigDecimal.ZERO) > 0) {
                    // Get or create customer ledger account
                    com.fintech.finpro.entity.LedgerAccount customerLedger = ledgerService.getOrCreateAccount(
                            customer.getFullName() + " - Ledger",
                            com.fintech.finpro.enums.LedgerAccountType.CUSTOMER_LEDGER,
                            customer.getId());

                    // Get or create Core Capital account (source of funds)
                    com.fintech.finpro.entity.LedgerAccount coreCapital = ledgerService.getOrCreateAccount(
                            "Core Capital",
                            LedgerAccountType.CORE_CAPITAL,
                            null);

                    // Record transaction: Core Capital -> Customer Ledger
                    // This will update both ledger account balances AND customer bank account
                    // balance
                    ledgerService.recordTransaction(
                            coreCapital,
                            customerLedger,
                            initialDeposit,
                            "Initial Deposit - " + customer.getFullName(),
                            com.fintech.finpro.enums.LedgerTransactionType.DEPOSIT,
                            null,
                            null,
                            null, // remarks
                            savedAccount);
                }
            }
        }
    }

    @Transactional
    public com.fintech.finpro.entity.CustomerBankAccount addSecondaryBankAccount(Long customerId,
            com.fintech.finpro.dto.AddBankAccountDTO dto) {
        Customer customer = customerRepository.findById(java.util.Objects.requireNonNull(customerId))
                .orElseThrow(() -> new RuntimeException("Customer not found with ID: " + customerId));

        com.fintech.finpro.entity.Bank bank = bankRepository.findById(java.util.Objects.requireNonNull(dto.getBankId()))
                .orElseThrow(() -> new RuntimeException("Bank not found with ID: " + dto.getBankId()));

        // Check if account already exists
        boolean exists = customerBankAccountRepository.findByCustomerIdAndAccountNumber(
                customerId, dto.getAccountNumber()).isPresent();

        if (exists) {
            throw new RuntimeException("Bank account already exists for this customer");
        }

        com.fintech.finpro.entity.CustomerBankAccount account = com.fintech.finpro.entity.CustomerBankAccount
                .builder()
                .customer(customer)
                .bank(bank)
                .bankName(bank.getName())
                .accountNumber(dto.getAccountNumber())
                .accountType(dto.getAccountType())
                .branchName(dto.getBranchName())
                .ifscCode(dto.getIfscCode())
                .isPrimary(false) // Secondary accounts are never primary
                .status("ACTIVE")
                .build();

        return java.util.Objects.requireNonNull(customerBankAccountRepository.save(account));
    }

    // File Upload Methods
    @org.springframework.beans.factory.annotation.Value("${file.upload.dir:uploads/customers}")
    private String uploadDir;

    public String uploadCustomerPhoto(Long customerId, org.springframework.web.multipart.MultipartFile file) {
        return uploadFile(customerId, file, "photo");
    }

    public String uploadCustomerSignature(Long customerId, org.springframework.web.multipart.MultipartFile file) {
        return uploadFile(customerId, file, "signature");
    }

    public String uploadGuardianPhoto(Long customerId, org.springframework.web.multipart.MultipartFile file) {
        return uploadFile(customerId, file, "guardian-photo");
    }

    public String uploadGuardianSignature(Long customerId, org.springframework.web.multipart.MultipartFile file) {
        return uploadFile(customerId, file, "guardian-signature");
    }

    private String uploadFile(Long customerId, org.springframework.web.multipart.MultipartFile file, String type) {
        try {
            // Validate file
            if (file.isEmpty()) {
                throw new RuntimeException("File is empty");
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new RuntimeException("Only image files are allowed");
            }

            // Validate file size (2MB max)
            if (file.getSize() > 2 * 1024 * 1024) {
                throw new RuntimeException("File size must not exceed 2MB");
            }

            // Get customer
            Customer customer = customerRepository.findById(java.util.Objects.requireNonNull(customerId))
                    .orElseThrow(() -> new RuntimeException("Customer not found with ID: " + customerId));

            // Create upload directory
            java.nio.file.Path uploadPath = java.nio.file.Paths.get(uploadDir, customerId.toString());
            if (!java.nio.file.Files.exists(uploadPath)) {
                java.nio.file.Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".jpg";
            String filename = type + "-" + System.currentTimeMillis() + extension;

            // Save file
            java.nio.file.Path filePath = uploadPath.resolve(filename);
            file.transferTo(java.util.Objects.requireNonNull(filePath.toFile()));

            // Update customer record
            String relativePath = uploadDir + "/" + customerId + "/" + filename;
            switch (type) {
                case "photo":
                    customer.setPhotoPath(relativePath);
                    break;
                case "signature":
                    customer.setSignaturePath(relativePath);
                    break;
                case "guardian-photo":
                    customer.setGuardianPhotoPath(relativePath);
                    break;
                case "guardian-signature":
                    customer.setGuardianSignaturePath(relativePath);
                    break;
            }
            customerRepository.save(customer);

            return relativePath;
        } catch (java.io.IOException e) {
            throw new RuntimeException("Failed to upload file: " + e.getMessage());
        }
    }
}

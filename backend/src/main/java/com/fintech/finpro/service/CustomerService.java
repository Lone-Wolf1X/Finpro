package com.fintech.finpro.service;

import com.fintech.finpro.dto.CustomerCreateDTO;
import com.fintech.finpro.dto.CustomerDraftDTO;
import com.fintech.finpro.dto.CustomerDTO;
import com.fintech.finpro.entity.Customer;
import com.fintech.finpro.enums.CustomerType;
import com.fintech.finpro.repository.CustomerRepository;
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
                .contactNumber(dto.getContactNumber())
                .bankAccountNumber(dto.getBankAccountNumber())
                .address(dto.getAddress())
                .citizenshipNumber(dto.getCitizenshipNumber())
                .nidNumber(dto.getNidNumber())
                .customerCode(generateCustomerCode())
                .kycStatus("PENDING")
                .build();

        // Set Bank
        com.fintech.finpro.entity.Bank bank = bankRepository.findById(dto.getBankId())
                .orElseThrow(() -> new RuntimeException("Bank not found with ID: " + dto.getBankId()));
        customer.setBank(bank);

        // Calculate age and determine type (will be done in @PrePersist)
        customer.calculateAge();
        customer.determineCustomerType();

        // Validate and set guardian for MINOR customers
        if (customer.isMinor()) {
            if (dto.getGuardianId() == null) {
                throw new RuntimeException("Guardian is required for minor customers (age < 18)");
            }
            Customer guardian = customerRepository.findById(dto.getGuardianId())
                    .orElseThrow(() -> new RuntimeException("Guardian not found with ID: " + dto.getGuardianId()));

            // Validate guardian is MAJOR and APPROVED
            if (!CustomerType.MAJOR.equals(guardian.getCustomerType())) {
                throw new RuntimeException("Guardian must be a MAJOR customer (age >= 18)");
            }
            if (!"APPROVED".equals(guardian.getKycStatus())) {
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
        return mapToDTO(saved);
    }

    @Transactional(readOnly = true)
    public CustomerDTO getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with ID: " + id));
        return mapToDTO(customer);
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
        return customerRepository.findByKycStatus(status).stream()
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
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with ID: " + id));

        // Update basic fields
        customer.setFirstName(dto.getFirstName());
        customer.setLastName(dto.getLastName());
        customer.setPhone(dto.getPhone());
        customer.setGender(dto.getGender());
        customer.setDateOfBirth(dto.getDateOfBirth());
        customer.setContactNumber(dto.getContactNumber());
        customer.setBankAccountNumber(dto.getBankAccountNumber());
        customer.setBankAccountNumber(dto.getBankAccountNumber());

        // Update Bank
        if (dto.getBankId() != null
                && (customer.getBank() == null || !customer.getBank().getId().equals(dto.getBankId()))) {
            com.fintech.finpro.entity.Bank bank = bankRepository.findById(dto.getBankId())
                    .orElseThrow(() -> new RuntimeException("Bank not found with ID: " + dto.getBankId()));
            customer.setBank(bank);
        }

        customer.setAddress(dto.getAddress());
        customer.setCitizenshipNumber(dto.getCitizenshipNumber());
        customer.setNidNumber(dto.getNidNumber());

        // Recalculate age and type
        customer.calculateAge();
        customer.determineCustomerType();

        // Handle guardian update
        if (customer.isMinor()) {
            if (dto.getGuardianId() == null) {
                throw new RuntimeException("Guardian is required for minor customers");
            }
            Customer guardian = customerRepository.findById(dto.getGuardianId())
                    .orElseThrow(() -> new RuntimeException("Guardian not found"));
            customer.setGuardian(guardian);
        } else {
            customer.setGuardian(null);
        }

        Customer saved = customerRepository.save(customer);
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
                .kycStatus("DRAFT")
                .build();

        // Bank is optional for draft
        if (dto.getBankId() != null && dto.getBankId() > 0) {
            com.fintech.finpro.entity.Bank bank = bankRepository.findById(dto.getBankId()).orElse(null);
            customer.setBank(bank);
        }

        // Calculate age/type if DOB present
        if (dto.getDateOfBirth() != null) {
            customer.calculateAge();
            customer.determineCustomerType();
        }

        // Guardian optional for draft
        if (dto.getGuardianId() != null) {
            customerRepository.findById(dto.getGuardianId()).ifPresent(customer::setGuardian);
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
        Customer customer = customerRepository.findById(id)
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
            bankRepository.findById(dto.getBankId()).ifPresent(customer::setBank);
        }

        if (dto.getGuardianId() != null) {
            customerRepository.findById(dto.getGuardianId()).ifPresent(customer::setGuardian);
        }

        if (dto.getGuardianName() != null)
            customer.setGuardianName(dto.getGuardianName());
        if (dto.getGuardianRelation() != null)
            customer.setGuardianRelation(dto.getGuardianRelation());

        // Re-calc
        customer.calculateAge();
        customer.determineCustomerType();

        Customer updated = customerRepository.save(customer);
        return mapToDTO(updated);
    }

    @Transactional
    public void deleteCustomer(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with ID: " + id));

        // Check if customer is a guardian for any minors
        List<Customer> dependents = customerRepository.findByGuardianId(id);
        if (!dependents.isEmpty()) {
            throw new RuntimeException(
                    "Cannot delete customer who is a guardian for " + dependents.size() + " minor(s)");
        }

        customerRepository.delete(customer);
    }

    @Transactional
    public CustomerDTO approveCustomer(Long id, Long approvedByUserId) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with ID: " + id));

        customer.setKycStatus("APPROVED");
        customer.setApprovedByUserId(approvedByUserId);

        Customer approved = customerRepository.save(customer);
        return mapToDTO(approved);
    }

    @Transactional
    public CustomerDTO rejectCustomer(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with ID: " + id));

        customer.setKycStatus("REJECTED");

        Customer rejected = customerRepository.save(customer);
        return mapToDTO(rejected);
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
                .kycStatus(customer.getKycStatus())
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
}

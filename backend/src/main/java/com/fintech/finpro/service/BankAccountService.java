package com.fintech.finpro.service;

import com.fintech.finpro.dto.BankAccountCreateDTO;
import com.fintech.finpro.dto.BankAccountDTO;
import com.fintech.finpro.entity.Customer;
import com.fintech.finpro.entity.CustomerBankAccount;
import com.fintech.finpro.repository.CustomerBankAccountRepository;
import com.fintech.finpro.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BankAccountService {

    private final CustomerBankAccountRepository bankAccountRepository;
    private final CustomerRepository customerRepository;

    @Transactional
    public BankAccountDTO createBankAccount(BankAccountCreateDTO dto) {
        // Validate customer exists
        Customer customer = customerRepository.findById(java.util.Objects.requireNonNull(dto.getCustomerId()))
                .orElseThrow(() -> new RuntimeException("Customer not found with ID: " + dto.getCustomerId()));

        // Check for duplicate account number
        if (bankAccountRepository.existsByCustomerIdAndAccountNumber(dto.getCustomerId(), dto.getAccountNumber())) {
            throw new RuntimeException("Bank account already exists for this customer");
        }

        // If this is set as primary, unset other primary accounts
        if (Boolean.TRUE.equals(dto.getIsPrimary())) {
            unsetPrimaryAccounts(dto.getCustomerId());
        }

        // Build bank account entity
        CustomerBankAccount bankAccount = CustomerBankAccount.builder()
                .customer(customer)
                .bankName(dto.getBankName())
                .accountNumber(dto.getAccountNumber())
                .accountType(dto.getAccountType())
                .ifscCode(dto.getIfscCode())
                .branchName(dto.getBranchName())
                .isPrimary(dto.getIsPrimary())
                .status("ACTIVE")
                .build();

        CustomerBankAccount saved = bankAccountRepository.save(java.util.Objects.requireNonNull(bankAccount));
        return mapToDTO(saved);
    }

    @Transactional(readOnly = true)
    public BankAccountDTO getBankAccountById(Long id) {
        CustomerBankAccount account = bankAccountRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Bank account not found with ID: " + id));
        return mapToDTO(account);
    }

    @Transactional(readOnly = true)
    public List<BankAccountDTO> getAccountsByCustomerId(Long customerId) {
        return bankAccountRepository.findByCustomerId(customerId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BankAccountDTO> getActiveAccountsByCustomerId(Long customerId) {
        return bankAccountRepository.findActiveAccountsByCustomerId(customerId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BankAccountDTO getPrimaryAccount(Long customerId) {
        return bankAccountRepository.findPrimaryAccountByCustomerId(customerId)
                .map(this::mapToDTO)
                .orElse(null);
    }

    @Transactional
    public BankAccountDTO setPrimaryAccount(Long accountId) {
        CustomerBankAccount account = bankAccountRepository.findById(java.util.Objects.requireNonNull(accountId))
                .orElseThrow(() -> new RuntimeException("Bank account not found with ID: " + accountId));

        // Unset other primary accounts for this customer
        unsetPrimaryAccounts(account.getCustomer().getId());

        // Set this as primary
        account.setIsPrimary(true);
        CustomerBankAccount updated = bankAccountRepository.save(account);

        return mapToDTO(updated);
    }

    @Transactional
    public BankAccountDTO updateBankAccount(Long id, BankAccountCreateDTO dto) {
        CustomerBankAccount account = bankAccountRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Bank account not found with ID: " + id));

        account.setBankName(dto.getBankName());
        account.setAccountNumber(dto.getAccountNumber());
        account.setAccountType(dto.getAccountType());
        account.setIfscCode(dto.getIfscCode());
        account.setBranchName(dto.getBranchName());

        // Handle primary flag
        if (Boolean.TRUE.equals(dto.getIsPrimary()) && !account.getIsPrimary()) {
            unsetPrimaryAccounts(account.getCustomer().getId());
            account.setIsPrimary(true);
        }

        CustomerBankAccount updated = bankAccountRepository.save(account);
        return mapToDTO(updated);
    }

    @Transactional
    public void deleteBankAccount(Long id) {
        CustomerBankAccount account = bankAccountRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Bank account not found with ID: " + id));

        // Don't allow deletion of primary account if there are other accounts
        if (account.getIsPrimary()) {
            List<CustomerBankAccount> otherAccounts = bankAccountRepository
                    .findByCustomerId(account.getCustomer().getId()).stream()
                    .filter(a -> !a.getId().equals(id))
                    .collect(Collectors.toList());

            if (!otherAccounts.isEmpty()) {
                throw new RuntimeException(
                        "Cannot delete primary account. Please set another account as primary first.");
            }
        }

        bankAccountRepository.delete(account);
    }

    private void unsetPrimaryAccounts(Long customerId) {
        bankAccountRepository.findPrimaryAccountByCustomerId(customerId)
                .ifPresent(account -> {
                    account.setIsPrimary(false);
                    bankAccountRepository.save(account);
                });
    }

    private BankAccountDTO mapToDTO(CustomerBankAccount account) {
        return BankAccountDTO.builder()
                .id(account.getId())
                .customerId(account.getCustomer().getId())
                .customerName(account.getCustomer().getFullName())
                .bankName(account.getBankName())
                .accountNumber(account.getAccountNumber())
                .accountType(account.getAccountType())
                .ifscCode(account.getIfscCode())
                .branchName(account.getBranchName())
                .isPrimary(account.getIsPrimary())
                .status(account.getStatus())
                .createdAt(account.getCreatedAt())
                .updatedAt(account.getUpdatedAt())
                .build();
    }
}

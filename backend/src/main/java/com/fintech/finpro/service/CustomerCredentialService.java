package com.fintech.finpro.service;

import com.fintech.finpro.dto.CustomerCredentialDTO;
import com.fintech.finpro.entity.Customer;
import com.fintech.finpro.entity.CustomerCredential;
import com.fintech.finpro.repository.CustomerCredentialRepository;
import com.fintech.finpro.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerCredentialService {

    private final CustomerCredentialRepository credentialRepository;
    private final CustomerRepository customerRepository;
    private final ModelMapper modelMapper;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<CustomerCredentialDTO> getCustomerCredentials(Long customerId) {
        return credentialRepository.findByCustomerIdAndIsActive(customerId, true)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public CustomerCredentialDTO createCredential(Long customerId, CustomerCredentialDTO dto) {
        Customer customer = customerRepository.findById(java.util.Objects.requireNonNull(customerId))
                .orElseThrow(() -> new RuntimeException("Customer not found with ID: " + customerId));

        CustomerCredential credential = CustomerCredential.builder()
                .customer(customer)
                .credentialType(dto.getCredentialType())
                .username(dto.getUsername())
                .notes(dto.getNotes())
                .isActive(true)
                .build();

        // Encrypt password if provided
        if (dto.getPassword() != null && !dto.getPassword().isEmpty()) {
            credential.setPassword(passwordEncoder.encode(dto.getPassword()));
        }

        // Encrypt PIN if provided
        if (dto.getPin() != null && !dto.getPin().isEmpty()) {
            credential.setPin(passwordEncoder.encode(dto.getPin()));
        }

        // CustomerCredential saved =
        // java.util.Objects.requireNonNull(credentialRepository.save(credential));
        return mapToDTO(credentialRepository.save(credential));
    }

    @Transactional
    public CustomerCredentialDTO updateCredential(Long customerId, Long credentialId, CustomerCredentialDTO dto) {
        CustomerCredential credential = credentialRepository.findById(java.util.Objects.requireNonNull(credentialId))
                .orElseThrow(() -> new RuntimeException("Credential not found with ID: " + credentialId));

        if (!credential.getCustomer().getId().equals(customerId)) {
            throw new RuntimeException("Credential does not belong to customer");
        }

        credential.setCredentialType(dto.getCredentialType());
        credential.setUsername(dto.getUsername());
        credential.setNotes(dto.getNotes());

        // Update password if provided
        if (dto.getPassword() != null && !dto.getPassword().isEmpty()) {
            credential.setPassword(passwordEncoder.encode(dto.getPassword()));
        }

        // Update PIN if provided
        if (dto.getPin() != null && !dto.getPin().isEmpty()) {
            credential.setPin(passwordEncoder.encode(dto.getPin()));
        }

        CustomerCredential updated = credentialRepository.save(credential);
        return mapToDTO(updated);
    }

    @Transactional
    public void deleteCredential(Long customerId, Long credentialId) {
        CustomerCredential credential = credentialRepository.findById(java.util.Objects.requireNonNull(credentialId))
                .orElseThrow(() -> new RuntimeException("Credential not found with ID: " + credentialId));

        if (!credential.getCustomer().getId().equals(customerId)) {
            throw new RuntimeException("Credential does not belong to customer");
        }

        // Soft delete
        credential.setIsActive(false);
        credentialRepository.save(credential);
    }

    private CustomerCredentialDTO mapToDTO(CustomerCredential credential) {
        CustomerCredentialDTO dto = modelMapper.map(credential, CustomerCredentialDTO.class);
        dto.setCustomerId(credential.getCustomer().getId());
        // Don't expose encrypted passwords/PINs in DTO
        dto.setPassword(null);
        dto.setPin(null);
        return dto;
    }
}

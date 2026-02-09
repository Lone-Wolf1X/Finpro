package com.fintech.finpro.service;

import com.fintech.finpro.dto.CustomerDTO;
import com.fintech.finpro.dto.CustomerCreateDTO;
import com.fintech.finpro.repository.CustomerBankAccountRepository;
import com.fintech.finpro.repository.CustomerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class BulkCustomerServiceTest {

    @Mock
    private CustomerService customerService;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private TransactionService transactionService;

    @Mock
    private CustomerBankAccountRepository customerBankAccountRepository;

    @InjectMocks
    private BulkCustomerService bulkCustomerService;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testTwoPassProcessingWithMinor() throws Exception {
        String csvContent = "FirstName,LastName,Email,MobileNumber,DateOfBirth,Gender,Address,BankAccountNumber,CitizenshipNumber,InitialDeposit,IsMinor,GuardianId,GuardianCitizenshipNumber,GuardianRelation\n"
                +
                "Mata,Paswan,mata@test.com,9800000001,1985-01-01,FEMALE,\"Lahan-7, Siraha\",9990000001,12345/67,1000,FALSE,,,\n"
                +
                "Bidur,Paswan,bidur@test.com,9842828204,2009-06-08,MALE,\"Lahan-7, Siraha\",1524414,,1000,TRUE,,12345/67,MOTHER";

        MockMultipartFile file = new MockMultipartFile("file", "test.csv", "text/csv", csvContent.getBytes());

        // Mock returns
        CustomerDTO majorDTO = new CustomerDTO();
        majorDTO.setId(100L);
        majorDTO.setCitizenshipNumber("12345/67");
        majorDTO.setBankAccountNumber("9990000001");

        CustomerDTO minorDTO = new CustomerDTO();
        minorDTO.setId(101L);
        minorDTO.setBankAccountNumber("1524414");

        // Stubbing: Return Major then Minor (since we expect 2 calls)
        // Or just return meaningful DTOs based on input checks if needed, but simple
        // sequence is enough for verification
        when(customerService.createCustomer(any())).thenReturn(majorDTO, minorDTO); // First call returns major, second
                                                                                    // minor

        // Mock finding guardian by citizenship number (which links Pass 2 to Pass 1
        // result)
        com.fintech.finpro.entity.Customer guardian = new com.fintech.finpro.entity.Customer();
        guardian.setId(100L);
        when(customerRepository.findByCitizenshipNumber("12345/67")).thenReturn(Optional.of(guardian));

        // Mock bank account finding for deposit
        com.fintech.finpro.entity.CustomerBankAccount majorAccount = new com.fintech.finpro.entity.CustomerBankAccount();
        when(customerBankAccountRepository.findByCustomerIdAndAccountNumber(anyLong(), anyString()))
                .thenReturn(Optional.of(majorAccount));

        // Execute
        bulkCustomerService.processBulkUpload(file, 1L, 1L);

        // Verify
        ArgumentCaptor<CustomerCreateDTO> captor = ArgumentCaptor.forClass(CustomerCreateDTO.class);
        verify(customerService, times(2)).createCustomer(captor.capture());

        List<CustomerCreateDTO> capturedValues = captor.getAllValues();
        assertEquals(2, capturedValues.size());

        // Validate First Call (Major)
        CustomerCreateDTO firstCall = capturedValues.get(0);
        assertEquals("mata@test.com", firstCall.getEmail());
        assertEquals("12345/67", firstCall.getCitizenshipNumber());

        // Validate Second Call (Minor)
        CustomerCreateDTO secondCall = capturedValues.get(1);
        assertEquals("bidur@test.com", secondCall.getEmail());
        assertEquals(100L, secondCall.getGuardianId());
        assertEquals("MOTHER", secondCall.getGuardianRelation());
    }
}

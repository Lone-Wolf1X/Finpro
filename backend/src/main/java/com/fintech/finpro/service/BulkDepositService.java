package com.fintech.finpro.service;

import com.fintech.finpro.dto.*;
import com.fintech.finpro.entity.*;
import com.fintech.finpro.enums.LedgerAccountType;
import com.fintech.finpro.enums.LedgerTransactionType;
import com.fintech.finpro.repository.*;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvException;

import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BulkDepositService {

    private final BulkDepositRepository bulkDepositRepository;
    private final BulkDepositItemRepository itemRepository;
    private final CustomerRepository customerRepository;
    private final LedgerService ledgerService;
    private final LedgerAccountRepository accountRepository;
    private final ModelMapper modelMapper;

    @Transactional
    public BulkDepositDTO createBulkDeposit(BulkDepositCreateDTO dto, Long makerId) {
        String batchId = "BATCH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        BigDecimal totalAmount = dto.getItems().stream()
                .map(BulkDepositItemCreateDTO::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BulkDeposit bulkDeposit = BulkDeposit.builder()
                .batchId(batchId)
                .makerId(makerId)
                .totalAmount(totalAmount)
                .itemCount(dto.getItems().size())
                .status("PENDING")
                .remarks(dto.getRemarks())
                .build();

        BulkDeposit savedBatch = bulkDepositRepository.save(bulkDeposit);
        if (savedBatch == null) {
            throw new RuntimeException("Failed to save bulk deposit batch");
        }

        List<BulkDepositItem> items = dto.getItems().stream().map(itemDto -> {
            Long customerId = itemDto.getCustomerId();
            if (customerId == null) {
                throw new RuntimeException("Customer ID is required");
            }
            Customer customer = customerRepository.findById(customerId)
                    .orElseThrow(() -> new RuntimeException("Customer not found: " + customerId));

            return BulkDepositItem.builder()
                    .bulkDeposit(savedBatch)
                    .customer(customer)
                    .amount(itemDto.getAmount())
                    .remarks(itemDto.getRemarks())
                    .status("PENDING")
                    .build();
        }).collect(Collectors.toList());

        if (items != null) {
            itemRepository.saveAll(java.util.Objects.requireNonNull(items));
            savedBatch.setItems(items);
        }

        return convertToDTO(savedBatch);
    }

    @Transactional
    public BulkDepositDTO createFromCSV(
            MultipartFile file,
            String bankName,
            String transactionReference,
            Long makerId) throws IOException, CsvException {

        // Validate file
        if (file.isEmpty()) {
            throw new RuntimeException("CSV file is empty");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".csv")) {
            throw new RuntimeException("File must be a CSV");
        }

        // Parse CSV
        List<String[]> csvData;
        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
            csvData = reader.readAll();
        }

        if (csvData.isEmpty()) {
            throw new RuntimeException("CSV file has no data");
        }

        // Validate header
        String[] header = csvData.get(0);
        if (header.length < 3) {
            throw new RuntimeException("CSV must have at least: Customer Code, Customer Name, Amount");
        }

        // Generate batch ID
        String batchId = "BATCH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // Auto-generate transaction reference if not provided
        if (transactionReference == null || transactionReference.trim().isEmpty()) {
            transactionReference = "TXN-" + java.time.LocalDateTime.now().format(
                    java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss")) + "-"
                    + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }

        // Parse items
        List<BulkDepositItem> items = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;
        List<String> errors = new ArrayList<>();

        for (int i = 1; i < csvData.size(); i++) {
            String[] row = csvData.get(i);
            if (row.length < 3) {
                errors.add("Row " + (i + 1) + ": Insufficient columns");
                continue;
            }

            String customerCode = row[0].trim();
            String amount = row[2].trim();
            String remarks = row.length > 3 ? row[3].trim() : "";
            String bankTxnRef = row.length > 4 ? row[4].trim() : "";

            // Validate customer
            Optional<Customer> customerOpt = customerRepository.findByCustomerCode(customerCode);
            if (customerOpt.isEmpty()) {
                errors.add("Row " + (i + 1) + ": Customer not found: " + customerCode);
                continue;
            }

            // Validate amount
            BigDecimal itemAmount;
            try {
                itemAmount = new BigDecimal(amount);
                if (itemAmount.compareTo(BigDecimal.ZERO) <= 0) {
                    errors.add("Row " + (i + 1) + ": Amount must be positive");
                    continue;
                }
            } catch (NumberFormatException e) {
                errors.add("Row " + (i + 1) + ": Invalid amount: " + amount);
                continue;
            }

            totalAmount = totalAmount.add(itemAmount);
            items.add(BulkDepositItem.builder()
                    .customer(customerOpt.get())
                    .amount(itemAmount)
                    .remarks(remarks)
                    .bankTransactionRef(bankTxnRef)
                    .status("PENDING")
                    .build());
        }

        if (items.isEmpty()) {
            throw new RuntimeException("No valid items found in CSV. Errors: " + String.join("; ", errors));
        }

        // Create bulk deposit
        BulkDeposit bulkDeposit = BulkDeposit.builder()
                .batchId(batchId)
                .makerId(makerId)
                .totalAmount(totalAmount)
                .itemCount(items.size())
                .status("PENDING")
                .bankName(bankName)
                .transactionReference(transactionReference)
                .uploadedFileName(filename)
                .uploadMethod("CSV_UPLOAD")
                .remarks(errors.isEmpty() ? "CSV Upload" : "CSV Upload with " + errors.size() + " errors")
                .build();

        BulkDeposit savedBatch = bulkDepositRepository.save(bulkDeposit);

        // Link items to batch
        items.forEach(item -> item.setBulkDeposit(savedBatch));
        itemRepository.saveAll(items);
        savedBatch.setItems(items);

        return convertToDTO(savedBatch);
    }

    @Transactional
    public BulkDepositDTO verifyBulkDeposit(String batchId, Long checkerId) {
        BulkDeposit batch = bulkDepositRepository.findByBatchId(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found: " + batchId));

        if (!"PENDING".equals(batch.getStatus())) {
            throw new RuntimeException("Batch is not in PENDING status");
        }

        // Process each item
        for (BulkDepositItem item : batch.getItems()) {
            processItemTransaction(item, checkerId);
            item.setStatus("PROCESSED");
        }

        batch.setStatus("APPROVED");
        batch.setCheckerId(checkerId);
        batch.setUpdatedAt(LocalDateTime.now());

        return convertToDTO(bulkDepositRepository.save(batch));
    }

    private void processItemTransaction(BulkDepositItem item, Long checkerId) {
        Customer customer = item.getCustomer();

        // Destination: Customer Ledger
        LedgerAccount destinationAcc = ledgerService.getOrCreateAccount(
                customer.getFullName(), LedgerAccountType.CUSTOMER_LEDGER, customer.getId());

        // Source: Investor Ledger or Core Capital
        LedgerAccount sourceAcc;
        if (customer.getInvestor() != null) {
            String investorName = customer.getInvestor().getUser().getFirstName() + " "
                    + customer.getInvestor().getUser().getLastName();
            sourceAcc = ledgerService.getOrCreateAccount(
                    investorName, LedgerAccountType.INVESTOR_LEDGER, customer.getInvestor().getId());
        } else {
            sourceAcc = accountRepository.findByAccountType(LedgerAccountType.CORE_CAPITAL)
                    .stream().findFirst()
                    .orElseThrow(() -> new RuntimeException("Core Capital account not found"));
        }

        String particulars = "Bulk Deposit: " + item.getBulkDeposit().getBatchId() + " - " + item.getRemarks();

        ledgerService.recordTransaction(
                sourceAcc,
                destinationAcc,
                item.getAmount(),
                particulars,
                LedgerTransactionType.DEPOSIT,
                item.getBulkDeposit().getBatchId(),
                item.getBulkDeposit().getMakerId());
    }

    @Transactional
    public BulkDepositDTO rejectBulkDeposit(String batchId, String remarks, Long checkerId) {
        BulkDeposit batch = bulkDepositRepository.findByBatchId(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found: " + batchId));

        batch.setStatus("REJECTED");
        batch.setRemarks(remarks);
        batch.setCheckerId(checkerId);

        return convertToDTO(bulkDepositRepository.save(batch));
    }

    public List<BulkDepositDTO> getAllBatches() {
        return bulkDepositRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public BulkDepositDTO getBatchByBatchId(String batchId) {
        return bulkDepositRepository.findByBatchId(batchId)
                .map(this::convertToDTO)
                .orElseThrow(() -> new RuntimeException("Batch not found: " + batchId));
    }

    private BulkDepositDTO convertToDTO(BulkDeposit entity) {
        BulkDepositDTO dto = modelMapper.map(entity, BulkDepositDTO.class);
        dto.setItems(entity.getItems().stream().map(item -> {
            BulkDepositItemDTO itemDto = modelMapper.map(item, BulkDepositItemDTO.class);
            itemDto.setCustomerName(item.getCustomer().getFullName());
            itemDto.setCustomerCode(item.getCustomer().getCustomerCode());
            return itemDto;
        }).collect(Collectors.toList()));
        return dto;
    }
}

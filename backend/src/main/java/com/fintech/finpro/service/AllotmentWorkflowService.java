package com.fintech.finpro.service;

import com.fintech.finpro.dto.AllotmentDraftDTO;
import com.fintech.finpro.dto.AllotmentSubmissionDTO;
import com.fintech.finpro.dto.IPOAllotmentSummaryDTO;
import com.fintech.finpro.entity.*;
import com.fintech.finpro.enums.IPOStatus;
import com.fintech.finpro.enums.LedgerAccountType;
import com.fintech.finpro.enums.LedgerTransactionType;
import com.fintech.finpro.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AllotmentWorkflowService {

        private final AllotmentDraftRepository draftRepository;
        private final IPOAllotmentSummaryRepository summaryRepository;
        private final IPOApplicationRepository applicationRepository;
        private final IPORepository ipoRepository;
        private final CustomerPortfolioRepository portfolioRepository;
        private final CustomerBankAccountRepository bankAccountRepository;
        private final AccountLienRepository lienRepository;
        private final UserRepository userRepository;
        private final LedgerService ledgerService;

        /**
         * Submit allotment decisions by Maker
         */
        @Transactional
        public String submitAllotmentDrafts(AllotmentSubmissionDTO dto, Long makerId) {
                IPO ipo = ipoRepository.findById(dto.getIpoId())
                                .orElseThrow(() -> new RuntimeException("IPO not found"));

                if (!IPOStatus.ALLOTMENT_PHASE.equals(ipo.getStatus())) {
                        throw new RuntimeException("IPO is not in ALLOTMENT_PHASE");
                }

                // Delete any existing pending drafts for this IPO
                draftRepository.deleteByIpoIdAndStatus(dto.getIpoId(), "PENDING_VERIFICATION");

                // Create new drafts
                for (AllotmentSubmissionDTO.AllotmentItemDTO item : dto.getItems()) {
                        IPOApplication application = applicationRepository.findById(item.getApplicationId())
                                        .orElseThrow(() -> new RuntimeException(
                                                        "Application not found: " + item.getApplicationId()));

                        AllotmentDraft draft = AllotmentDraft.builder()
                                        .ipo(ipo)
                                        .application(application)
                                        .customer(application.getCustomer())
                                        .isAllotted(item.getIsAllotted())
                                        .allottedQuantity(item.getIsAllotted() ? item.getQuantity() : 0)
                                        .makerId(makerId)
                                        .status("PENDING_VERIFICATION")
                                        .createdAt(LocalDateTime.now())
                                        .submittedAt(LocalDateTime.now())
                                        .build();

                        draftRepository.save(draft);
                }

                log.info("Maker {} submitted {} allotment decisions for IPO {}", makerId, dto.getItems().size(),
                                dto.getIpoId());
                return "Allotment drafts submitted successfully for verification";
        }

        /**
         * Get pending drafts for Checker verification
         */
        @Transactional(readOnly = true)
        public List<AllotmentDraftDTO> getPendingDrafts() {
                List<AllotmentDraft> drafts = draftRepository.findByStatus("PENDING_VERIFICATION");
                return drafts.stream().map(this::mapToDTO).collect(Collectors.toList());
        }

        /**
         * Get pending drafts for a specific IPO
         */
        @Transactional(readOnly = true)
        public List<AllotmentDraftDTO> getPendingDraftsByIPO(Long ipoId) {
                List<AllotmentDraft> drafts = draftRepository.findPendingDraftsByIpoId(ipoId);
                return drafts.stream().map(this::mapToDTO).collect(Collectors.toList());
        }

        /**
         * Verify and approve allotment drafts by Checker
         */
        @Transactional
        public String verifyAllotmentDrafts(Long ipoId, Long checkerId, boolean approve, String remarks) {
                List<AllotmentDraft> drafts = draftRepository.findPendingDraftsByIpoId(ipoId);

                if (drafts.isEmpty()) {
                        throw new RuntimeException("No pending drafts found for this IPO");
                }

                if (!approve) {
                        // Reject all drafts
                        for (AllotmentDraft draft : drafts) {
                                draft.setStatus("REJECTED");
                                draft.setCheckerId(checkerId);
                                draft.setVerifiedAt(LocalDateTime.now());
                                draft.setRemarks(remarks != null ? remarks : "Rejected by Checker");
                                draftRepository.save(draft);
                        }
                        log.info("Checker {} rejected {} drafts for IPO {}", checkerId, drafts.size(), ipoId);
                        return "Allotment drafts rejected";
                }

                // Approve and process settlement
                for (AllotmentDraft draft : drafts) {
                        draft.setStatus("APPROVED");
                        draft.setCheckerId(checkerId);
                        draft.setVerifiedAt(LocalDateTime.now());
                        draft.setRemarks(remarks);
                        draftRepository.save(draft);

                        // Process settlement for each application
                        processSettlement(draft, checkerId);
                }

                // Update IPO summary
                updateAllotmentSummary(ipoId, checkerId);

                // Update IPO status to ALLOTTED
                IPO ipo = ipoRepository.findById(ipoId)
                                .orElseThrow(() -> new RuntimeException("IPO not found"));
                ipo.setStatus(IPOStatus.ALLOTTED);
                ipoRepository.save(ipo);

                log.info("Checker {} approved and settled {} drafts for IPO {}", checkerId, drafts.size(), ipoId);
                return "Allotment approved and settlement completed";
        }

        /**
         * Process financial settlement for a single application
         */
        private void processSettlement(AllotmentDraft draft, Long checkerId) {
                IPOApplication application = draft.getApplication();
                Customer customer = draft.getCustomer();
                IPO ipo = draft.getIpo();

                if (draft.getIsAllotted()) {
                        // ALLOTTED: Unhold → Deduct → Add Shares
                        processAllottedSettlement(application, customer, ipo, draft.getAllottedQuantity(), checkerId);
                } else {
                        // NOT ALLOTTED: Release hold
                        processNotAllottedSettlement(application, customer, ipo);
                }

                // Update application status
                application.setAllotmentStatus(draft.getIsAllotted() ? "ALLOTTED" : "NOT_ALLOTTED");
                application.setAllotmentQuantity(draft.getAllottedQuantity());
                application.setUpdatedAt(LocalDateTime.now());
                applicationRepository.save(application);
        }

        /**
         * Process settlement for ALLOTTED application
         */
        private void processAllottedSettlement(IPOApplication application, Customer customer, IPO ipo,
                        Integer allottedQty, Long checkerId) {
                CustomerBankAccount bankAccount = application.getBankAccount();
                // 1. Calculations
                BigDecimal totalAppliedAmount = application.getAmount(); // Original amount held
                BigDecimal unitPrice = ipo.getPricePerShare();
                BigDecimal totalCost = unitPrice.multiply(new BigDecimal(allottedQty));

                // 2. Remove lien
                lienRepository.findByApplicationId(application.getId())
                                .ifPresent(lien -> {
                                        lien.setStatus("RELEASED");
                                        lien.setReleasedAt(LocalDateTime.now());
                                        lienRepository.save(lien);
                                });

                // 3. Create ledger transactions
                LedgerAccount customerLedger = ledgerService.getOrCreateAccount(
                                customer.getFullName() + " - Ledger",
                                LedgerAccountType.CUSTOMER_LEDGER,
                                customer.getId());

                LedgerAccount investedAcc = ledgerService.getOrCreateAccount(
                                "Invested Account",
                                LedgerAccountType.INVESTED_ACCOUNT,
                                null);

                // 1. Unhold original amount first (Internal)
                if (bankAccount != null) {
                        bankAccount.setHeldBalance(bankAccount.getHeldBalance().subtract(totalAppliedAmount));
                        bankAccountRepository.save(bankAccount);
                }

                // 2. Transfer Allotted Amount: Customer Ledger -> Invested Account
                ledgerService.recordTransaction(
                                customerLedger,
                                investedAcc,
                                totalCost,
                                String.format("IPO Allotment Settlement: %s - %d shares @ रू %s",
                                                ipo.getCompanyName(), allottedQty, unitPrice),
                                LedgerTransactionType.ALLOTMENT,
                                "ALLOT-" + application.getId(),
                                checkerId,
                                null, // remarks
                                bankAccount);

                // 4. Update portfolio
                List<CustomerPortfolio> portfolios = portfolioRepository
                                .findByCustomerIdAndScripSymbol(customer.getId(), ipo.getSymbol());
                CustomerPortfolio portfolio;
                if (portfolios.isEmpty()) {
                        portfolio = CustomerPortfolio.builder()
                                        .customer(customer)
                                        .ipo(ipo)
                                        .scripSymbol(ipo.getSymbol())
                                        .quantity(allottedQty)
                                        .purchasePrice(unitPrice)
                                        .totalCost(totalCost)
                                        .holdingSince(LocalDate.now())
                                        .status("HELD")
                                        .build();
                } else {
                        portfolio = portfolios.get(0);
                        portfolio.setQuantity(portfolio.getQuantity() + allottedQty);
                        portfolio.setTotalCost(portfolio.getTotalCost().add(totalCost));
                        // Assuming we don't change purchasePrice here, or we calculate weighted average
                }
                portfolioRepository.save(portfolio);
                log.info("Settled ALLOTTED application {} - {} shares to customer {}",
                                application.getId(), allottedQty, customer.getId());
        }

        /**
         * Process settlement for NOT ALLOTTED application
         */
        private void processNotAllottedSettlement(IPOApplication application, Customer customer, IPO ipo) {
                CustomerBankAccount bankAccount = application.getBankAccount();

                // 1. Release from held balance only (no deduction from actual balance)
                bankAccount.setHeldBalance(bankAccount.getHeldBalance().subtract(application.getAmount()));
                bankAccountRepository.save(bankAccount);

                // 2. Remove lien
                lienRepository.findByApplicationId(application.getId())
                                .ifPresent(lien -> {
                                        lien.setStatus("RELEASED");
                                        lien.setReleasedAt(LocalDateTime.now());
                                        lienRepository.save(lien);
                                });

                // 3. Create refund ledger entry
                LedgerAccount customerAcc = ledgerService.getOrCreateAccount(
                                customer.getFullName() + " - Ledger",
                                LedgerAccountType.CUSTOMER_LEDGER,
                                customer.getId());

                LedgerAccount suspenseAcc = ledgerService.getOrCreateAccount(
                                "IPO Suspense Account",
                                LedgerAccountType.SUSPENSE,
                                null);

                ledgerService.recordTransaction(
                                suspenseAcc,
                                customerAcc,
                                application.getAmount(),
                                String.format("IPO Not Allotted - Refund: %s", ipo.getCompanyName()),
                                LedgerTransactionType.REFUND,
                                "REFUND-" + application.getId(),
                                null,
                                null, // remarks
                                bankAccount);

                log.info("Settled NOT_ALLOTTED application {} - released रू {} for customer {}",
                                application.getId(), application.getAmount(), customer.getId());
        }

        /**
         * Update allotment summary for reporting
         */
        private void updateAllotmentSummary(Long ipoId, Long checkerId) {
                List<AllotmentDraft> allDrafts = draftRepository.findByIpoId(ipoId);

                int totalApps = allDrafts.size();
                int totalAllotted = (int) allDrafts.stream().filter(AllotmentDraft::getIsAllotted).count();
                int totalNotAllotted = totalApps - totalAllotted;
                int totalShares = allDrafts.stream()
                                .filter(AllotmentDraft::getIsAllotted)
                                .mapToInt(AllotmentDraft::getAllottedQuantity)
                                .sum();

                IPO ipo = ipoRepository.findById(ipoId)
                                .orElseThrow(() -> new RuntimeException("IPO not found"));

                BigDecimal totalAmount = allDrafts.stream()
                                .filter(AllotmentDraft::getIsAllotted)
                                .map(d -> ipo.getPricePerShare().multiply(new BigDecimal(d.getAllottedQuantity())))
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                IPOAllotmentSummary summary = summaryRepository.findByIpoId(ipoId)
                                .orElse(IPOAllotmentSummary.builder()
                                                .ipo(ipo)
                                                .build());

                summary.setTotalApplications(totalApps);
                summary.setTotalAllotted(totalAllotted);
                summary.setTotalNotAllotted(totalNotAllotted);
                summary.setTotalSharesAllotted(totalShares);
                summary.setTotalAmountSettled(totalAmount);
                summary.setCompletedBy(checkerId);
                summary.setCompletedAt(LocalDateTime.now());
                summary.setUpdatedAt(LocalDateTime.now());

                summaryRepository.save(summary);
        }

        /**
         * Get allotment summary for an IPO
         */
        @Transactional(readOnly = true)
        public IPOAllotmentSummaryDTO getAllotmentSummary(Long ipoId) {
                IPOAllotmentSummary summary = summaryRepository.findByIpoId(ipoId)
                                .orElseThrow(() -> new RuntimeException("No allotment summary found for this IPO"));

                return mapSummaryToDTO(summary);
        }

        /**
         * Get all allotment summaries
         */
        @Transactional(readOnly = true)
        public List<IPOAllotmentSummaryDTO> getAllSummaries() {
                List<IPOAllotmentSummary> summaries = summaryRepository
                                .findByCompletedAtIsNotNullOrderByCompletedAtDesc();
                return summaries.stream().map(this::mapSummaryToDTO).collect(Collectors.toList());
        }

        // Mapping methods
        private AllotmentDraftDTO mapToDTO(AllotmentDraft draft) {
                User maker = userRepository.findById(draft.getMakerId()).orElse(null);
                User checker = draft.getCheckerId() != null ? userRepository.findById(draft.getCheckerId()).orElse(null)
                                : null;

                return AllotmentDraftDTO.builder()
                                .id(draft.getId())
                                .ipoId(draft.getIpo().getId())
                                .ipoCompanyName(draft.getIpo().getCompanyName())
                                .ipoSymbol(draft.getIpo().getSymbol())
                                .applicationId(draft.getApplication().getId())
                                .applicationNumber(draft.getApplication().getApplicationNumber())
                                .customerId(draft.getCustomer().getId())
                                .customerName(draft.getCustomer().getFullName())
                                .appliedQuantity(draft.getApplication().getQuantity())
                                .appliedAmount(draft.getApplication().getAmount())
                                .isAllotted(draft.getIsAllotted())
                                .allottedQuantity(draft.getAllottedQuantity())
                                .status(draft.getStatus())
                                .makerId(draft.getMakerId())
                                .makerName(maker != null ? maker.getFirstName() + " " + maker.getLastName() : null)
                                .checkerId(draft.getCheckerId())
                                .checkerName(checker != null ? checker.getFirstName() + " " + checker.getLastName()
                                                : null)
                                .createdAt(draft.getCreatedAt())
                                .submittedAt(draft.getSubmittedAt())
                                .verifiedAt(draft.getVerifiedAt())
                                .remarks(draft.getRemarks())
                                .build();
        }

        private IPOAllotmentSummaryDTO mapSummaryToDTO(IPOAllotmentSummary summary) {
                User initiator = summary.getInitiatedBy() != null
                                ? userRepository.findById(summary.getInitiatedBy()).orElse(null)
                                : null;
                User completer = summary.getCompletedBy() != null
                                ? userRepository.findById(summary.getCompletedBy()).orElse(null)
                                : null;

                return IPOAllotmentSummaryDTO.builder()
                                .id(summary.getId())
                                .ipoId(summary.getIpo().getId())
                                .companyName(summary.getIpo().getCompanyName())
                                .symbol(summary.getIpo().getSymbol())
                                .totalApplications(summary.getTotalApplications())
                                .totalAllotted(summary.getTotalAllotted())
                                .totalNotAllotted(summary.getTotalNotAllotted())
                                .totalSharesAllotted(summary.getTotalSharesAllotted())
                                .totalAmountSettled(summary.getTotalAmountSettled())
                                .initiatedBy(initiator != null
                                                ? initiator.getFirstName() + " " + initiator.getLastName()
                                                : null)
                                .initiatedAt(summary.getInitiatedAt())
                                .completedBy(completer != null
                                                ? completer.getFirstName() + " " + completer.getLastName()
                                                : null)
                                .completedAt(summary.getCompletedAt())
                                .createdAt(summary.getCreatedAt())
                                .updatedAt(summary.getUpdatedAt())
                                .build();
        }
}

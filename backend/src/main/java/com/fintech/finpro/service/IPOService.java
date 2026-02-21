package com.fintech.finpro.service;

import com.fintech.finpro.dto.IPOCreateDTO;
import com.fintech.finpro.dto.IPODTO;
import com.fintech.finpro.entity.IPO;
import com.fintech.finpro.enums.IPOStatus;
import com.fintech.finpro.repository.IPORepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IPOService {

    private final IPORepository ipoRepository;
    private final com.fintech.finpro.repository.CustomerPortfolioRepository customerPortfolioRepository;

    @org.springframework.context.annotation.Lazy
    @org.springframework.beans.factory.annotation.Autowired
    private com.fintech.finpro.repository.IPOApplicationRepository applicationRepository;

    @org.springframework.context.annotation.Lazy
    @org.springframework.beans.factory.annotation.Autowired
    private com.fintech.finpro.service.IPOApplicationService applicationService;

    @Transactional
    public IPODTO createIPO(IPOCreateDTO dto) {
        // Validate dates
        if (dto.getCloseDate().isBefore(dto.getOpenDate())) {
            throw new RuntimeException("Close date must be after open date");
        }

        // Validate quantities
        if (dto.getMaxQuantity() < dto.getMinQuantity()) {
            throw new RuntimeException("Maximum quantity must be greater than or equal to minimum quantity");
        }

        // Determine initial status
        IPOStatus status = determineStatus(dto.getOpenDate(), dto.getCloseDate(), dto.getListingDate());

        IPO ipo = IPO.builder()
                .companyName(dto.getCompanyName())
                .symbol(dto.getSymbol())
                .issueSize(dto.getIssueSize())
                .pricePerShare(dto.getPricePerShare())
                .minQuantity(dto.getMinQuantity())
                .maxQuantity(dto.getMaxQuantity())
                .openDate(dto.getOpenDate())
                .closeDate(dto.getCloseDate())
                .allotmentDate(dto.getAllotmentDate())
                .listingDate(dto.getListingDate())
                .status(status)
                .description(dto.getDescription())
                .build();

        IPO saved = ipoRepository.save(java.util.Objects.requireNonNull(ipo));
        return mapToDTO(saved);
    }

    private IPOStatus determineStatus(LocalDateTime openDate, LocalDateTime closeDate, LocalDateTime listingDate) {
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(openDate)) {
            return IPOStatus.UPCOMING;
        } else if (now.isAfter(openDate) && now.isBefore(closeDate)) {
            return IPOStatus.OPEN;
        } else {
            return IPOStatus.CLOSED; // Default to CLOSED if past close date
        }
    }

    @Transactional(readOnly = true)
    public IPODTO getIPOById(Long id) {
        IPO ipo = ipoRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("IPO not found with ID: " + id));

        // Auto-update status if needed
        ipo = checkAndSwitchStatus(ipo);

        return mapToDTO(ipo);
    }

    @Transactional(readOnly = true)
    public List<IPODTO> getAllIPOs() {
        return ipoRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<IPODTO> getActiveIPOs() {
        return ipoRepository.findActiveIPOs().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<IPODTO> getUpcomingIPOs() {
        return ipoRepository.findUpcomingIPOs(LocalDateTime.now()).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<IPODTO> getIPOsByStatus(IPOStatus status) {
        return ipoRepository.findByStatus(status).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public IPODTO updateIPO(Long id, IPOCreateDTO dto) {
        IPO ipo = ipoRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("IPO not found with ID: " + id));

        ipo.setCompanyName(dto.getCompanyName());
        ipo.setSymbol(dto.getSymbol());
        ipo.setIssueSize(dto.getIssueSize());
        ipo.setPricePerShare(dto.getPricePerShare());
        ipo.setMinQuantity(dto.getMinQuantity());
        ipo.setMaxQuantity(dto.getMaxQuantity());
        ipo.setOpenDate(dto.getOpenDate());
        ipo.setCloseDate(dto.getCloseDate());
        ipo.setAllotmentDate(dto.getAllotmentDate());
        ipo.setListingDate(dto.getListingDate());
        ipo.setDescription(dto.getDescription());

        // Recalculate status based on new dates
        ipo.setStatus(determineStatus(ipo.getOpenDate(), ipo.getCloseDate(), ipo.getListingDate()));

        IPO updated = ipoRepository.save(ipo);
        return mapToDTO(updated);
    }

    @Transactional
    public IPODTO updateIPOStatus(Long id, IPOStatus status) {
        IPO ipo = ipoRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("IPO not found with ID: " + id));

        ipo.setStatus(status);
        IPO updated = ipoRepository.save(ipo);

        return mapToDTO(updated);
    }

    @Transactional
    public void deleteIPO(Long id) {
        IPO ipo = ipoRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("IPO not found with ID: " + id));

        // Only allow deletion if no applications exist (handled by FK constraint)
        ipoRepository.delete(java.util.Objects.requireNonNull(ipo));
    }

    @Transactional
    public IPODTO initiateAllotmentPhase(Long id, String adminName) {
        IPO ipo = ipoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("IPO not found with ID: " + id));

        if (!IPOStatus.CLOSED.equals(ipo.getStatus()) && !IPOStatus.OPEN.equals(ipo.getStatus())) {
            throw new RuntimeException("IPO must be CLOSED or OPEN to initiate allotment phase");
        }

        ipo.setStatus(IPOStatus.ALLOTMENT_PHASE);
        ipo.setAllotmentInitiatedAt(LocalDateTime.now());
        ipo.setAllotmentInitiatedBy(adminName);

        return mapToDTO(ipoRepository.save(ipo));
    }

    /**
     * Auto-close IPOs that have passed their close date
     */
    /**
     * Check and switch IPO status based on open/close dates
     * Runs every minute
     */
    @org.springframework.scheduling.annotation.Scheduled(fixedRate = 60000)
    @Transactional
    public void checkAndSwitchStatus() {
        LocalDateTime now = LocalDateTime.now();

        // 1. Switch UPCOMING -> OPEN
        // Use repository query for efficiency
        List<IPO> toOpen = ipoRepository.findIPOsToOpen(now);
        for (IPO ipo : toOpen) {
            ipo.setStatus(IPOStatus.OPEN);
            ipoRepository.save(ipo);
        }

        // 2. Switch OPEN -> CLOSED
        List<IPO> toClose = ipoRepository.findIPOsToClose(now);
        for (IPO ipo : toClose) {
            ipo.setStatus(IPOStatus.CLOSED);
            ipoRepository.save(ipo);
        }

        // 3. Switch CLOSED -> OPEN (if dates were extended manually but status not
        // updated, or simple correction)
        List<IPO> toReopen = ipoRepository.findIPOsToReopen(now);
        for (IPO ipo : toReopen) {
            ipo.setStatus(IPOStatus.OPEN);
            ipoRepository.save(ipo);
        }
    }

    /**
     * Checks current time against open/close dates and updates status if needed.
     * Returns the updated (or unchanged) IPO entity.
     */
    private IPO checkAndSwitchStatus(IPO ipo) {
        LocalDateTime now = LocalDateTime.now();
        boolean changed = false;

        if (ipo.getStatus() == IPOStatus.UPCOMING && now.isAfter(ipo.getOpenDate())) {
            // Should be OPEN?
            if (now.isBefore(ipo.getCloseDate())) {
                ipo.setStatus(IPOStatus.OPEN);
            } else {
                // Already passed close date?
                ipo.setStatus(IPOStatus.CLOSED);
            }
            changed = true;
        } else if (ipo.getStatus() == IPOStatus.OPEN && now.isAfter(ipo.getCloseDate())) {
            ipo.setStatus(IPOStatus.CLOSED);
            changed = true;
        } else if (ipo.getStatus() == IPOStatus.CLOSED && now.isAfter(ipo.getOpenDate())
                && now.isBefore(ipo.getCloseDate())) {
            // Dates are valid for OPEN, but it is CLOSED. Re-open it.
            ipo.setStatus(IPOStatus.OPEN);
            changed = true;
        }

        if (changed) {
            return ipoRepository.save(ipo);
        }
        return ipo;
    }

    @Transactional
    public IPODTO listIPO(Long ipoId) {
        IPO ipo = ipoRepository.findById(java.util.Objects.requireNonNull(ipoId))
                .orElseThrow(() -> new RuntimeException("IPO not found with ID: " + ipoId));

        if (ipo.getStatus() != IPOStatus.ALLOTTED) {
            throw new RuntimeException("IPO must be ALLOTTED to be listed");
        }

        // Update IPO Status
        ipo.setStatus(IPOStatus.LISTED);
        ipo = ipoRepository.save(ipo);

        // Activate Portfolios
        List<com.fintech.finpro.entity.CustomerPortfolio> portfolios = customerPortfolioRepository.findByIpo(ipo);

        for (com.fintech.finpro.entity.CustomerPortfolio p : portfolios) {
            p.setStatus("ACTIVE");
            customerPortfolioRepository.save(p);
        }

        return mapToDTO(ipo);
    }

    private IPODTO mapToDTO(IPO ipo) {
        return IPODTO.builder()
                .id(ipo.getId())
                .companyName(ipo.getCompanyName())
                .symbol(ipo.getSymbol())
                .issueSize(ipo.getIssueSize())
                .pricePerShare(ipo.getPricePerShare())
                .currentPrice(ipo.getCurrentPrice() != null ? ipo.getCurrentPrice() : ipo.getPricePerShare())
                .minQuantity(ipo.getMinQuantity())
                .maxQuantity(ipo.getMaxQuantity())
                .openDate(ipo.getOpenDate())
                .closeDate(ipo.getCloseDate())
                .allotmentDate(ipo.getAllotmentDate())
                .listingDate(ipo.getListingDate())
                .status(ipo.getStatus())
                .description(ipo.getDescription())
                .isOpen(ipo.isOpen())
                .isClosed(ipo.isClosed())
                .createdAt(ipo.getCreatedAt())
                .updatedAt(ipo.getUpdatedAt())
                .build();
    }
}

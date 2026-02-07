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
        IPOStatus status;
        LocalDateTime now = LocalDateTime.now();
        if (dto.getOpenDate().isAfter(now)) {
            status = IPOStatus.UPCOMING;
        } else if (!dto.getOpenDate().isAfter(now) && dto.getCloseDate().isAfter(now)) {
            status = IPOStatus.OPEN;
        } else {
            status = IPOStatus.CLOSED;
        }

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

    @Transactional(readOnly = true)
    public IPODTO getIPOById(Long id) {
        IPO ipo = ipoRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("IPO not found with ID: " + id));
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
        return ipoRepository.findUpcomingIPOs().stream()
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

    /**
     * Auto-close IPOs that have passed their close date
     */
    @Transactional
    public void autoCloseExpiredIPOs() {
        List<IPO> expiredIPOs = ipoRepository.findIPOsToClose();
        for (IPO ipo : expiredIPOs) {
            ipo.setStatus(IPOStatus.CLOSED);
            ipoRepository.save(ipo);
        }
    }

    private IPODTO mapToDTO(IPO ipo) {
        return IPODTO.builder()
                .id(ipo.getId())
                .companyName(ipo.getCompanyName())
                .symbol(ipo.getSymbol())
                .issueSize(ipo.getIssueSize())
                .pricePerShare(ipo.getPricePerShare())
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

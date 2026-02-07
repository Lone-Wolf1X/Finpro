package com.fintech.finpro.service;

import com.fintech.finpro.dto.BankDTO;
import com.fintech.finpro.entity.Bank;
import com.fintech.finpro.repository.BankRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BankService {

    private final BankRepository bankRepository;
    private final ModelMapper modelMapper;

    public BankDTO createBank(BankDTO dto) {
        if (bankRepository.findByName(dto.getName()).isPresent()) {
            throw new RuntimeException("Bank with this name already exists");
        }
        Bank bank = modelMapper.map(dto, Bank.class);
        bank = bankRepository.save(java.util.Objects.requireNonNull(bank));
        return modelMapper.map(bank, BankDTO.class);
    }

    public List<BankDTO> getAllBanks() {
        return bankRepository.findAll().stream()
                .map(bank -> modelMapper.map(bank, BankDTO.class))
                .collect(Collectors.toList());
    }

    public List<BankDTO> getActiveBanks() {
        return bankRepository.findByActiveTrue().stream()
                .map(bank -> modelMapper.map(bank, BankDTO.class))
                .collect(Collectors.toList());
    }

    public BankDTO updateBank(Long id, BankDTO dto) {
        Bank bank = bankRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Bank not found"));

        bank.setName(dto.getName());
        bank.setLocalBody(dto.getLocalBody());
        bank.setIsCasba(dto.getIsCasba());
        bank.setCasbaCharge(dto.getCasbaCharge());
        bank.setActive(dto.getActive());

        bank = bankRepository.save(bank);
        return modelMapper.map(bank, BankDTO.class);
    }

    public void deleteBank(Long id) {
        bankRepository.deleteById(java.util.Objects.requireNonNull(id));
    }
}

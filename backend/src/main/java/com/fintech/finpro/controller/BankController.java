package com.fintech.finpro.controller;

import com.fintech.finpro.dto.BankDTO;
import com.fintech.finpro.service.BankService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/banks")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BankController {

    private final BankService bankService;

    @PostMapping
    public ResponseEntity<BankDTO> createBank(@Valid @RequestBody BankDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bankService.createBank(dto));
    }

    @GetMapping
    public ResponseEntity<List<BankDTO>> getAllBanks(@RequestParam(required = false) Boolean activeOnly) {
        if (Boolean.TRUE.equals(activeOnly)) {
            return ResponseEntity.ok(bankService.getActiveBanks());
        }
        return ResponseEntity.ok(bankService.getAllBanks());
    }

    @PutMapping("/{id}")
    public ResponseEntity<BankDTO> updateBank(@PathVariable Long id, @Valid @RequestBody BankDTO dto) {
        return ResponseEntity.ok(bankService.updateBank(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBank(@PathVariable Long id) {
        bankService.deleteBank(id);
        return ResponseEntity.noContent().build();
    }
}

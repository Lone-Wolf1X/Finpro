package com.fintech.finpro.controller;

import com.fintech.finpro.dto.UserLimitRequestDTO;
import com.fintech.finpro.entity.User;
import com.fintech.finpro.entity.UserLimitRequest;
import com.fintech.finpro.repository.UserLimitRequestRepository;
import com.fintech.finpro.repository.UserRepository;
import com.fintech.finpro.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user-limits")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserLimitsController {

    private final UserRepository userRepository;
    private final UserLimitRequestRepository requestRepository;
    private final JwtService jwtService;

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getMyLimits(@RequestHeader("Authorization") String token) {
        Long userId = jwtService.extractUserId(token.substring(7));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(Map.of(
                "depositLimit", user.getDepositLimit(),
                "withdrawalLimit", user.getWithdrawalLimit()
        ));
    }

    @PostMapping("/request")
    @PreAuthorize("hasAnyRole('MAKER', 'CHECKER')")
    public ResponseEntity<UserLimitRequestDTO> createRequest(
            @RequestBody Map<String, BigDecimal> payload,
            @RequestHeader("Authorization") String token) {
        
        Long userId = jwtService.extractUserId(token.substring(7));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        BigDecimal requestedDepositLine = payload.get("depositLimit");
        BigDecimal requestedWithdrawalLimit = payload.get("withdrawalLimit");

        UserLimitRequest request = UserLimitRequest.builder()
                .requester(user)
                .requestedDepositLimit(requestedDepositLine)
                .requestedWithdrawalLimit(requestedWithdrawalLimit)
                .status("PENDING")
                .build();

        UserLimitRequest saved = requestRepository.save(request);
        return ResponseEntity.ok(mapToDTO(saved));
    }

    @GetMapping("/requests")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<List<UserLimitRequestDTO>> getAllRequests() {
        return ResponseEntity.ok(requestRepository.findByStatusOrderByCreatedAtDesc("PENDING").stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList()));
    }
    
    @GetMapping("/my-requests")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<UserLimitRequestDTO>> getMyRequests(@RequestHeader("Authorization") String token) {
        Long userId = jwtService.extractUserId(token.substring(7));
         return ResponseEntity.ok(requestRepository.findByRequesterIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList()));
    }


    @PutMapping("/requests/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<UserLimitRequestDTO> approveRequest(
            @PathVariable Long id,
            @RequestHeader("Authorization") String token) {
        
        Long adminId = jwtService.extractUserId(token.substring(7));
        UserLimitRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        
        if (!"PENDING".equals(request.getStatus())) {
            throw new RuntimeException("Request is already processed");
        }

        request.setStatus("APPROVED");
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewedByUserId(adminId);
        
        // Update User Limits
        User user = request.getRequester();
        if (request.getRequestedDepositLimit() != null) {
            user.setDepositLimit(request.getRequestedDepositLimit());
        }
        if (request.getRequestedWithdrawalLimit() != null) {
            user.setWithdrawalLimit(request.getRequestedWithdrawalLimit());
        }
        userRepository.save(user);
        
        return ResponseEntity.ok(mapToDTO(requestRepository.save(request)));
    }

    @PutMapping("/requests/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<UserLimitRequestDTO> rejectRequest(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            @RequestHeader("Authorization") String token) {
        
        Long adminId = jwtService.extractUserId(token.substring(7));
        UserLimitRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!"PENDING".equals(request.getStatus())) {
            throw new RuntimeException("Request is already processed");
        }

        request.setStatus("REJECTED");
        request.setAdminComments(payload.get("comments"));
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewedByUserId(adminId);
        
        return ResponseEntity.ok(mapToDTO(requestRepository.save(request)));
    }
    
    @PutMapping("/users/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Map<String, Object>> updateUserLimits(
        @PathVariable Long userId,
        @RequestBody Map<String, BigDecimal> payload
    ) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
            
        if (payload.containsKey("depositLimit")) {
            user.setDepositLimit(payload.get("depositLimit"));
        }
        if (payload.containsKey("withdrawalLimit")) {
            user.setWithdrawalLimit(payload.get("withdrawalLimit"));
        }
        
        userRepository.save(user);
        
        return ResponseEntity.ok(Map.of(
            "message", "User limits updated successfully",
            "depositLimit", user.getDepositLimit(),
            "withdrawalLimit", user.getWithdrawalLimit()
        ));
    }

    private UserLimitRequestDTO mapToDTO(UserLimitRequest request) {
        return UserLimitRequestDTO.builder()
                .id(request.getId())
                .requesterId(request.getRequester().getId())
                .requesterName(request.getRequester().getFullName())
                .currentDepositLimit(request.getRequester().getDepositLimit())
                .currentWithdrawalLimit(request.getRequester().getWithdrawalLimit())
                .requestedDepositLimit(request.getRequestedDepositLimit())
                .requestedWithdrawalLimit(request.getRequestedWithdrawalLimit())
                .status(request.getStatus())
                .adminComments(request.getAdminComments())
                .createdAt(request.getCreatedAt())
                .reviewedAt(request.getReviewedAt())
                .reviewedByUserId(request.getReviewedByUserId())
                .build();
    }
}

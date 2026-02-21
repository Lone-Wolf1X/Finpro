package com.fintech.finpro.dto;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
public class UserLimitRequestDTO {

    public static UserLimitRequestDTOBuilder builder() {
        return new UserLimitRequestDTOBuilder();
    }

    public static class UserLimitRequestDTOBuilder {
        private Long id;
        private Long requesterId;
        private String requesterName;
        private BigDecimal currentDepositLimit;
        private BigDecimal currentWithdrawalLimit;
        private BigDecimal requestedDepositLimit;
        private BigDecimal requestedWithdrawalLimit;
        private String status;
        private String adminComments;
        private LocalDateTime createdAt;
        private LocalDateTime reviewedAt;
        private Long reviewedByUserId;

        public UserLimitRequestDTOBuilder id(Long id) { this.id = id; return this; }
        public UserLimitRequestDTOBuilder requesterId(Long requesterId) { this.requesterId = requesterId; return this; }
        public UserLimitRequestDTOBuilder requesterName(String requesterName) { this.requesterName = requesterName; return this; }
        public UserLimitRequestDTOBuilder currentDepositLimit(BigDecimal currentDepositLimit) { this.currentDepositLimit = currentDepositLimit; return this; }
        public UserLimitRequestDTOBuilder currentWithdrawalLimit(BigDecimal currentWithdrawalLimit) { this.currentWithdrawalLimit = currentWithdrawalLimit; return this; }
        public UserLimitRequestDTOBuilder requestedDepositLimit(BigDecimal requestedDepositLimit) { this.requestedDepositLimit = requestedDepositLimit; return this; }
        public UserLimitRequestDTOBuilder requestedWithdrawalLimit(BigDecimal requestedWithdrawalLimit) { this.requestedWithdrawalLimit = requestedWithdrawalLimit; return this; }
        public UserLimitRequestDTOBuilder status(String status) { this.status = status; return this; }
        public UserLimitRequestDTOBuilder adminComments(String adminComments) { this.adminComments = adminComments; return this; }
        public UserLimitRequestDTOBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public UserLimitRequestDTOBuilder reviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; return this; }
        public UserLimitRequestDTOBuilder reviewedByUserId(Long reviewedByUserId) { this.reviewedByUserId = reviewedByUserId; return this; }

        public UserLimitRequestDTO build() {
            UserLimitRequestDTO dto = new UserLimitRequestDTO();
            dto.setId(id);
            dto.setRequesterId(requesterId);
            dto.setRequesterName(requesterName);
            dto.setCurrentDepositLimit(currentDepositLimit);
            dto.setCurrentWithdrawalLimit(currentWithdrawalLimit);
            dto.setRequestedDepositLimit(requestedDepositLimit);
            dto.setRequestedWithdrawalLimit(requestedWithdrawalLimit);
            dto.setStatus(status);
            dto.setAdminComments(adminComments);
            dto.setCreatedAt(createdAt);
            dto.setReviewedAt(reviewedAt);
            dto.setReviewedByUserId(reviewedByUserId);
            return dto;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getRequesterId() { return requesterId; }
    public void setRequesterId(Long requesterId) { this.requesterId = requesterId; }
    public String getRequesterName() { return requesterName; }
    public void setRequesterName(String requesterName) { this.requesterName = requesterName; }
    public BigDecimal getCurrentDepositLimit() { return currentDepositLimit; }
    public void setCurrentDepositLimit(BigDecimal currentDepositLimit) { this.currentDepositLimit = currentDepositLimit; }
    public BigDecimal getCurrentWithdrawalLimit() { return currentWithdrawalLimit; }
    public void setCurrentWithdrawalLimit(BigDecimal currentWithdrawalLimit) { this.currentWithdrawalLimit = currentWithdrawalLimit; }
    public BigDecimal getRequestedDepositLimit() { return requestedDepositLimit; }
    public void setRequestedDepositLimit(BigDecimal requestedDepositLimit) { this.requestedDepositLimit = requestedDepositLimit; }
    public BigDecimal getRequestedWithdrawalLimit() { return requestedWithdrawalLimit; }
    public void setRequestedWithdrawalLimit(BigDecimal requestedWithdrawalLimit) { this.requestedWithdrawalLimit = requestedWithdrawalLimit; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getAdminComments() { return adminComments; }
    public void setAdminComments(String adminComments) { this.adminComments = adminComments; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
    public Long getReviewedByUserId() { return reviewedByUserId; }
    public void setReviewedByUserId(Long reviewedByUserId) { this.reviewedByUserId = reviewedByUserId; }

    private Long id;
    private Long requesterId;
    private String requesterName;
    private BigDecimal currentDepositLimit;
    private BigDecimal currentWithdrawalLimit;
    private BigDecimal requestedDepositLimit;
    private BigDecimal requestedWithdrawalLimit;
    private String status;
    private String adminComments;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
    private Long reviewedByUserId;
}

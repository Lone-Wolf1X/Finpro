package com.fintech.finpro.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_limit_requests")
@NoArgsConstructor
@AllArgsConstructor
public class UserLimitRequest extends BaseEntity {

    public static UserLimitRequestBuilder builder() {
        return new UserLimitRequestBuilder();
    }

    public static class UserLimitRequestBuilder {
        private User requester;
        private BigDecimal requestedDepositLimit;
        private BigDecimal requestedWithdrawalLimit;
        private String status;
        private String adminComments;
        private LocalDateTime reviewedAt;
        private Long reviewedByUserId;

        public UserLimitRequestBuilder requester(User requester) { this.requester = requester; return this; }
        public UserLimitRequestBuilder requestedDepositLimit(BigDecimal requestedDepositLimit) { this.requestedDepositLimit = requestedDepositLimit; return this; }
        public UserLimitRequestBuilder requestedWithdrawalLimit(BigDecimal requestedWithdrawalLimit) { this.requestedWithdrawalLimit = requestedWithdrawalLimit; return this; }
        public UserLimitRequestBuilder status(String status) { this.status = status; return this; }
        public UserLimitRequestBuilder adminComments(String adminComments) { this.adminComments = adminComments; return this; }
        public UserLimitRequestBuilder reviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; return this; }
        public UserLimitRequestBuilder reviewedByUserId(Long reviewedByUserId) { this.reviewedByUserId = reviewedByUserId; return this; }

        public UserLimitRequest build() {
            UserLimitRequest request = new UserLimitRequest();
            request.setRequester(requester);
            request.setRequestedDepositLimit(requestedDepositLimit);
            request.setRequestedWithdrawalLimit(requestedWithdrawalLimit);
            request.setStatus(status);
            request.setAdminComments(adminComments);
            request.setReviewedAt(reviewedAt);
            request.setReviewedByUserId(reviewedByUserId);
            return request;
        }
    }

    public User getRequester() { return requester; }
    public void setRequester(User requester) { this.requester = requester; }
    public BigDecimal getRequestedDepositLimit() { return requestedDepositLimit; }
    public void setRequestedDepositLimit(BigDecimal requestedDepositLimit) { this.requestedDepositLimit = requestedDepositLimit; }
    public BigDecimal getRequestedWithdrawalLimit() { return requestedWithdrawalLimit; }
    public void setRequestedWithdrawalLimit(BigDecimal requestedWithdrawalLimit) { this.requestedWithdrawalLimit = requestedWithdrawalLimit; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getAdminComments() { return adminComments; }
    public void setAdminComments(String adminComments) { this.adminComments = adminComments; }
    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
    public Long getReviewedByUserId() { return reviewedByUserId; }
    public void setReviewedByUserId(Long reviewedByUserId) { this.reviewedByUserId = reviewedByUserId; }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User requester;

    @Column(name = "requested_deposit_limit", precision = 19, scale = 2)
    private BigDecimal requestedDepositLimit;

    @Column(name = "requested_withdrawal_limit", precision = 19, scale = 2)
    private BigDecimal requestedWithdrawalLimit;

    @Column(nullable = false, length = 20)
    private String status; // PENDING, APPROVED, REJECTED

    @Column(name = "admin_comments", length = 500)
    private String adminComments;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "reviewed_by")
    private Long reviewedByUserId;
}

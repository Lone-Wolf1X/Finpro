package com.fintech.finpro.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
public class IPOApplicationCreateDTO {

    public static IPOApplicationCreateDTOBuilder builder() {
        return new IPOApplicationCreateDTOBuilder();
    }

    public static class IPOApplicationCreateDTOBuilder {
        private Long customerId;
        private Long ipoId;
        private Long bankAccountId;
        private Long makerId;
        private Integer quantity;

        public IPOApplicationCreateDTOBuilder customerId(Long customerId) { this.customerId = customerId; return this; }
        public IPOApplicationCreateDTOBuilder ipoId(Long ipoId) { this.ipoId = ipoId; return this; }
        public IPOApplicationCreateDTOBuilder bankAccountId(Long bankAccountId) { this.bankAccountId = bankAccountId; return this; }
        public IPOApplicationCreateDTOBuilder makerId(Long makerId) { this.makerId = makerId; return this; }
        public IPOApplicationCreateDTOBuilder quantity(Integer quantity) { this.quantity = quantity; return this; }

        public IPOApplicationCreateDTO build() {
            IPOApplicationCreateDTO dto = new IPOApplicationCreateDTO();
            dto.setCustomerId(customerId);
            dto.setIpoId(ipoId);
            dto.setBankAccountId(bankAccountId);
            dto.setMakerId(makerId);
            dto.setQuantity(quantity);
            return dto;
        }
    }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public Long getIpoId() { return ipoId; }
    public void setIpoId(Long ipoId) { this.ipoId = ipoId; }
    public Long getBankAccountId() { return bankAccountId; }
    public void setBankAccountId(Long bankAccountId) { this.bankAccountId = bankAccountId; }
    public Long getMakerId() { return makerId; }
    public void setMakerId(Long makerId) { this.makerId = makerId; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotNull(message = "IPO ID is required")
    private Long ipoId;

    @NotNull(message = "Bank account ID is required")
    private Long bankAccountId;

    private Long makerId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
}

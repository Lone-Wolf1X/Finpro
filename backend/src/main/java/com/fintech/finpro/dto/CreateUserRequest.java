package com.fintech.finpro.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
public class CreateUserRequest {

    public static CreateUserRequestBuilder builder() {
        return new CreateUserRequestBuilder();
    }

    public static class CreateUserRequestBuilder {
        private String email;
        private String password;
        private String name;
        private String firstName;
        private String lastName;
        private String role;
        private Long tenantId;
        private String staffId;
        private String phone;

        public CreateUserRequestBuilder email(String email) { this.email = email; return this; }
        public CreateUserRequestBuilder password(String password) { this.password = password; return this; }
        public CreateUserRequestBuilder name(String name) { this.name = name; return this; }
        public CreateUserRequestBuilder firstName(String firstName) { this.firstName = firstName; return this; }
        public CreateUserRequestBuilder lastName(String lastName) { this.lastName = lastName; return this; }
        public CreateUserRequestBuilder role(String role) { this.role = role; return this; }
        public CreateUserRequestBuilder tenantId(Long tenantId) { this.tenantId = tenantId; return this; }
        public CreateUserRequestBuilder staffId(String staffId) { this.staffId = staffId; return this; }
        public CreateUserRequestBuilder phone(String phone) { this.phone = phone; return this; }

        public CreateUserRequest build() {
            CreateUserRequest request = new CreateUserRequest();
            request.setEmail(email);
            request.setPassword(password);
            request.setName(name);
            request.setFirstName(firstName);
            request.setLastName(lastName);
            request.setRole(role);
            request.setTenantId(tenantId);
            request.setStaffId(staffId);
            request.setPhone(phone);
            return request;
        }
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public Long getTenantId() { return tenantId; }
    public void setTenantId(Long tenantId) { this.tenantId = tenantId; }
    public String getStaffId() { return staffId; }
    public void setStaffId(String staffId) { this.staffId = staffId; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    @NotBlank(message = "Name is required")
    private String name;

    private String firstName;
    private String lastName;

    @NotBlank(message = "Role is required")
    private String role;

    @NotNull(message = "Tenant ID is required")
    private Long tenantId;

    private String staffId;
    private String phone;
}

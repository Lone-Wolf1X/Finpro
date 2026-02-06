package com.fintech.finpro.service.impl;

import com.fintech.finpro.dto.CreateUserRequest;
import com.fintech.finpro.dto.UpdateUserRequest;
import com.fintech.finpro.dto.UserDTO;
import com.fintech.finpro.entity.User;
import com.fintech.finpro.enums.Role;
import com.fintech.finpro.repository.UserRepository;
import com.fintech.finpro.service.UserService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final ModelMapper modelMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public List<UserDTO> getAllUsers() {
        String currentUserEmail = com.fintech.finpro.security.SecurityUtils.getCurrentUserEmail();
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Current user context not found"));

        List<User> users;
        if (currentUser.getRole() == Role.SUPERADMIN) {
            // Superadmin can see everyone
            users = userRepository.findAll();
        } else {
            // Admin/Maker/Checker can only see users of their tenant
            // And they should NOT see SUPERADMINs (Privacy requirement)
            users = userRepository.findByTenantId(currentUser.getTenantId()).stream()
                    .filter(u -> u.getRole() != Role.SUPERADMIN)
                    .collect(Collectors.toList());
        }

        return users.stream()
                .map(user -> modelMapper.map(user, UserDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        // Check access
        String currentUserEmail = com.fintech.finpro.security.SecurityUtils.getCurrentUserEmail();
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Current user context not found"));

        if (currentUser.getRole() != Role.SUPERADMIN && !user.getTenantId().equals(currentUser.getTenantId())) {
            throw new RuntimeException("Access denied to user from different tenant");
        }

        return modelMapper.map(user, UserDTO.class);
    }

    @Override
    @Transactional
    public UserDTO createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists: " + request.getEmail());
        }

        String currentUserEmail = com.fintech.finpro.security.SecurityUtils.getCurrentUserEmail();
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Current user context not found"));

        // Enforce role creation rules
        Role targetRole = Role.valueOf(request.getRole());
        if (currentUser.getRole() != Role.SUPERADMIN) {
            if (targetRole == Role.SUPERADMIN) {
                throw new RuntimeException("Admins cannot create Superadmins");
            }
            // For SaaS, Admins create users for their own tenant
            request.setTenantId(currentUser.getTenantId());
        }

        User user = modelMapper.map(request, User.class);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        // Handle missing name logic (if name is missing in request but required in
        // entity)
        if (user.getName() == null || user.getName().isEmpty()) {
            String fullName = "";
            if (user.getFirstName() != null)
                fullName += user.getFirstName();
            if (user.getLastName() != null)
                fullName += (fullName.isEmpty() ? "" : " ") + user.getLastName();
            user.setName(fullName.isEmpty() ? user.getEmail() : fullName);
        }

        // Generate automatic fields if missing
        if (user.getStaffId() == null || user.getStaffId().isEmpty()) {
            user.setStaffId("STAFF-" + System.currentTimeMillis());
        }
        if (user.getUserId() == null || user.getUserId().isEmpty()) {
            user.setUserId(user.getStaffId());
        }

        // Ensure status is set
        if (user.getStatus() == null) {
            user.setStatus("ACTIVE");
        }

        User savedUser = userRepository.save(user);
        return modelMapper.map(savedUser, UserDTO.class);
    }

    @Override
    @Transactional
    public UserDTO updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        String currentUserEmail = com.fintech.finpro.security.SecurityUtils.getCurrentUserEmail();
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Current user context not found"));

        // Check access
        if (currentUser.getRole() != Role.SUPERADMIN && !user.getTenantId().equals(currentUser.getTenantId())) {
            throw new RuntimeException("Access denied to update user from different tenant");
        }

        // Prevent Admin from upgrading themselves or others to SUPERADMIN
        if (request.getRole() != null && Role.valueOf(request.getRole()) == Role.SUPERADMIN
                && currentUser.getRole() != Role.SUPERADMIN) {
            throw new RuntimeException("Permission denied to assign SUPERADMIN role");
        }

        // Update fields if they are not null
        if (request.getName() != null)
            user.setName(request.getName());
        if (request.getFirstName() != null)
            user.setFirstName(request.getFirstName());
        if (request.getLastName() != null)
            user.setLastName(request.getLastName());
        if (request.getPhone() != null)
            user.setPhone(request.getPhone());
        if (request.getRole() != null)
            user.setRole(Role.valueOf(request.getRole()));
        if (request.getStatus() != null)
            user.setStatus(request.getStatus());
        if (request.getAvatarUrl() != null)
            user.setAvatarUrl(request.getAvatarUrl());

        // Handle Password Reset
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            user.setMustChangePassword(true); // Force change on next login
        }

        // Handle User ID Update
        if (request.getUserId() != null && !request.getUserId().isEmpty()) {
            // Check uniqueness if changed
            if (!user.getUserId().equals(request.getUserId()) && userRepository.existsByUserId(request.getUserId())) {
                throw new RuntimeException("User ID already exists: " + request.getUserId());
            }
            user.setUserId(request.getUserId());
        }

        // Handle Staff ID Update
        if (request.getStaffId() != null && !request.getStaffId().isEmpty()) {
            // Check uniqueness if changed
            if (!user.getStaffId().equals(request.getStaffId())
                    && userRepository.existsByStaffId(request.getStaffId())) {
                throw new RuntimeException("Staff ID already exists: " + request.getStaffId());
            }
            user.setStaffId(request.getStaffId());
        }

        User updatedUser = userRepository.save(user);
        return modelMapper.map(updatedUser, UserDTO.class);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found with id: " + id);
        }
        // Hard delete for now, implementing soft delete is an option but CRUD usually
        // implies ability to remove.
        // Or we can just set status to INACTIVE. Let's do hard delete as per standard
        // CRUD,
        // but typically in finance we soft delete. For now, stick to repository delete.
        userRepository.deleteById(id);
    }
}

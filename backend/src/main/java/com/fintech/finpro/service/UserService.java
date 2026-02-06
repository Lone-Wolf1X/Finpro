package com.fintech.finpro.service;

import com.fintech.finpro.dto.CreateUserRequest;
import com.fintech.finpro.dto.UpdateUserRequest;
import com.fintech.finpro.dto.UserDTO;

import java.util.List;

public interface UserService {
    List<UserDTO> getAllUsers();

    UserDTO getUserById(Long id);

    UserDTO createUser(CreateUserRequest request);

    UserDTO updateUser(Long id, UpdateUserRequest request);

    void deleteUser(Long id);
}

import apiClient from '@/api/apiClient';
import { User, CreateUserRequest, UpdateUserRequest } from '@/types';

export const userService = {
    getUsers: async (): Promise<User[]> => {
        const response = await apiClient.get<User[]>('/users');
        return response.data;
    },

    getUserById: async (id: number): Promise<User> => {
        const response = await apiClient.get<User>(`/users/${id}`);
        return response.data;
    },

    createUser: async (data: CreateUserRequest): Promise<User> => {
        const response = await apiClient.post<User>('/users', data);
        return response.data;
    },

    updateUser: async (id: number, data: UpdateUserRequest): Promise<User> => {
        const response = await apiClient.put<User>(`/users/${id}`, data);
        return response.data;
    },

    deleteUser: async (id: number): Promise<void> => {
        await apiClient.delete(`/users/${id}`);
    },
};

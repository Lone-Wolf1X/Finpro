import apiClient from '@/api/apiClient';
import { Customer, CreateCustomerRequest } from '@/types';

export const customerService = {
    getAllCustomers: async (status?: string): Promise<Customer[]> => {
        const params = status ? { status } : {};
        const response = await apiClient.get<Customer[]>('/customers', { params });
        return response.data;
    },

    createCustomer: async (data: CreateCustomerRequest): Promise<Customer> => {
        const response = await apiClient.post<Customer>('/customers', data);
        return response.data;
    },

    approveCustomer: async (id: number): Promise<Customer> => {
        const response = await apiClient.post<Customer>(`/customers/${id}/approve`);
        return response.data;
    },
};

import apiClient from './apiClient';
import { Bank, BankCreateDTO } from '../types/bank.types';

const API_URL = '/banks';

export const getBanks = async (activeOnly?: boolean): Promise<Bank[]> => {
    const response = await apiClient.get(API_URL, { params: { activeOnly } });
    return response.data;
};

export const createBank = async (bank: BankCreateDTO): Promise<Bank> => {
    const response = await apiClient.post(API_URL, bank);
    return response.data;
};

export const updateBank = async (id: number, bank: BankCreateDTO): Promise<Bank> => {
    const response = await apiClient.put(`${API_URL}/${id}`, bank);
    return response.data;
};

export const deleteBank = async (id: number): Promise<void> => {
    await apiClient.delete(`${API_URL}/${id}`);
};

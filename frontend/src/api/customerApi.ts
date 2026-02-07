import apiClient from './apiClient';
import {
    Customer,
    CreateCustomerRequest,
    BankAccount,
    CreateBankAccountRequest,
    IPO,
    CreateIPORequest,
    IPOApplication,
    CreateIPOApplicationRequest,
} from '../types';

// Customer API
export const customerApi = {
    getAll: (params?: { type?: string; kycStatus?: string; search?: string }) =>
        apiClient.get<Customer[]>('/customers', { params }),

    getById: (id: number) =>
        apiClient.get<Customer>(`/customers/${id}`),

    create: (data: CreateCustomerRequest) =>
        apiClient.post<Customer>('/customers', data),

    update: (id: number, data: CreateCustomerRequest) =>
        apiClient.put<Customer>(`/customers/${id}`, data),

    delete: (id: number) =>
        apiClient.delete(`/customers/${id}`),

    approve: (id: number, approvedBy: number) =>
        apiClient.put<Customer>(`/customers/${id}/approve`, null, { params: { approvedBy } }),

    reject: (id: number, remarks: string) =>
        apiClient.put<Customer>(`/customers/${id}/reject`, { remarks }),

    return: (id: number, remarks: string) =>
        apiClient.put<Customer>(`/customers/${id}/return`, { remarks }),

    getEligibleGuardians: () =>
        apiClient.get<Customer[]>('/customers/guardians'),

    createDraft: (data: Partial<CreateCustomerRequest>) =>
        apiClient.post<Customer>('/customers/draft', data),

    updateDraft: (id: number, data: Partial<CreateCustomerRequest>) =>
        apiClient.put<Customer>(`/customers/${id}/draft`, data),
};

// Bank Account API
export const bankAccountApi = {
    getAll: () =>
        apiClient.get<BankAccount[]>('/bank-accounts'),

    getById: (id: number) =>
        apiClient.get<BankAccount>(`/bank-accounts/${id}`),

    getByCustomerId: (customerId: number) =>
        apiClient.get<BankAccount[]>(`/bank-accounts/customer/${customerId}`),

    getActiveByCustomerId: (customerId: number) =>
        apiClient.get<BankAccount[]>(`/bank-accounts/customer/${customerId}/active`),

    getPrimaryByCustomerId: (customerId: number) =>
        apiClient.get<BankAccount>(`/bank-accounts/customer/${customerId}/primary`),

    create: (data: CreateBankAccountRequest) =>
        apiClient.post<BankAccount>('/bank-accounts', data),

    update: (id: number, data: CreateBankAccountRequest) =>
        apiClient.put<BankAccount>(`/bank-accounts/${id}`, data),

    setPrimary: (id: number) =>
        apiClient.put<BankAccount>(`/bank-accounts/${id}/set-primary`),

    delete: (id: number) =>
        apiClient.delete(`/bank-accounts/${id}`),

    deposit: (id: number, data: { amount: number; description: string }) =>
        apiClient.post(`/bank-accounts/${id}/deposit`, data),

    withdraw: (id: number, data: { amount: number; description: string }) =>
        apiClient.post(`/bank-accounts/${id}/withdraw`, data),

    getStatement: (id: number, startDate: string, endDate: string) =>
        apiClient.get<any>(`/bank-accounts/${id}/statement`, { params: { startDate, endDate } }),

    getSystemAccountStatement: (id: number, startDate: string, endDate: string) =>
        apiClient.get<any>(`/bank-accounts/system-accounts/${id}/statement`, { params: { startDate, endDate } }),
};

// IPO API
export const ipoApi = {
    getAll: (params?: { status?: string }) =>
        apiClient.get<IPO[]>('/ipos', { params }),

    getById: (id: number) =>
        apiClient.get<IPO>(`/ipos/${id}`),

    getActive: () =>
        apiClient.get<IPO[]>('/ipos/active'),

    getUpcoming: () =>
        apiClient.get<IPO[]>('/ipos/upcoming'),

    create: (data: CreateIPORequest) =>
        apiClient.post<IPO>('/ipos', data),

    update: (id: number, data: CreateIPORequest) =>
        apiClient.put<IPO>(`/ipos/${id}`, data),

    updateStatus: (id: number, status: string) =>
        apiClient.put<IPO>(`/ipos/${id}/status`, null, { params: { status } }),

    delete: (id: number) =>
        apiClient.delete(`/ipos/${id}`),

    autoClose: () =>
        apiClient.post('/ipos/auto-close'),
};

// IPO Application API
export const ipoApplicationApi = {
    getAll: (params?: { status?: string }) =>
        apiClient.get<IPOApplication[]>('/ipo-applications', { params }),

    getById: (id: number) =>
        apiClient.get<IPOApplication>(`/ipo-applications/${id}`),

    getByCustomerId: (customerId: number) =>
        apiClient.get<IPOApplication[]>(`/ipo-applications/customer/${customerId}`),

    getByIpoId: (ipoId: number) =>
        apiClient.get<IPOApplication[]>(`/ipo-applications/ipo/${ipoId}`),

    getPending: () =>
        apiClient.get<IPOApplication[]>('/ipo-applications/pending'),

    create: (data: CreateIPOApplicationRequest) =>
        apiClient.post<IPOApplication>('/ipo-applications', data),

    approve: (id: number, approvedBy: string) =>
        apiClient.put<IPOApplication>(`/ipo-applications/${id}/approve`, null, { params: { approvedBy } }),

    reject: (id: number, reason: string) =>
        apiClient.put<IPOApplication>(`/ipo-applications/${id}/reject`, null, { params: { reason } }),

    updatePaymentStatus: (id: number, status: string) =>
        apiClient.put<IPOApplication>(`/ipo-applications/${id}/payment-status`, null, { params: { status } }),

    allotShares: (id: number, quantity: number) =>
        apiClient.put<IPOApplication>(`/ipo-applications/${id}/allot`, null, { params: { quantity } }),
};

// Ledger (System Accounts) API
export const ledgerApi = {
    getSystemAccounts: () =>
        apiClient.get<any[]>('/ledger/system-accounts'),

    createSystemAccount: (name: string, type: string) =>
        apiClient.post('/ledger/system-accounts', { name, type }),
};

// Bulk Deposit API
export const bulkDepositApi = {
    getAll: () =>
        apiClient.get<any[]>('/bulk-deposits'),

    getById: (batchId: string) =>
        apiClient.get<any>(`/bulk-deposits/${batchId}`),

    create: (data: any, makerId: number) =>
        apiClient.post<any>('/bulk-deposits', data, { params: { makerId } }),

    verify: (batchId: string, checkerId: number) =>
        apiClient.put<any>(`/bulk-deposits/${batchId}/verify`, null, { params: { checkerId } }),

    reject: (batchId: string, remarks: string, checkerId: number) =>
        apiClient.put<any>(`/bulk-deposits/${batchId}/reject`, { remarks }, { params: { checkerId } }),
};

// Transaction Verification API
export const transactionVerificationApi = {
    getPending: () =>
        apiClient.get<import('../types').PendingTransaction[]>('/transactions/pending'),

    approve: (id: number) =>
        apiClient.post<import('../types').PendingTransaction>(`/transactions/${id}/approve`),

    reject: (id: number, reason: string) =>
        apiClient.post<import('../types').PendingTransaction>(`/transactions/${id}/reject`, { reason }),
};

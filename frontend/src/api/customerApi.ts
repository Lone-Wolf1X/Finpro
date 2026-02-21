import apiClient from './apiClient';
import {
    Customer, CreateCustomerRequest, IPO, CreateIPORequest, IPOApplication, CreateIPOApplicationRequest,
    BankAccount, CreateBankAccountRequest,
    CustomerPortfolio, PortfolioTransaction,
    AccountStatement, ProfitSummary, PendingTransaction, AccountBalanceInfo, AccountLien, ATBRequest, BankDTO
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
    getAll: () => apiClient.get<BankAccount[]>('/bank-accounts'),
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
        apiClient.get<AccountStatement>(`/bank-accounts/${id}/statement`, { params: { startDate, endDate } }),

    getSystemAccountStatement: (id: number, startDate: string, endDate: string) =>
        apiClient.get<AccountStatement>(`/bank-accounts/system-accounts/${id}/statement`, { params: { startDate, endDate } }),
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

    updateStatus: (id: number, status: string) => apiClient.put<IPO>(`/ipos/${id}/status`, null, { params: { status } }),
    allot: (id: number) => apiClient.post<IPO>(`/ipos/${id}/allot`),
    list: (id: number) => apiClient.post<IPO>(`/ipos/${id}/list`),
    delete: (id: number) =>
        apiClient.delete(`/ipos/${id}`),

    autoClose: () =>
        apiClient.post('/ipos/auto-close'),

    initiateAllotment: (id: number, adminName: string) =>
        apiClient.post<IPO>(`/ipos/${id}/initiate-allotment`, null, { params: { adminName } }),
};

// IPO Application API
export const ipoApplicationApi = {
    getAll: (params?: { status?: string, ipoId?: number, customerId?: number }) => apiClient.get<IPOApplication[]>('/ipo-applications', { params }),
    getById: (id: number) => apiClient.get<IPOApplication>(`/ipo-applications/${id}`),
    update: (id: number, data: CreateIPOApplicationRequest) => apiClient.put<IPOApplication>(`/ipo-applications/${id}`, data),
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

    verify: (id: number) =>
        apiClient.put<IPOApplication>(`/ipo-applications/${id}/verify`),

    reject: (id: number, reason: string) =>
        apiClient.put<IPOApplication>(`/ipo-applications/${id}/reject`, null, { params: { reason } }),

    updatePaymentStatus: (id: number, status: string) =>
        apiClient.put<IPOApplication>(`/ipo-applications/${id}/payment-status`, null, { params: { status } }),

    allotShares: (id: number, quantity: number) =>
        apiClient.put<IPOApplication>(`/ipo-applications/${id}/allot`, null, { params: { quantity } }),

    // New Allotment / Bulk methods
    bulkCreate: (data: {
        ipoId: number;
        items: { customerId: number; bankAccountId: number; quantity: number }[];
        makerId?: number;
    }) =>
        apiClient.post('/ipo-applications/bulk', data),

    markAllotment: (data: { applicationId: number; quantity: number; status: string }) =>
        apiClient.put<IPOApplication>('/ipo-applications/mark-allotment', data),

    bulkAllot: (ids: number[]) =>
        apiClient.put('/ipo-applications/bulk-allot', ids),

    resetStatus: (id: number, status: string) =>
        apiClient.put(`/ipo-applications/${id}/reset-status`, null, { params: { status } }),

    // New Allotment Workflow Methods
    markResult: (id: number, isAllotted: boolean, quantity: number) =>
        apiClient.put<IPOApplication>(`/ipo-applications/${id}/mark-result`, null, {
            params: { isAllotted, quantity }
        }),

    verifyAllotment: (id: number) =>
        apiClient.put<IPOApplication>(`/ipo-applications/${id}/verify-allotment`),

    bulkVerify: (ids: number[]) =>
        apiClient.put('/ipo-applications/bulk-verify', ids),

    delete: (id: number) =>
        apiClient.delete(`/ipo-applications/${id}`),
};

// Ledger (System Accounts) API
export const ledgerApi = {
    getSystemAccounts: () =>
        apiClient.get<any[]>('/ledger/system-accounts'),

    createSystemAccount: (name: string, type: string) =>
        apiClient.post('/ledger/system-accounts', { name, type }),

    getStatement: (id: number, startDate: string, endDate: string) =>
        apiClient.get<any>(`/ledger/${id}/statement`, { params: { startDate, endDate } }),

    getProfitSummary: () =>
        apiClient.get<ProfitSummary>('/admin/profits/summary'),

    withdrawProfits: (amount: number, description: string) =>
        apiClient.post('/admin/profits/withdraw', { amount, description }),
};

// System Account API
export const systemAccountApi = {
    getAll: () =>
        apiClient.get<any[]>('/system-accounts'),

    getById: (id: number) =>
        apiClient.get<any>(`/system-accounts/${id}`),
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

    uploadCSV: (file: File, bankName: string, transactionRef: string, makerId: number) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bankName', bankName);
        formData.append('transactionReference', transactionRef);
        formData.append('makerId', makerId.toString());
        return apiClient.post<any>('/bulk-deposits/upload-csv', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
};

// Transaction Verification API
export const transactionVerificationApi = {
    getPending: () =>
        apiClient.get<PendingTransaction[]>('/transactions/pending'),

    getByCustomerId: (customerId: number) =>
        apiClient.get<PendingTransaction[]>(`/transactions/customer/${customerId}`),

    approve: (id: number) =>
        apiClient.post<PendingTransaction>(`/transactions/${id}/approve`),

    reject: (id: number, reason: string) =>
        apiClient.post<PendingTransaction>(`/transactions/${id}/reject`, { reason }),
};

// Customer Portfolio API
export const portfolioApi = {
    getByCustomerId: (customerId: number) =>
        apiClient.get<CustomerPortfolio[]>(`/portfolios/customer/${customerId}`),
    getTransactions: () => apiClient.get<PortfolioTransaction[]>('/portfolio/transactions'),
    getTransactionsByCustomerId: (customerId: number) =>
        apiClient.get<PortfolioTransaction[]>(`/portfolio/transactions/customer/${customerId}`),
};


// Secondary Market API
export const secondaryMarketApi = {
    sell: (portfolioId: number, quantity: number, price: number) =>
        apiClient.post('/secondary-market/sell', null, { params: { portfolioId, quantity, price } }),

    buy: (symbol: string, quantity: number, price: number) =>
        apiClient.post('/secondary-market/buy', null, { params: { symbol, quantity, price } }),



    // Admin Methods
    updatePrice: (ipoId: number, newPrice: number) =>
        apiClient.post('/secondary-market/admin/update-price', null, { params: { ipoId, newPrice } }),

    listIPO: (ipoId: number, listingPrice: number) =>
        apiClient.post('/secondary-market/admin/list-ipo', null, { params: { ipoId, listingPrice } }),

    // Admin On-Behalf Methods
    buyOnBehalf: (customerId: number, symbol: string, quantity: number, price: number) =>
        apiClient.post('/secondary-market/admin/buy', null, { params: { customerId, symbol, quantity, price } }),

    sellOnBehalf: (customerId: number, portfolioId: number, quantity: number, price: number) =>
        apiClient.post('/secondary-market/admin/sell', null, { params: { customerId, portfolioId, quantity, price } }),

    manualAdjustment: (customerId: number, symbol: string, quantity: number, price: number, type: 'CREDIT' | 'DEBIT') =>
        apiClient.post('/secondary-market/admin/manual-adjustment', null, { params: { customerId, symbol, quantity, price, type } }),
};


// Bank Module API
export const bankModuleApi = {
    abci: (accountNumber: string) =>
        apiClient.get<AccountBalanceInfo>(`/bank-module/abci/${accountNumber}`),

    alm: (bankAccountId: number) =>
        apiClient.get<AccountLien[]>(`/bank-module/alm/${bankAccountId}`),

    addLien: (data: Partial<AccountLien>) =>
        apiClient.post<AccountLien>('/bank-module/alm/add', data),

    releaseLien: (lienId: number) =>
        apiClient.put(`/bank-module/alm/release/${lienId}`),

    atbTransaction: (data: ATBRequest) =>
        apiClient.post('/bank-module/atb/transaction', data),
};

// Bank API
export const bankApi = {
    getAll: (activeOnly?: boolean) =>
        apiClient.get<BankDTO[]>('/banks', { params: { activeOnly } }),
};
// Allotment API (Workflow)
export const allotmentApi = {
    getIPOsInAllotmentPhase: () =>
        apiClient.get<IPO[]>('/allotment/ipos-in-allotment-phase'),

    getValidApplications: (ipoId: number) =>
        apiClient.get<IPOApplication[]>(`/allotment/${ipoId}/applications`),

    submitDrafts: (data: { ipoId: number; items: { applicationId: number; quantity: number; isAllotted: boolean }[] }) =>
        apiClient.post<{ message: string }>('/allotment/submit', data),

    getPendingDrafts: (ipoId?: number) =>
        ipoId
            ? apiClient.get<any[]>(`/allotment/${ipoId}/pending-drafts`)
            : apiClient.get<any[]>('/allotment/pending-verification'),

    verify: (ipoId: number, approve: boolean, remarks?: string) =>
        apiClient.post<{ message: string }>(`/allotment/${ipoId}/verify`, null, {
            params: { approve, remarks }
        }),

    getSummary: (ipoId: number) =>
        apiClient.get<any>(`/allotment/summary/${ipoId}`),

    getAllSummaries: () =>
        apiClient.get<any[]>('/allotment/all-summaries'),
};

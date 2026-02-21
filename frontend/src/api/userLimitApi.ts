import apiClient from './apiClient';

export interface UserLimitRequestDTO {
    id: number;
    requesterId: number;
    requesterName: string;
    currentDepositLimit: number;
    currentWithdrawalLimit: number;
    requestedDepositLimit: number;
    requestedWithdrawalLimit: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    adminComments?: string;
    createdAt: string;
    reviewedAt?: string;
    reviewedByUserId?: number;
}

export const userLimitApi = {
    getMyLimits: () => apiClient.get<{ depositLimit: number; withdrawalLimit: number }>('/user-limits/me'),

    requestLimitIncrease: (data: { depositLimit: number; withdrawalLimit: number }) =>
        apiClient.post<UserLimitRequestDTO>('/user-limits/request', data),

    getMyRequests: () => apiClient.get<UserLimitRequestDTO[]>('/user-limits/my-requests'),

    // Admin endpoints
    getAllPendingRequests: () => apiClient.get<UserLimitRequestDTO[]>('/user-limits/requests'),

    approveRequest: (id: number) => apiClient.put<UserLimitRequestDTO>(`/user-limits/requests/${id}/approve`),

    rejectRequest: (id: number, comments: string) =>
        apiClient.put<UserLimitRequestDTO>(`/user-limits/requests/${id}/reject`, { comments }),

    updateUserLimitsManual: (userId: number, limits: { depositLimit?: number; withdrawalLimit?: number }) =>
        apiClient.put(`/user-limits/users/${userId}`, limits),
};

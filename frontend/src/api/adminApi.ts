import axios from 'axios';

const API_URL = 'http://localhost:8080/api/admin';

// Create axios instance with interceptor for auth token
const adminAxios = axios.create({
    baseURL: API_URL,
});

adminAxios.interceptors.request.use((config) => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        if (user.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
    }
    return config;
});

export const adminApi = {
    getAllTenants: () => adminAxios.get('/tenants'),
    createTenant: (data: any) => adminAxios.post('/tenants', data),
    getAllFeatures: () => adminAxios.get('/features'),
    toggleFeature: (tenantId: number, featureId: number, isEnabled: boolean) =>
        adminAxios.post(`/tenants/${tenantId}/features`, { featureId, isEnabled }),
    getTenantUsage: (tenantId: number) => adminAxios.get(`/tenants/${tenantId}/usage`),
};

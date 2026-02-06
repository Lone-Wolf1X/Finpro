import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { User, Tenant } from '@/types';

interface AuthState {
    user: User | null;
    tenant: Tenant | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    tenant: JSON.parse(localStorage.getItem('tenant') || 'null'),
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        loginSuccess: (state, action: PayloadAction<{ user: User; tenant: Tenant; token: string }>) => {
            state.user = action.payload.user;
            state.tenant = action.payload.tenant;
            state.token = action.payload.token;
            state.isAuthenticated = true;
            state.loading = false;
            state.error = null;

            // Save to localStorage
            localStorage.setItem('user', JSON.stringify(action.payload.user));
            localStorage.setItem('tenant', JSON.stringify(action.payload.tenant));
            localStorage.setItem('token', action.payload.token);
            localStorage.setItem('tenantKey', action.payload.tenant.tenantKey);
        },
        loginFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },
        logout: (state) => {
            state.user = null;
            state.tenant = null;
            state.token = null;
            state.isAuthenticated = false;
            state.loading = false;
            state.error = null;

            // Clear localStorage
            localStorage.removeItem('user');
            localStorage.removeItem('tenant');
            localStorage.removeItem('token');
            localStorage.removeItem('tenantKey');
        },
    },
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;
export default authSlice.reducer;

import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import userReducer from '@/features/users/userSlice';
import customersReducer from '@/features/customers/customerSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        users: userReducer,
        customers: customersReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Customer } from '@/types';

interface CustomerState {
    customers: Customer[];
    loading: boolean;
    error: string | null;
}

const initialState: CustomerState = {
    customers: [],
    loading: false,
    error: null,
};

const customerSlice = createSlice({
    name: 'customers',
    initialState,
    reducers: {
        setCustomers: (state, action: PayloadAction<Customer[]>) => {
            state.customers = action.payload;
            state.loading = false;
            state.error = null;
        },
        addCustomer: (state, action: PayloadAction<Customer>) => {
            state.customers.push(action.payload);
        },
        updateCustomer: (state, action: PayloadAction<Customer>) => {
            const index = state.customers.findIndex(c => c.id === action.payload.id);
            if (index !== -1) {
                state.customers[index] = action.payload;
            }
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
            state.loading = false;
        },
    },
});

export const { setCustomers, addCustomer, updateCustomer, setLoading, setError } = customerSlice.actions;
export default customerSlice.reducer;

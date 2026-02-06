import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@/types';

interface UserState {
    users: User[];
    selectedUser: User | null;
    loading: boolean;
    error: string | null;
}

const initialState: UserState = {
    users: [],
    selectedUser: null,
    loading: false,
    error: null,
};

const userSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {
        setUsers: (state, action: PayloadAction<User[]>) => {
            state.users = action.payload;
            state.loading = false;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
            state.loading = false;
        },
        addUser: (state, action: PayloadAction<User>) => {
            state.users.push(action.payload);
        },
        updateUser: (state, action: PayloadAction<User>) => {
            const index = state.users.findIndex(u => u.id === action.payload.id);
            if (index !== -1) {
                state.users[index] = action.payload;
            }
        },
        removeUser: (state, action: PayloadAction<number>) => {
            state.users = state.users.filter(u => u.id !== action.payload);
        },
    },
});

export const { setUsers, setLoading, setError, addUser, updateUser, removeUser } = userSlice.actions;
export default userSlice.reducer;

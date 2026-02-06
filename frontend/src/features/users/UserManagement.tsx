import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setUsers, setLoading, setError, addUser, removeUser, updateUser } from './userSlice';
import { userService } from './userService';
import type { User, CreateUserRequest, UpdateUserRequest } from '@/types';
import { Users as UsersIcon, UserPlus, Trash2, Search, Shield, Edit, Key } from 'lucide-react';
import toast from 'react-hot-toast';

const UserManagement = () => {
    const dispatch = useAppDispatch();
    const { user: currentUser } = useAppSelector((state) => state.auth);
    const { users, loading } = useAppSelector((state) => state.users);
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Initial form state
    const initialFormState: CreateUserRequest & { userId?: string } = {
        email: '',
        password: '',
        staffId: '',
        userId: '',
        firstName: '',
        lastName: '',
        role: 'MAKER',
        tenantId: currentUser?.tenantId || 0,
    };

    const [formData, setFormData] = useState<CreateUserRequest & { userId?: string }>(initialFormState);
    const [resetPasswordMode, setResetPasswordMode] = useState(false);
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        dispatch(setLoading(true));
        try {
            const data = await userService.getUsers();
            dispatch(setUsers(data));
        } catch (error: any) {
            dispatch(setError(error.message));
            toast.error('Failed to fetch users');
        }
    };

    const handleOpenCreateModal = () => {
        setIsEditMode(false);
        setFormData({
            ...initialFormState,
            tenantId: currentUser?.tenantId || 0
        });
        setShowModal(true);
    };

    const handleOpenEditModal = (user: User) => {
        setIsEditMode(true);
        setResetPasswordMode(false); // Ensure standard edit mode
        setSelectedUserId(user.id);
        setFormData({
            email: user.email,
            password: '',
            staffId: user.staffId,
            userId: user.userId || user.staffId, // Fallback to staffId if userId missing
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role as any,
            tenantId: user.tenantId,
        });
        setShowModal(true);
    };

    const handleOpenResetPasswordModal = (user: User) => {
        setIsEditMode(true);
        setResetPasswordMode(true);
        setSelectedUserId(user.id);
        setNewPassword(''); // Reset field
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.email || (!isEditMode && !formData.password) || !formData.firstName || !formData.lastName || !formData.staffId) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            if (isEditMode && selectedUserId) {
                // Edit Request
                const updateData: UpdateUserRequest = {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    role: formData.role as any,
                    userId: formData.userId,
                    staffId: formData.staffId,
                    // Add other fields if needed
                };
                const updatedUser = await userService.updateUser(selectedUserId, updateData);
                dispatch(updateUser(updatedUser)); // Ensure userSlice has updateUser action
                toast.success('User updated successfully!');
            } else {
                // Create Request
                const payload: CreateUserRequest & { name: string } = {
                    ...formData,
                    name: `${formData.firstName} ${formData.lastName}`
                };
                const newUser = await userService.createUser(payload as any);
                dispatch(addUser(newUser));
                toast.success('User created successfully!');
            }
            setShowModal(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            await userService.deleteUser(userId);
            dispatch(removeUser(userId));
            toast.success('User deleted successfully');
        } catch (error: any) {
            toast.error('Failed to delete user');
        }
    };

    const filteredUsers = users.filter(user =>
        (user.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.staffId?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    // Determine allowed roles based on current user's role
    const getAllowedRoles = () => {
        if (currentUser?.role === 'SUPERADMIN') {
            return ['ADMIN', 'MAKER', 'CHECKER', 'INVESTOR'];
        } else if (currentUser?.role === 'ADMIN') {
            return ['MAKER', 'CHECKER', 'INVESTOR'];
        }
        return [];
    };

    const allowedRoles = getAllowedRoles();

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'SUPERADMIN':
                return 'bg-red-100 text-red-700';
            case 'ADMIN':
                return 'bg-purple-100 text-purple-700';
            case 'MAKER':
                return 'bg-blue-100 text-blue-700';
            case 'CHECKER':
                return 'bg-green-100 text-green-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900 flex items-center gap-2">
                        <UsersIcon className="w-8 h-8" />
                        User Management
                    </h1>
                    <p className="text-secondary-600 mt-1">
                        Manage users and their roles
                    </p>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="btn-primary flex items-center gap-2"
                >
                    <UserPlus className="w-5 h-5" />
                    Create User
                </button>
            </div>

            {/* Search Bar */}
            <div className="card">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                    <input
                        type="text"
                        placeholder="Search users by name, email, or staff ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-10"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-secondary-50 border-b border-secondary-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                                    Staff ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-secondary-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-secondary-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-secondary-500">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-secondary-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-secondary-900">
                                                    {user.firstName} {user.lastName}
                                                </div>
                                                <div className="text-sm text-secondary-500">{user.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-secondary-900">{user.staffId}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleOpenResetPasswordModal(user)}
                                                    className="text-yellow-600 hover:text-yellow-900"
                                                    title="Reset Password"
                                                >
                                                    <Key className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenEditModal(user)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    disabled={user.id === currentUser?.id}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit User Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-secondary-900 mb-4">
                            {resetPasswordMode ? 'Reset Password' : isEditMode ? 'Edit User' : 'Create New User'}
                        </h2>

                        {resetPasswordMode ? (
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                if (!newPassword) return toast.error("Password is required");
                                try {
                                    if (selectedUserId) {
                                        const updatedUser = await userService.updateUser(selectedUserId, { password: newPassword });
                                        dispatch(updateUser(updatedUser));
                                        toast.success("Password reset successfully");
                                        setShowModal(false);
                                    }
                                } catch (err: any) {
                                    toast.error(err.response?.data?.message || "Failed to reset password");
                                }
                            }} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="input-field"
                                        required
                                        placeholder="Enter new password"
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="btn-secondary flex-1"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-primary flex-1"
                                    >
                                        Reset Password
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            className="input-field"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            className="input-field"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="input-field"
                                        required
                                        disabled={isEditMode} // Email is unique, careful with edit
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                                            Staff ID
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.staffId}
                                            onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                                            className="input-field"
                                            placeholder="STAFF-001"
                                            required
                                        // Enabled for editing now
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                                            User ID
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.userId}
                                            onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                                            className="input-field"
                                            placeholder="USER-001"
                                            required
                                        // Enabled for editing now
                                        />
                                    </div>
                                </div>

                                {!isEditMode && (
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="input-field"
                                            required
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1 flex items-center gap-2">
                                        <Shield className="w-4 h-4" />
                                        Role
                                    </label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                        className="input-field"
                                        required
                                    >
                                        {allowedRoles.map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="btn-secondary flex-1"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-primary flex-1"
                                    >
                                        {isEditMode ? 'Update User' : 'Create User'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;

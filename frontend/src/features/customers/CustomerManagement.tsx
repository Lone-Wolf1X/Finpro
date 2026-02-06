import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setCustomers, updateCustomer, setLoading, setError } from './customerSlice';
import { customerService } from './customerService';
import { Customer } from '@/types';
import { UserPlus, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function CustomerManagement() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { customers, loading, error } = useSelector((state: RootState) => state.customers);
    const { user } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            dispatch(setLoading(true));
            const data = await customerService.getAllCustomers();
            dispatch(setCustomers(data));
        } catch (err: any) {
            dispatch(setError(err.message || 'Failed to fetch customers'));
        }
    };

    const handleCreateCustomer = () => {
        navigate('/customers/new');
    };

    const handleApproveCustomer = async (id: number) => {
        try {
            const approved = await customerService.approveCustomer(id);
            dispatch(updateCustomer(approved));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to approve customer');
        }
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            PENDING: <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1"><Clock size={12} /> Pending</span>,
            APPROVED: <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle size={12} /> Approved</span>,
            REJECTED: <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 flex items-center gap-1"><XCircle size={12} /> Rejected</span>,
        };
        return badges[status as keyof typeof badges] || status;
    };

    const canCreate = user?.role === 'MAKER' || user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
    const canApprove = user?.role === 'CHECKER' || user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Customer Management</h1>
                {canCreate && (
                    <button
                        onClick={handleCreateCustomer}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <UserPlus size={20} />
                        Create Customer
                    </button>
                )}
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {customers.map((customer: Customer) => (
                                <tr key={customer.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {customer.firstName} {customer.lastName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{customer.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{customer.phone}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(customer.kycStatus)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {customer.kycStatus === 'PENDING' && canApprove && (
                                            <button
                                                onClick={() => handleApproveCustomer(customer.id)}
                                                className="text-green-600 hover:text-green-900 flex items-center gap-1"
                                            >
                                                <CheckCircle size={16} />
                                                Approve
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

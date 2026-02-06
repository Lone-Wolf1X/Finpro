import { useState, useEffect } from 'react';
import { customerApi } from '../../api/customerApi';
import { Customer, CustomerType, KycStatus } from '../../types';
import { useNavigate } from 'react-router-dom';

export default function CustomerList() {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        type: '',
        kycStatus: '',
        search: ''
    });

    useEffect(() => {
        loadCustomers();
    }, [filters]);

    const loadCustomers = async () => {
        try {
            setLoading(true);
            const response = await customerApi.getAll(filters);
            setCustomers(response.data);
        } catch (error) {
            console.error('Failed to load customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number) => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            await customerApi.approve(id, user.id);
            loadCustomers();
        } catch (error) {
            console.error('Failed to approve customer:', error);
        }
    };

    const handleReject = async (id: number) => {
        try {
            await customerApi.reject(id);
            loadCustomers();
        } catch (error) {
            console.error('Failed to reject customer:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this customer?')) return;

        try {
            await customerApi.delete(id);
            loadCustomers();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to delete customer');
        }
    };

    const getStatusBadge = (status: KycStatus) => {
        const colors = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            APPROVED: 'bg-green-100 text-green-800',
            REJECTED: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getTypeBadge = (type: CustomerType) => {
        return type === 'MINOR'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-purple-100 text-purple-800';
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Customers</h1>
                <button
                    onClick={() => navigate('/customers/new')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    + Add Customer
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Search</label>
                        <input
                            type="text"
                            placeholder="Name, email, phone..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Customer Type</label>
                        <select
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            <option value="">All Types</option>
                            <option value="MAJOR">MAJOR (≥18)</option>
                            <option value="MINOR">MINOR (&lt;18)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">KYC Status</label>
                        <select
                            value={filters.kycStatus}
                            onChange={(e) => setFilters({ ...filters, kycStatus: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            <option value="">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">Loading...</div>
                ) : customers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No customers found</div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">KYC Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guardian</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {customers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{customer.fullName}</div>
                                        <div className="text-sm text-gray-500">{customer.email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">{customer.age}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${getTypeBadge(customer.customerType)}`}>
                                            {customer.customerType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm">{customer.phone}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(customer.kycStatus)}`}>
                                            {customer.kycStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {customer.guardianName || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => navigate(`/customers/${customer.id}`)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                View
                                            </button>
                                            {customer.kycStatus === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(customer.id)}
                                                        className="text-green-600 hover:text-green-800"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(customer.id)}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => handleDelete(customer.id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

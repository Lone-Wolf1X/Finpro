import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { userLimitApi, UserLimitRequestDTO } from '@/api/userLimitApi';
import { Shield, ArrowUpCircle, History, Clock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const UserProfile = () => {
    const { user } = useAppSelector((state) => state.auth);
    const [limits, setLimits] = useState({ depositLimit: 0, withdrawalLimit: 0 });
    const [myRequests, setMyRequests] = useState<UserLimitRequestDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState(false);

    const [formData, setFormData] = useState({
        depositLimit: '',
        withdrawalLimit: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [limitsRes, requestsRes] = await Promise.all([
                userLimitApi.getMyLimits(),
                userLimitApi.getMyRequests()
            ]);
            setLimits(limitsRes.data);
            setMyRequests(requestsRes.data);
            setFormData({
                depositLimit: limitsRes.data.depositLimit.toString(),
                withdrawalLimit: limitsRes.data.withdrawalLimit.toString()
            });
        } catch (error) {
            toast.error('Failed to fetch profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setRequesting(true);
            await userLimitApi.requestLimitIncrease({
                depositLimit: Number(formData.depositLimit),
                withdrawalLimit: Number(formData.withdrawalLimit)
            });
            toast.success('Limit enhancement request submitted successfully');
            fetchData();
        } catch (error) {
            toast.error('Failed to submit request');
        } finally {
            setRequesting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
                <p className="text-gray-500">Manage your account and transaction limits.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                                {user?.firstName?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{user?.firstName} {user?.lastName}</h2>
                                <p className="text-sm text-gray-500">{user?.role}</p>
                                <p className="text-sm text-gray-400 mt-1">{user?.email}</p>
                            </div>
                            <div className="w-full pt-4 border-t border-gray-50">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${user?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {user?.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Current Limits */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                        <div className="flex items-center gap-2 text-gray-900 font-bold">
                            <Shield className="w-5 h-5 text-primary-600" />
                            <h3>Transaction Limits</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                <span className="text-sm text-gray-500">Deposit Limit</span>
                                <span className="font-bold text-gray-900">${limits.depositLimit.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                <span className="text-sm text-gray-500">Withdrawal Limit</span>
                                <span className="font-bold text-gray-900">${limits.withdrawalLimit.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Request Enhancement & History */}
                <div className="md:col-span-2 space-y-6">
                    {/* Request Form */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <ArrowUpCircle className="w-6 h-6 text-primary-600" />
                            <h3 className="text-lg font-bold text-gray-900">Request Limit Enhancement</h3>
                        </div>

                        <form onSubmit={handleRequest} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Requested Deposit Limit</label>
                                    <input
                                        type="number"
                                        value={formData.depositLimit}
                                        onChange={(e) => setFormData({ ...formData, depositLimit: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                                        placeholder="Enter amount"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Requested Withdrawal Limit</label>
                                    <input
                                        type="number"
                                        value={formData.withdrawalLimit}
                                        onChange={(e) => setFormData({ ...formData, withdrawalLimit: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                                        placeholder="Enter amount"
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={requesting}
                                className="w-full sm:w-auto px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all shadow-sm"
                            >
                                {requesting ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </form>
                    </div>

                    {/* History */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center gap-2">
                            <History className="w-6 h-6 text-gray-400" />
                            <h3 className="text-lg font-bold text-gray-900">Request History</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Requested Limits</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Review Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {myRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-400 italic">
                                                No enhancement requests found.
                                            </td>
                                        </tr>
                                    ) : (
                                        myRequests.map((req) => (
                                            <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-gray-900">
                                                        {new Date(req.createdAt).toLocaleDateString()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs text-gray-500">D: ${req.requestedDepositLimit.toLocaleString()}</span>
                                                        <span className="text-xs text-gray-500">W: ${req.requestedWithdrawalLimit.toLocaleString()}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5">
                                                        {req.status === 'PENDING' && (
                                                            <><Clock className="w-4 h-4 text-amber-500" /><span className="text-sm text-amber-600 font-medium">Pending</span></>
                                                        )}
                                                        {req.status === 'APPROVED' && (
                                                            <><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-sm text-green-600 font-medium">Approved</span></>
                                                        )}
                                                        {req.status === 'REJECTED' && (
                                                            <><XCircle className="w-4 h-4 text-red-500" /><span className="text-sm text-red-600 font-medium">Rejected</span></>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {req.adminComments ? (
                                                        <p className="text-xs text-gray-400 italic max-w-[200px] ml-auto">
                                                            "{req.adminComments}"
                                                        </p>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;

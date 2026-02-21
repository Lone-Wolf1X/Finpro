import React, { useState, useEffect } from 'react';
import { userLimitApi, UserLimitRequestDTO } from '@/api/userLimitApi';
import { CheckCircle, XCircle, Search, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminLimitRequests = () => {
    const [requests, setRequests] = useState<UserLimitRequestDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [rejectingReqId, setRejectingReqId] = useState<number | null>(null);
    const [rejectComment, setRejectComment] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await userLimitApi.getAllPendingRequests();
            setRequests(res.data);
        } catch (error) {
            toast.error('Failed to fetch limit requests');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number) => {
        try {
            setProcessing(id);
            await userLimitApi.approveRequest(id);
            toast.success('Request approved successfully');
            fetchRequests();
        } catch (error) {
            toast.error('Failed to approve request');
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rejectingReqId) return;

        try {
            setProcessing(rejectingReqId);
            await userLimitApi.rejectRequest(rejectingReqId, rejectComment);
            toast.success('Request rejected');
            setRejectingReqId(null);
            setRejectComment('');
            fetchRequests();
        } catch (error) {
            toast.error('Failed to reject request');
        } finally {
            setProcessing(null);
        }
    };

    const filteredRequests = requests.filter(req =>
        req.requesterName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-gray-900">Limit Enhancement Requests</h1>
                    <p className="text-gray-500 text-sm">Review and approve user transaction limit increases.</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none w-full sm:w-64"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Requester</th>
                                <th className="px-6 py-4">Current Limits</th>
                                <th className="px-6 py-4">Requested Limits</th>
                                <th className="px-6 py-4">Request Date</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                                        No pending requests found.
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-xs">
                                                    {req.requesterName.charAt(0)}
                                                </div>
                                                <span className="font-medium text-gray-900">{req.requesterName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 text-xs text-gray-500">
                                                <span>Dep: ${req.currentDepositLimit.toLocaleString()}</span>
                                                <span>Wth: ${req.currentWithdrawalLimit.toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 text-sm font-medium text-primary-700">
                                                <span>Dep: ${req.requestedDepositLimit.toLocaleString()}</span>
                                                <span>Wth: ${req.requestedWithdrawalLimit.toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(req.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleApprove(req.id)}
                                                    disabled={processing === req.id}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors title='Approve'"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => setRejectingReqId(req.id)}
                                                    disabled={processing === req.id}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors title='Reject'"
                                                >
                                                    <XCircle className="w-5 h-5" />
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

            {/* Reject Modal */}
            {rejectingReqId && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-red-500" />
                            <h3 className="text-xl font-bold text-gray-900">Reject Request</h3>
                        </div>
                        <form onSubmit={handleReject} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Rejection Reason</label>
                                <textarea
                                    required
                                    value={rejectComment}
                                    onChange={(e) => setRejectComment(e.target.value)}
                                    placeholder="Briefly explain why this request is being rejected..."
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none h-32 resize-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setRejectingReqId(null)}
                                    className="flex-1 px-4 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium hover:bg-red-700 rounded-xl transition-all shadow-sm shadow-red-200"
                                >
                                    Reject Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLimitRequests;

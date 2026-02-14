import { useState, useEffect } from 'react';
import { bulkDepositApi } from '../../api/customerApi';
import { BulkDeposit } from '../../types';
import { useAppSelector } from '@/store/hooks';
import { CheckCircle, XCircle, Eye, Clock, User, Landmark, AlertCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BulkDepositVerificationPage() {
    const { user } = useAppSelector((state) => state.auth);
    const [batches, setBatches] = useState<BulkDeposit[]>([]);
    const [selectedBatch, setSelectedBatch] = useState<BulkDeposit | null>(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectionRemarks, setRejectionRemarks] = useState('');

    useEffect(() => {
        loadBatches();
    }, []);

    const loadBatches = async () => {
        try {
            setLoading(true);
            const res = await bulkDepositApi.getAll();
            setBatches(res.data.filter(b => b.status === 'PENDING'));
        } catch (error) {
            toast.error('Failed to load pending batches');
        } finally {
            setLoading(false);
        }
    };

    const handleViewBatch = async (batchId: string) => {
        try {
            const res = await bulkDepositApi.getById(batchId);
            setSelectedBatch(res.data);
            setRejectionRemarks('');
        } catch (error) {
            toast.error('Failed to load batch details');
        }
    };

    const handleApprove = async () => {
        if (!selectedBatch) return;
        if (!window.confirm('Are you sure you want to approve this batch? Funds will be moved across ledgers immediately.')) return;

        try {
            setActionLoading(true);
            await bulkDepositApi.verify(selectedBatch.batchId, user!.id);
            toast.success('Batch approved and transactions processed successfully');
            setSelectedBatch(null);
            loadBatches();
        } catch (error) {
            toast.error('Failed to approve batch');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selectedBatch || !rejectionRemarks) {
            toast.error('Please provide rejection remarks');
            return;
        }

        try {
            setActionLoading(true);
            await bulkDepositApi.reject(selectedBatch.batchId, rejectionRemarks, user!.id);
            toast.success('Batch rejected successfully');
            setSelectedBatch(null);
            loadBatches();
        } catch (error) {
            toast.error('Failed to reject batch');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-blue-600 animate-pulse font-bold">Loading Verification Engine...</div>;

    return (
        <div className="p-6 w-full space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h1 className="text-3xl font-extrabold text-gray-900">Verify Deposits (Checker)</h1>
                <p className="text-gray-500 font-medium">Review and verify bulk deposit batches from Makers</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Batch List */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 px-2">
                        <Clock size={18} className="text-orange-500" /> Pending Batches ({batches.length})
                    </h3>
                    <div className="space-y-3">
                        {batches.length === 0 ? (
                            <div className="bg-gray-50 p-8 rounded-2xl border-2 border-dashed border-gray-200 text-center text-gray-400 font-medium">
                                No pending batches
                            </div>
                        ) : (
                            batches.map(batch => (
                                <div
                                    key={batch.id}
                                    onClick={() => handleViewBatch(batch.batchId)}
                                    className={`p-6 rounded-2xl border transition-all cursor-pointer group ${selectedBatch?.batchId === batch.batchId
                                        ? 'bg-blue-50 border-blue-200 shadow-md shadow-blue-50'
                                        : 'bg-white border-gray-100 hover:border-blue-100 hover:bg-gray-50/50'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg uppercase tracking-widest">{batch.batchId}</span>
                                        <Eye size={16} className={selectedBatch?.batchId === batch.batchId ? 'text-blue-500' : 'text-gray-300 group-hover:text-gray-400'} />
                                    </div>
                                    <p className="text-lg font-black text-gray-800">रू {batch.totalAmount.toLocaleString()}</p>
                                    <div className="flex items-center gap-3 mt-3 text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                        <span className="flex items-center gap-1"><User size={12} /> Maker ID: #{batch.makerId}</span>
                                        <span className="flex items-center gap-1"><FileText size={12} /> {batch.itemCount} Items</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Batch Details & Actions */}
                <div className="lg:col-span-2">
                    {selectedBatch ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
                            <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900">Batch Details: {selectedBatch.batchId}</h2>
                                    <p className="text-gray-500 text-sm font-medium">Created on {new Date(selectedBatch.createdAt).toLocaleString()}</p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleApprove}
                                        disabled={actionLoading}
                                        className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100 disabled:opacity-50"
                                    >
                                        <CheckCircle size={18} /> Approve & Post
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-100/50 border-b border-gray-100 sticky top-0 bg-white">
                                        <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            <th className="px-8 py-4">Customer</th>
                                            <th className="px-8 py-4 text-center">Amount (रू)</th>
                                            <th className="px-8 py-4">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {selectedBatch.items?.map(item => (
                                            <tr key={item.id} className="hover:bg-gray-50/50 transition-all">
                                                <td className="px-8 py-5">
                                                    <p className="font-extrabold text-gray-800 text-sm">{item.customerName}</p>
                                                    <p className="text-[10px] font-bold text-blue-500 tracking-widest">CID: {item.customerCode}</p>
                                                </td>
                                                <td className="px-8 py-5 text-center font-mono font-bold text-gray-700">रू {item.amount.toLocaleString()}</td>
                                                <td className="px-8 py-5 text-gray-500 text-sm font-medium italic">{item.remarks || '--'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-8 border-t border-gray-100 bg-gray-50/30 space-y-6">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                                        <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                                            <Landmark size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Value</p>
                                            <p className="text-xl font-black text-gray-800">रू {selectedBatch.totalAmount.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                                        <div className="h-12 w-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 shrink-0">
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Maker Notes</p>
                                            <p className="text-sm font-bold text-gray-600 line-clamp-2">{selectedBatch.remarks || 'No notes provided'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rejection Remarks (Mandatory if rejecting)</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={rejectionRemarks}
                                            onChange={(e) => setRejectionRemarks(e.target.value)}
                                            placeholder="Reason for rejection..."
                                            className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all"
                                        />
                                        <button
                                            onClick={handleReject}
                                            disabled={actionLoading || !rejectionRemarks}
                                            className="flex items-center gap-2 bg-red-50 text-red-600 px-6 py-3 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-red-50 disabled:hover:text-red-600"
                                        >
                                            <XCircle size={18} /> Reject Batch
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-3 items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <AlertCircle className="text-blue-500 shrink-0" size={18} />
                                    <p className="text-[10px] font-bold text-blue-800 leading-relaxed uppercase tracking-tight">
                                        Upon approval, the system will automatically debit the source ledger (Investor or Core Capital) and credit individual Customer portfolios. This action is irreversible.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center h-[600px] text-gray-400 space-y-4">
                            <Clock size={48} className="opacity-20" />
                            <p className="font-bold text-lg">Select a batch from the left to review</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

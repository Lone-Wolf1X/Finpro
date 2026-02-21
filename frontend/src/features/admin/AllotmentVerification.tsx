import React, { useState, useEffect } from 'react';
import { allotmentApi } from '../../api/customerApi';
import {
    CheckCircle, Loader2, Target, XCircle, ChevronRight,
    Clock, AlertTriangle, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AllotmentDraft {
    id: number;
    ipoId: number;
    ipoCompanyName: string;
    ipoSymbol: string;
    applicationId: number;
    applicationNumber: string;
    customerId: number;
    customerName: string;
    appliedQuantity: number;
    appliedAmount: number;
    isAllotted: boolean;
    allottedQuantity: number;
    status: string;
    makerName: string;
    submittedAt: string;
}

const AllotmentVerification: React.FC = () => {
    const [drafts, setDrafts] = useState<AllotmentDraft[]>([]);
    const [selectedIPO, setSelectedIPO] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [remarks, setRemarks] = useState('');
    const [showApproveDialog, setShowApproveDialog] = useState(false);

    useEffect(() => {
        fetchPendingDrafts();
    }, []);

    const fetchPendingDrafts = async () => {
        try {
            setLoading(true);
            const response = await allotmentApi.getPendingDrafts();
            setDrafts(response.data);
        } catch (error) {
            console.error('Error fetching pending drafts:', error);
            toast.error('Failed to load pending drafts');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (approve: boolean) => {
        if (!selectedIPO) return;

        try {
            setProcessing(true);
            const response = await allotmentApi.verify(selectedIPO, approve, remarks);
            toast.success(response.data.message || (approve ? 'Allotment approved and settled!' : 'Allotment rejected'));
            setShowApproveDialog(false);
            setSelectedIPO(null);
            setRemarks('');
            fetchPendingDrafts();
        } catch (error: any) {
            console.error('Error verifying allotment:', error);
            toast.error(error.response?.data?.message || 'Failed to verify allotment');
        } finally {
            setProcessing(false);
        }
    };

    // Group drafts by IPO
    const groupedDrafts = drafts.reduce((acc, draft) => {
        if (!acc[draft.ipoId]) {
            acc[draft.ipoId] = {
                ipoId: draft.ipoId,
                companyName: draft.ipoCompanyName,
                symbol: draft.ipoSymbol,
                drafts: []
            };
        }
        acc[draft.ipoId].drafts.push(draft);
        return acc;
    }, {} as Record<number, { ipoId: number; companyName: string; symbol: string; drafts: AllotmentDraft[] }>);

    if (loading && drafts.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-primary-600" size={48} />
            </div>
        );
    }

    return (
        <div className="p-8 bg-gray-50 min-h-screen pb-24 animate-in fade-in duration-500">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Post-Allotment Verification</h1>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                                Checker Queue
                            </span>
                            <div className="h-1 w-1 bg-gray-300 rounded-full" />
                            <p className="text-gray-500 font-bold">Verify and finalize allotment results submitted by Makers</p>
                        </div>
                    </div>
                </div>

                {Object.keys(groupedDrafts).length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200 p-20 text-center">
                        <div className="flex flex-col items-center gap-6">
                            <div className="p-8 bg-gray-50 rounded-full text-gray-300">
                                <Clock size={64} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900">Queue is empty</h2>
                                <p className="text-gray-400 font-bold mt-2">No pending allotment drafts found for verification</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8">
                        {Object.values(groupedDrafts).map((group) => (
                            <div key={group.ipoId} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden transform transition-all hover:shadow-2xl">
                                {/* IPO Banner */}
                                <div className="bg-gray-900 p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                                            <Target className="text-primary-400" size={32} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-white">{group.companyName}</h2>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-[10px] font-black rounded uppercase tracking-widest">{group.symbol}</span>
                                                <div className="h-1 w-1 bg-white/20 rounded-full" />
                                                <span className="text-gray-400 text-xs font-bold">Awaiting Settlement</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-center">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Applications</p>
                                            <p className="text-2xl font-black text-white">{group.drafts.length}</p>
                                        </div>
                                        <div className="h-10 w-px bg-white/10" />
                                        <div className="text-center">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                                            <p className="text-2xl font-black text-white">रू {group.drafts.reduce((sum, d) => sum + d.appliedAmount, 0).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-0 overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 border-b border-gray-100">
                                            <tr>
                                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Applied</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Maker Decision</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Allotted</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Maker Info</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {group.drafts.map((draft) => (
                                                <tr key={draft.id} className="hover:bg-primary-50/30 transition-all">
                                                    <td className="px-8 py-6">
                                                        <p className="font-black text-gray-900">{draft.customerName}</p>
                                                        <p className="text-[10px] font-bold text-gray-400 font-mono">{draft.applicationNumber}</p>
                                                    </td>
                                                    <td className="px-6 py-6 text-right">
                                                        <p className="font-black text-gray-900">{draft.appliedQuantity} Units</p>
                                                        <p className="text-[10px] font-bold text-gray-400">रू {draft.appliedAmount.toLocaleString()}</p>
                                                    </td>
                                                    <td className="px-6 py-6 text-center">
                                                        {draft.isAllotted ? (
                                                            <div className="flex flex-col items-center">
                                                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-tighter shadow-sm flex items-center gap-1">
                                                                    <Check size={12} /> ALLOTTED
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center">
                                                                <span className="px-3 py-1 bg-red-100 text-red-700 text-[10px] font-black rounded-full uppercase tracking-tighter shadow-sm flex items-center gap-1">
                                                                    <XCircle size={12} /> NOT ALLOTTED
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-6 text-right">
                                                        <p className="font-black text-primary-600 text-lg">{draft.allottedQuantity} Units</p>
                                                        <p className="text-[10px] font-bold text-gray-400">to be credited</p>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center font-black text-gray-500 text-xs">
                                                                {draft.makerName?.[0]}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-black text-gray-900">{draft.makerName}</p>
                                                                <p className="text-[9px] font-bold text-gray-400 uppercase">{new Date(draft.submittedAt).toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Action Bar */}
                                <div className="p-8 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-gray-100">
                                    <div className="flex items-center gap-4 text-gray-500">
                                        <AlertTriangle size={20} className="text-amber-500" />
                                        <p className="text-sm font-bold max-w-md">Review all decisions carefully. Approving will trigger fund settlement and share credit for all {group.drafts.length} applications.</p>
                                    </div>
                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        <button
                                            onClick={() => {
                                                setSelectedIPO(group.ipoId);
                                                handleVerify(false);
                                            }}
                                            disabled={processing}
                                            className="flex-1 md:flex-none px-8 py-4 bg-white border-2 border-red-100 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            {processing && selectedIPO === group.ipoId ? <Loader2 className="animate-spin" size={16} /> : <XCircle size={16} />}
                                            Reject Batch
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedIPO(group.ipoId);
                                                setShowApproveDialog(true);
                                            }}
                                            disabled={processing}
                                            className="flex-1 md:flex-none px-12 py-4 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-700 transition-all shadow-xl shadow-primary-200 flex items-center justify-center gap-2"
                                        >
                                            Verify & Settle Batch
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Approve Batch Dialog */}
                {showApproveDialog && (
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 max-w-md w-full mx-4 border border-gray-100 animate-in zoom-in duration-300">
                            <div className="flex flex-col items-center text-center mb-8">
                                <div className="h-20 w-20 bg-primary-100 rounded-3xl flex items-center justify-center text-primary-600 mb-6">
                                    <CheckCircle size={40} />
                                </div>
                                <h2 className="text-3xl font-black text-gray-900">Authorize Settlement</h2>
                                <p className="text-gray-500 font-bold mt-2">
                                    You are about to finalize the allotment batch. This will perform real-time financial settlement for all applicants.
                                </p>
                            </div>

                            <div className="mb-8">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Optional Remarks</label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary-100 rounded-2xl font-bold text-sm outline-none transition-all resize-none"
                                    rows={3}
                                    placeholder="Add notes for the audit trail..."
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        setShowApproveDialog(false);
                                        setSelectedIPO(null);
                                        setRemarks('');
                                    }}
                                    className="flex-1 py-4 bg-white border-2 border-gray-100 text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleVerify(true)}
                                    disabled={processing}
                                    className="flex-1 py-4 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-200"
                                >
                                    {processing ? <Loader2 className="animate-spin" size={16} /> : null}
                                    Confirm Approval
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AllotmentVerification;

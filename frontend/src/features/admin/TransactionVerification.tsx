import { useState, useEffect } from 'react';
import { transactionVerificationApi } from '../../api/customerApi';
import { PendingTransaction } from '../../types';
import {
    CheckCircle2,
    XCircle,
    Search,
    Loader2,
    DollarSign,
    User
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function TransactionVerification() {
    const [transactions, setTransactions] = useState<PendingTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL');

    useEffect(() => {
        loadTransactions();
    }, []);

    const loadTransactions = async () => {
        try {
            setLoading(true);
            const response = await transactionVerificationApi.getPending();
            setTransactions(response.data);
        } catch (error) {
            console.error('Failed to load transactions:', error);
            toast.error('Failed to load pending transactions');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number) => {
        try {
            await transactionVerificationApi.approve(id);
            toast.success('Transaction approved successfully');
            loadTransactions();
        } catch (error) {
            console.error('Approval failed:', error);
            toast.error('Failed to approve transaction');
        }
    };

    const handleReject = async (id: number) => {
        const reason = window.prompt('Enter rejection reason:');
        if (!reason) return;

        try {
            await transactionVerificationApi.reject(id, reason);
            toast.success('Transaction rejected successfully');
            loadTransactions();
        } catch (error) {
            console.error('Rejection failed:', error);
            toast.error('Failed to reject transaction');
        }
    };

    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch =
            (tx.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (tx.accountNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (tx.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        const matchesType = filterType === 'ALL' || tx.transactionType === filterType;

        return matchesSearch && matchesType;
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Transaction Verification</h1>
                <p className="text-gray-500 font-medium mt-1">Review and approve pending system transactions</p>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by customer, account, or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-gray-700"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm font-black text-[10px] uppercase tracking-widest text-gray-500"
                    >
                        <option value="ALL">All Types</option>
                        <option value="DEPOSIT">Deposits</option>
                        <option value="WITHDRAWAL">Withdrawals</option>
                        <option value="CORE_CAPITAL_DEPOSIT">Core Capital Dep</option>
                        <option value="CORE_CAPITAL_WITHDRAWAL">Core Capital Wdr</option>
                    </select>
                </div>
            </div>

            {/* Transaction List */}
            {loading ? (
                <div className="text-center py-24">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">Loading pending transactions...</p>
                </div>
            ) : filteredTransactions.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {filteredTransactions.map((tx) => (
                        <div
                            key={tx.id}
                            className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                        >
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                {/* Left: Info */}
                                <div className="flex items-center gap-6 w-full md:w-auto">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${tx.transactionType.includes('DEPOSIT')
                                            ? 'bg-green-50 text-green-600'
                                            : 'bg-red-50 text-red-600'
                                        }`}>
                                        <DollarSign size={24} />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${tx.transactionType.includes('CORE')
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {tx.transactionType.replace(/_/g, ' ')}
                                            </span>
                                            <span className="text-gray-300">•</span>
                                            <span className="text-xs font-mono text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="text-lg font-black text-gray-900">
                                            {tx.transactionType.includes('DEPOSIT') ? '+' : '-'} Rs. {tx.amount.toLocaleString()}
                                        </h3>
                                        <p className="text-sm text-gray-500 flex items-center gap-2">
                                            <User size={14} />
                                            {tx.customerName || tx.accountNumber || 'Unknown Account'}
                                        </p>
                                        {tx.description && (
                                            <p className="text-xs text-gray-400 italic">"{tx.description}"</p>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Actions */}
                                <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                                    <button
                                        onClick={() => handleReject(tx.id)}
                                        className="flex-1 md:flex-none px-6 py-3 rounded-xl border border-red-100 text-red-600 font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                                    >
                                        <XCircle size={16} /> Reject
                                    </button>
                                    <button
                                        onClick={() => handleApprove(tx.id)}
                                        className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg shadow-green-500/30 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                                    >
                                        <CheckCircle2 size={16} /> Approve
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-24 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-sm">
                        <CheckCircle2 className="text-green-500" size={32} />
                    </div>
                    <h3 className="text-lg font-black text-gray-900">All Caught Up!</h3>
                    <p className="text-gray-400 text-sm mt-1">No pending transactions found.</p>
                </div>
            )}
        </div>
    );
}

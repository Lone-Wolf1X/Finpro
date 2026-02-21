import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ledgerApi } from '../../api/customerApi';
import {
    ArrowLeft,
    Wallet,
    ArrowDownLeft,
    ArrowUpRight,
    History,
    FileText,
    Loader2,
    Building2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiClient from '../../api/apiClient';

interface SystemAccount {
    id: number;
    accountName: string;
    accountCode: string;
    accountNumber: string;
    accountType: string;
    balance: number;
}

export default function SystemAccountDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [account, setAccount] = useState<SystemAccount | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw' | 'statement'>('overview');

    // Transaction Form State
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Statement State
    const [statement, setStatement] = useState<any>(null);
    const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [loadingStatement, setLoadingStatement] = useState(false);

    useEffect(() => {
        if (id) loadAccount();
    }, [id]);

    useEffect(() => {
        if (activeTab === 'statement' && id) {
            loadStatement();
        }
    }, [activeTab, startDate, endDate]);

    const loadAccount = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get<SystemAccount>(`/ledger/system-accounts/${id}`);
            setAccount(response.data);
        } catch (error) {
            console.error('Failed to load system account:', error);
            toast.error('Failed to load account details');
        } finally {
            setLoading(false);
        }
    };

    const loadStatement = async () => {
        try {
            setLoadingStatement(true);
            const response = await ledgerApi.getStatement(Number(id), startDate, endDate);
            setStatement(response.data);
        } catch (error) {
            console.error('Failed to load statement:', error);
            toast.error('Failed to load statement');
        } finally {
            setLoadingStatement(false);
        }
    };

    const handleTransaction = async (type: 'deposit' | 'withdraw') => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        if (!description) {
            toast.error('Please enter a description');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                targetAccountId: Number(id),
                amount: Number(amount),
                description
            };

            if (type === 'deposit') {
                await apiClient.post('/capital-deposits', payload);
                toast.success('Capital Deposit Initiated (Pending Approval)');
            } else {
                await apiClient.post('/capital-deposits/withdraw', payload);
                toast.success('Capital Withdrawal Initiated (Pending Approval)');
            }
            setAmount('');
            setDescription('');
            setActiveTab('overview');
        } catch (error) {
            console.error('Transaction failed:', error);
            toast.error('Transaction failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Loading Account...</p>
        </div>
    );

    if (!account) return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-900">Account not found</h2>
            <button onClick={() => navigate('/admin/system-accounts')} className="mt-4 text-blue-600 font-medium hover:underline">
                Back to List
            </button>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header & Navigation */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/system-accounts')}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">{account.accountName}</h1>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                        <span className="bg-gray-100 px-2 py-0.5 rounded textxs font-mono">{account.accountNumber}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest text-white ${account.accountType === 'EXPENSE' ? 'bg-red-500' :
                            account.accountType === 'ASSET' || account.accountCode === 'CORE_CAPITAL' ? 'bg-blue-500' :
                                account.accountType === 'LIABILITY' ? 'bg-purple-500' : 'bg-green-500'
                            }`}>
                            {account.accountCode || account.accountType}
                        </span>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet size={80} className="text-blue-600" />
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Current Balance</p>
                    <p className="text-4xl font-black text-gray-900 mt-2 tracking-tighter">
                        Rs. {account.balance?.toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                <div className="border-b border-gray-100 p-2 flex gap-2 overflow-x-auto">
                    {[
                        { id: 'overview', label: 'Overview', icon: FileText },
                        { id: 'deposit', label: 'Add Funds', icon: ArrowDownLeft },
                        { id: 'withdraw', label: 'Withdraw', icon: ArrowUpRight },
                        { id: 'statement', label: 'Statement', icon: History },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`
                                flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all
                                ${activeTab === tab.id
                                    ? 'bg-gray-900 text-white shadow-lg shadow-gray-200 scale-100'
                                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}
                            `}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-8 min-h-[400px]">
                    {activeTab === 'overview' && (
                        <div className="text-center py-12 space-y-4">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Building2 className="text-gray-300 w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">System Account Overview</h3>
                            <p className="text-gray-500 max-w-md mx-auto">
                                Manage internal funds, expenses, and capital adjustments. All transactions are subject to Maker-Checker verification.
                            </p>
                        </div>
                    )}

                    {(activeTab === 'deposit' || activeTab === 'withdraw') && (
                        <div className="max-w-xl mx-auto space-y-6">
                            <div className="text-center space-y-2 mb-8">
                                <h3 className="text-2xl font-black text-gray-900">
                                    {activeTab === 'deposit' ? 'Inject Capital / Add Funds' : 'Withdraw Capital / Funds'}
                                </h3>
                                <p className="text-gray-500 font-medium">
                                    {activeTab === 'deposit'
                                        ? 'Initiate a request to add funds to this system account.'
                                        : 'Initiate a request to withdraw funds from this system account.'}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">NPR</span>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full pl-14 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl outline-none font-mono text-xl font-bold transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description / Remarks</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl outline-none transition-all resize-none h-32"
                                        placeholder="Enter transaction details..."
                                    />
                                </div>

                                <button
                                    onClick={() => handleTransaction(activeTab)}
                                    disabled={submitting}
                                    className={`
                                        w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl transition-all
                                        ${activeTab === 'deposit'
                                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/30'
                                            : 'bg-red-600 text-white hover:bg-red-700 shadow-red-500/30'}
                                        ${submitting ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}
                                    `}
                                >
                                    {submitting ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 size={16} className="animate-spin" />
                                            Processing...
                                        </span>
                                    ) : (
                                        activeTab === 'deposit' ? 'Confim Deposit Request' : 'Confirm Withdrawal Request'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'statement' && (
                        <div className="space-y-6">
                            {/* Date Filter */}
                            <div className="flex flex-wrap gap-4 items-end bg-gray-50 p-4 rounded-2xl">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="px-3 py-2 rounded-xl border-gray-200 text-sm font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="px-3 py-2 rounded-xl border-gray-200 text-sm font-medium"
                                    />
                                </div>
                                <button
                                    onClick={loadStatement}
                                    className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-800"
                                >
                                    Refresh
                                </button>
                            </div>

                            {/* Table */}
                            {loadingStatement ? (
                                <div className="text-center py-12">
                                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-2xl border border-gray-100">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 border-b border-gray-100">
                                            <tr>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {statement?.transactions?.length > 0 ? (
                                                statement.transactions.map((tx: any) => (
                                                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-4 text-sm font-mono text-gray-500">
                                                            {new Date(tx.date).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 relative group">
                                                            {tx.description}
                                                            {tx.referenceId && (
                                                                <span className="block text-[10px] text-gray-400 font-mono">Ref: {tx.referenceId}</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${tx.type === 'DEPOSIT' || tx.type === 'CORE_CAPITAL_DEPOSIT'
                                                                ? 'bg-green-50 text-green-600 border-green-100'
                                                                : 'bg-red-50 text-red-600 border-red-100'
                                                                }`}>
                                                                {tx.type}
                                                            </span>
                                                        </td>
                                                        <td className={`px-6 py-4 text-sm font-black font-mono text-right ${tx.type === 'DEPOSIT' || tx.type === 'CORE_CAPITAL_DEPOSIT' ? 'text-green-600' : 'text-red-600'
                                                            }`}>
                                                            {tx.type === 'DEPOSIT' || tx.type === 'CORE_CAPITAL_DEPOSIT' ? '+' : '-'} {tx.amount.toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${tx.status === 'COMPLETED' || tx.status === 'APPROVED'
                                                                ? 'bg-blue-50 text-blue-600'
                                                                : 'bg-yellow-50 text-yellow-600'
                                                                }`}>
                                                                {tx.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                                                        No transactions found for this period
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

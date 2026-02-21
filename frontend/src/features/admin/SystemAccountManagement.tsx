import React, { useState, useEffect } from 'react';
import { ledgerApi } from '../../api/customerApi';
import { LedgerAccount, ProfitSummary } from '../../types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Plus, List, Wallet, Building2, TrendingDown, TrendingUp, Filter, ArrowUpRight, ArrowDownRight, X } from 'lucide-react';

export default function SystemAccountManagement() {
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
    const [profitSummary, setProfitSummary] = useState<ProfitSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [withdrawalData, setWithdrawalData] = useState({ amount: '', description: '' });
    const [newAccount, setNewAccount] = useState({
        name: '',
        type: 'EXPENSE'
    });

    const accountTypes = [
        { value: 'EXPENSE', label: 'Expense Account', icon: <TrendingDown size={14} className="text-red-500" /> },
        { value: 'REVENUE', label: 'Revenue / Fee Income', icon: <TrendingUp size={14} className="text-green-500" /> },
        { value: 'ASSET', label: 'Asset Account', icon: <Wallet size={14} className="text-blue-500" /> },
        { value: 'LIABILITY', label: 'Liability Account', icon: <Building2 size={14} className="text-purple-500" /> }
    ];

    useEffect(() => {
        loadAccounts();
        loadProfitSummary();
    }, []);

    const loadAccounts = async () => {
        try {
            const response = await ledgerApi.getSystemAccounts();
            setAccounts(response.data);
        } catch (error) {
            toast.error('Failed to load system accounts');
        } finally {
            setLoading(false);
        }
    };

    const loadProfitSummary = async () => {
        try {
            const response = await ledgerApi.getProfitSummary();
            setProfitSummary(response.data);
        } catch (error) {
            console.error('Failed to load profit summary');
        }
    };

    const handleWithdrawProfits = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await ledgerApi.withdrawProfits(Number(withdrawalData.amount), withdrawalData.description);
            toast.success('Profit withdrawal request created');
            setIsWithdrawing(false);
            setWithdrawalData({ amount: '', description: '' });
            loadAccounts();
            loadProfitSummary();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Withdrawal failed');
        }
    };

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await ledgerApi.createSystemAccount(newAccount.name, newAccount.type);
            toast.success('System account created successfully');
            setIsAdding(false);
            setNewAccount({ name: '', type: 'EXPENSE' });
            loadAccounts();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create account');
        }
    };

    return (
        <div className="p-8 bg-gray-50/50 min-h-screen">
            <div className="w-full">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
                            System Accounts
                        </h1>
                        <p className="text-gray-500 font-bold flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                            Manage Internal Ledgers, Expenses & Profits
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setIsAdding(!isAdding)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all shadow-lg hover:shadow-xl active:scale-95 ${isAdding
                                ? 'bg-gray-200 text-gray-700'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                        >
                            {isAdding ? <List size={20} /> : <Plus size={20} />}
                            {isAdding ? 'View Accounts' : 'New System Account'}
                        </button>
                    </div>
                </div>

                {isAdding ? (
                    /* Create Account Form */
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-2xl shadow-blue-500/5 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
                        <div className="bg-blue-50/30 p-4 rounded-2xl mb-8 border border-blue-100/50">
                            <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                <Plus size={16} /> Create New Internal Ledger
                            </h2>
                        </div>
                        <form onSubmit={handleCreateAccount} className="space-y-8">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Account Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newAccount.name}
                                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-700 placeholder:text-gray-300 shadow-inner"
                                    placeholder="e.g. Office Stationery Expense"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Account Category</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {accountTypes.map((type) => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setNewAccount({ ...newAccount, type: type.value })}
                                            className={`p-5 rounded-2xl border-2 transition-all flex items-center gap-4 group ${newAccount.type === type.value
                                                ? 'border-blue-500 bg-blue-50/50 shadow-md'
                                                : 'border-gray-50 bg-gray-50/50 hover:border-gray-200'
                                                }`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${newAccount.type === type.value
                                                ? 'bg-blue-600 text-white scale-110 shadow-lg'
                                                : 'bg-white text-gray-400 group-hover:bg-gray-200'
                                                }`}>
                                                {React.cloneElement(type.icon as React.ReactElement<any>, { size: 20 })}
                                            </div>
                                            <span className={`font-black text-sm uppercase tracking-tight ${newAccount.type === type.value ? 'text-blue-700' : 'text-gray-500'
                                                }`}>
                                                {type.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-50 flex gap-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-95 transition-all text-sm uppercase tracking-widest"
                                >
                                    Confirm Account Creation
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="px-8 py-5 border-2 border-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-50 transition-all text-sm uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    /* Accounts List Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
                        {loading ? (
                            Array(6).fill(0).map((_, i) => (
                                <div key={i} className="h-48 bg-white rounded-3xl border border-gray-100 animate-pulse"></div>
                            ))
                        ) : accounts.length > 0 ? (
                            accounts.map((account: LedgerAccount) => {
                                const isProfitAccount = account.accountCode === 'ADMIN_PROFIT';
                                return (
                                    <div
                                        key={account.id}
                                        onClick={() => navigate(`/admin/system-accounts/${account.id}`)}
                                        className="group bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-gray-200/20 hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden cursor-pointer"
                                    >
                                        {/* Type Ribbon */}
                                        <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest text-white ${account.accountType === 'EXPENSE' ? 'bg-red-500' :
                                            account.accountType === 'ASSET' ? 'bg-blue-500' :
                                                account.accountType === 'LIABILITY' ? 'bg-purple-500' : 'bg-green-500'
                                            }`}>
                                            {account.accountType}
                                        </div>

                                        <div className="flex items-start gap-4 mb-6">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${account.accountType === 'EXPENSE' ? 'bg-red-50 text-red-500' :
                                                account.accountType === 'ASSET' ? 'bg-blue-50 text-blue-500' :
                                                    account.accountType === 'LIABILITY' ? 'bg-purple-50 text-purple-500' : 'bg-green-50 text-green-500'
                                                }`}>
                                                {account.accountType === 'EXPENSE' ? <TrendingDown size={24} /> :
                                                    account.accountType === 'ASSET' ? <Wallet size={24} /> :
                                                        account.accountType === 'LIABILITY' ? <Building2 size={24} /> : <TrendingUp size={24} />}
                                            </div>
                                            <div className="pr-12">
                                                <h3 className="font-black text-gray-800 text-lg leading-tight uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                                                    {account.accountName}
                                                </h3>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                                                    ID: #{account.id.toString().padStart(4, '0')}
                                                </p>
                                            </div>
                                        </div>

                                        {isProfitAccount && profitSummary && (
                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                <div className="bg-green-50/50 rounded-xl p-3 border border-green-100/50">
                                                    <span className="text-[8px] font-black text-green-600 uppercase tracking-widest flex items-center gap-1">
                                                        <ArrowUpRight size={10} /> Total Earned
                                                    </span>
                                                    <p className="text-xs font-black text-green-700 mt-1">Rs. {profitSummary.totalEarned.toLocaleString()}</p>
                                                </div>
                                                <div className="bg-red-50/50 rounded-xl p-3 border border-red-100/50">
                                                    <span className="text-[8px] font-black text-red-600 uppercase tracking-widest flex items-center gap-1">
                                                        <ArrowDownRight size={10} /> Withdrawn
                                                    </span>
                                                    <p className="text-xs font-black text-red-700 mt-1">Rs. {profitSummary.totalWithdrawn.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100/50 flex items-center justify-between">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available Balance</span>
                                            <span className={`text-xl font-black ${account.balance >= 0 ? 'text-gray-800' : 'text-red-600'
                                                }`}>
                                                Rs. {account.balance.toLocaleString()}
                                            </span>
                                        </div>

                                        {isProfitAccount && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsWithdrawing(true);
                                                }}
                                                className="w-full mt-4 py-3 bg-gray-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg shadow-black/10"
                                            >
                                                Withdraw Profits
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Filter size={32} className="text-gray-300" />
                                </div>
                                <h3 className="text-xl font-black text-gray-700 uppercase tracking-tight mb-2">No System Accounts Found</h3>
                                <p className="text-gray-400 font-bold max-w-xs mx-auto">Click 'New System Account' to start managing your internal ledgers.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Withdrawal Modal */}
            {isWithdrawing && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Withdraw Profits</h2>
                                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">From: Admin Profits Account</p>
                            </div>
                            <button onClick={() => setIsWithdrawing(false)} className="bg-gray-100 p-2 rounded-xl text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleWithdrawProfits} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Withdrawal Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">Rs.</span>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={withdrawalData.amount}
                                        onChange={(e) => setWithdrawalData({ ...withdrawalData, amount: e.target.value })}
                                        className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-black text-lg text-gray-700 shadow-inner"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Description / Reason</label>
                                <textarea
                                    required
                                    value={withdrawalData.description}
                                    onChange={(e) => setWithdrawalData({ ...withdrawalData, description: e.target.value })}
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-700 min-h-[100px] shadow-inner"
                                    placeholder="e.g. Quarterly profit payout"
                                />
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-gray-900 text-white font-black py-4 rounded-2xl shadow-xl shadow-black/20 hover:bg-black active:scale-95 transition-all text-xs uppercase tracking-widest"
                                >
                                    Confirm Withdrawal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsWithdrawing(false)}
                                    className="px-8 py-4 border-2 border-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-50 transition-all text-xs uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

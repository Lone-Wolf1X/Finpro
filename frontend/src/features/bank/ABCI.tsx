import { useState } from 'react';
import { bankModuleApi, bankAccountApi } from '../../api/customerApi';
import { AccountBalanceInfo, AccountStatement } from '../../types';
import {
    Search, Wallet, Landmark, ShieldCheck,
    Activity, Loader2, FileText, X, TrendingUp, TrendingDown
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ABCI() {
    const [accountNumber, setAccountNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [balanceInfo, setBalanceInfo] = useState<AccountBalanceInfo | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [statement, setStatement] = useState<AccountStatement | null>(null);
    const [statementLoading, setStatementLoading] = useState(false);

    const fetchName = async () => {
        if (!accountNumber || balanceInfo?.accountNumber === accountNumber) return;
        try {
            const response = await bankModuleApi.abci(accountNumber);
            setBalanceInfo(response.data);
            toast.success(`Account: ${response.data.customerName}`);
        } catch {
            toast.error('Account not found');
            setBalanceInfo(null);
        }
    };

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!accountNumber) return toast.error('Enter account number');
        setLoading(true);
        await fetchName();
        setLoading(false);
    };

    const loadStatement = async () => {
        if (!balanceInfo) return;
        setStatementLoading(true);
        try {
            // Fetch last 30 days by default
            const end = new Date().toISOString().split('T')[0];
            const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            // We need the internal ID for statement, but ABCI returned AccountNumber.
            // Let's fetch the full account details first to get the ID.
            const accsRes = await bankAccountApi.getAll();
            const account = accsRes.data.find(a => a.accountNumber === balanceInfo.accountNumber);

            if (account) {
                const res = await bankAccountApi.getStatement(account.id, start, end);
                setStatement(res.data);
                setShowDetails(true);
            } else {
                toast.error('Could not find internal account ID');
            }
        } catch (error) {
            console.error('Error loading statement:', error);
            toast.error('Failed to load statement');
        } finally {
            setStatementLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-10">
            {/* Search Input */}
            <form onSubmit={handleSearch} className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" size={24} />
                <input
                    type="text"
                    placeholder="Enter Account Number (Press Tab to fetch name)"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    onBlur={fetchName}
                    className="w-full pl-16 pr-32 py-6 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary-600 rounded-3xl outline-none font-black text-lg transition-all shadow-inner"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-8 py-3 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 disabled:bg-gray-400"
                >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                    SEARCH
                </button>
            </form>

            {balanceInfo && (
                <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                    {/* Header Card */}
                    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-10">
                            <Landmark size={150} />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                            <div>
                                <p className="text-[10px] font-black text-primary-400 uppercase tracking-[0.3em] mb-2">Account Registry</p>
                                <h3 className="text-4xl font-black tracking-tight mb-4">{balanceInfo.customerName}</h3>
                                <div className="flex flex-wrap gap-3">
                                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md">
                                        <Landmark size={14} className="text-primary-400" />
                                        <span className="text-xs font-bold uppercase tracking-widest">{balanceInfo.bankName}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md">
                                        <ShieldCheck size={14} className="text-primary-400" />
                                        <span className="text-xs font-bold font-mono tracking-tighter">{balanceInfo.accountNumber}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${balanceInfo.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    {balanceInfo.status}
                                </span>
                                <button
                                    onClick={loadStatement}
                                    disabled={statementLoading}
                                    className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-50 transition-all shadow-lg active:scale-95"
                                >
                                    {statementLoading ? <Loader2 className="animate-spin" size={14} /> : <FileText size={14} />}
                                    View Account Details
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Balance Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit mb-6">
                                <Wallet size={24} />
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Total Balance</p>
                            <p className="text-3xl font-black text-gray-900 tracking-tight">रू {balanceInfo.totalBalance.toLocaleString()}</p>
                        </div>

                        <div className="bg-white p-8 rounded-[2rem] border border-red-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
                            <div className="p-3 bg-red-50 text-red-600 rounded-2xl w-fit mb-6">
                                <Activity size={24} />
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Held Amount (Lien)</p>
                            <p className="text-3xl font-black text-red-600 tracking-tight">रू {balanceInfo.heldBalance.toLocaleString()}</p>
                        </div>

                        <div className="bg-emerald-600 p-8 rounded-[2.5rem] shadow-2xl shadow-emerald-100 transition-all hover:scale-[1.02]">
                            <div className="p-3 bg-white/20 text-white rounded-2xl w-fit mb-6">
                                <ShieldCheck size={24} />
                            </div>
                            <p className="text-[10px] font-black text-emerald-100 uppercase tracking-[0.2em] mb-1">Available Funds</p>
                            <p className="text-3xl font-black text-white tracking-tight">रू {balanceInfo.availableBalance.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Transaction Statement Section */}
                    {showDetails && statement && (
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl overflow-hidden animate-in slide-in-from-top-10 duration-700">
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gray-900 text-white rounded-2xl">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-gray-900 tracking-tight">Account Statement</h4>
                                        <p className="text-xs font-bold text-gray-500">Recent Transactions (Last 30 Days)</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowDetails(false)}
                                    className="p-3 hover:bg-gray-200 rounded-2xl transition-colors text-gray-400 hover:text-gray-900"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100/30">
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Particulars</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {statement.transactions.map((tx, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <p className="text-sm font-bold text-gray-900">{new Date(tx.date).toLocaleDateString()}</p>
                                                    <p className="text-[10px] font-bold text-gray-400">{new Date(tx.date).toLocaleTimeString()}</p>
                                                </td>
                                                <td className="px-8 py-6 font-bold text-sm text-gray-600">{tx.description}</td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${tx.type === 'DEPOSIT' || tx.type === 'CREDIT' || tx.type.includes('DEPOSIT') ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {tx.type}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right font-black text-sm">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {tx.type === 'DEPOSIT' || tx.type === 'CREDIT' || tx.type.includes('DEPOSIT') ? <TrendingUp size={12} className="text-emerald-500" /> : <TrendingDown size={12} className="text-red-500" />}
                                                        रू {tx.amount.toLocaleString()}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {statement.transactions.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-10 text-center text-gray-400 font-bold">No transactions found in this period.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!balanceInfo && !loading && (
                <div className="bg-gray-50 rounded-[3rem] border-4 border-dashed border-gray-200 p-32 text-center transition-all">
                    <div className="p-8 bg-white rounded-full w-fit mx-auto mb-8 shadow-xl border border-gray-100">
                        <Search className="text-gray-300" size={64} />
                    </div>
                    <h4 className="text-2xl font-black text-gray-900 tracking-tight">System Ready for Query</h4>
                    <p className="text-gray-500 font-bold mt-3 max-w-sm mx-auto italic">Enter a master account number above to initialize real-time balance assessment and statement retrieval.</p>
                </div>
            )}
        </div>
    );
}

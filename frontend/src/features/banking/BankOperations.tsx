import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bankAccountApi } from '../../api/customerApi';
import { BankAccount } from '../../types';
import {
    Search,
    Filter,
    CreditCard,
    History,
    ArrowRight,
    ArrowDownLeft,
    ArrowUpRight,
    Landmark,
    Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function BankOperations() {
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL');

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        try {
            setLoading(true);
            const response = await bankAccountApi.getAll();
            setAccounts(response.data);
        } catch (error) {
            console.error('Failed to load bank accounts:', error);
            toast.error('Failed to load accounts');
        } finally {
            setLoading(false);
        }
    };

    const filteredAccounts = accounts.filter(acc => {
        const matchesSearch =
            acc.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            acc.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            acc.bankName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = filterType === 'ALL' || acc.accountType === filterType;

        return matchesSearch && matchesType;
    });

    if (loading) return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Loading Accounts...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Banking Operations</h1>
                <p className="text-gray-500 font-medium mt-1">Manage and monitor customer bank transactions</p>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by account number, customer, or bank..."
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
                        <option value="SAVINGS">Savings</option>
                        <option value="CURRENT">Current</option>
                        <option value="FIXED">Fixed</option>
                    </select>
                </div>
            </div>

            {/* Account Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAccounts.map(account => (
                    <div
                        key={account.id}
                        className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden hover:shadow-2xl hover:border-blue-100 transition-all group flex flex-col"
                    >
                        <div className="p-6 space-y-4 flex-grow">
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                                    <Landmark size={24} />
                                </div>
                                <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${account.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {account.status}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">{account.customerName}</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{account.bankName}</p>
                            </div>

                            <div className="space-y-2 pt-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400 font-bold uppercase tracking-tighter text-[10px]">Account No</span>
                                    <span className="font-mono font-black text-gray-700 tracking-widest">{account.accountNumber}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-gray-400 font-bold uppercase tracking-tighter text-[10px]">Balance</span>
                                    <div className="text-right">
                                        <p className="text-2xl font-black font-mono text-gray-900 leading-none tracking-tighter">
                                            रू {(account.balance || 0).toLocaleString()}
                                        </p>
                                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">NPR Available</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                            <button
                                onClick={() => navigate(`/banking/accounts/${account.id}`)}
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-100 transition-all"
                            >
                                <History size={14} />
                                History
                            </button>
                            <button
                                onClick={() => navigate(`/banking/accounts/${account.id}`)}
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all"
                            >
                                <ArrowRight size={14} />
                                Transact
                            </button>
                        </div>
                    </div>
                ))}

                {filteredAccounts.length === 0 && (
                    <div className="col-span-full py-24 text-center space-y-4 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-gray-100">
                            <Search className="text-gray-300" size={32} />
                        </div>
                        <div>
                            <p className="text-xl font-black text-gray-900">No accounts found</p>
                            <p className="text-gray-400 font-medium">Try adjusting your search or filters</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { CreditCard, DollarSign, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SystemAccount {
    id: number;
    accountNumber: string;
    accountName: string;
    balance: number;
}

export default function CapitalDepositForm() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [systemAccounts, setSystemAccounts] = useState<SystemAccount[]>([]);
    const [formData, setFormData] = useState({
        targetAccountId: 0,
        amount: '',
        description: ''
    });

    useEffect(() => {
        loadSystemAccounts();
    }, []);

    const loadSystemAccounts = async () => {
        try {
            const response = await apiClient.get('/system-accounts');
            setSystemAccounts(response.data);
        } catch (error) {
            console.error('Failed to load system accounts:', error);
            toast.error('Failed to load target accounts');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.targetAccountId === 0) {
            toast.error('Please select a target account');
            return;
        }

        try {
            setLoading(true);
            await apiClient.post('/capital-deposits', {
                targetAccountId: formData.targetAccountId,
                amount: parseFloat(formData.amount),
                description: formData.description
            });

            toast.success('Capital deposit initiated successfully (Pending Verification)');
            navigate('/capital-deposits/verify'); // Or dashboard
        } catch (error: any) {
            console.error('Capital deposit error:', error);
            toast.error(error.response?.data?.message || 'Failed to initiate capital deposit');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
                    <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                        <DollarSign className="bg-white/20 p-1 rounded-lg" size={32} />
                        Capital Deposit
                    </h1>
                    <p className="text-blue-100 mt-2 font-medium opacity-80">Initiate a fund transfer to a system account for verification.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Target System Account</label>
                        <div className="relative">
                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <select
                                required
                                value={formData.targetAccountId}
                                onChange={(e) => setFormData({ ...formData, targetAccountId: Number(e.target.value) })}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-700 appearance-none"
                            >
                                <option value={0}>-- Select Target Account --</option>
                                {systemAccounts.map(account => (
                                    <option key={account.id} value={account.id}>
                                        {account.accountName} ({account.accountNumber})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Deposit Amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">NPR</span>
                            <input
                                type="number"
                                required
                                step="0.01"
                                min="0.01"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full pl-16 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-xl font-black text-blue-600"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Description / Particulars</label>
                        <textarea
                            required
                            rows={3}
                            placeholder="e.g. Initial capital injection for FY 2080/81"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700 placeholder:text-gray-300"
                        />
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex-1 px-6 py-4 border-2 border-gray-100 text-gray-400 rounded-xl font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] bg-blue-600 text-white px-6 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Send size={18} />
                                    Initiate Deposit
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <div className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-100">
                <h3 className="text-blue-800 font-black uppercase tracking-widest text-[10px] mb-2">Maker-Checker Rule</h3>
                <p className="text-blue-600 text-xs font-medium leading-relaxed">
                    This deposit will remain in <span className="font-bold">PENDING</span> status until verified by a Checker or Admin.
                    Once approved, the funds will be credited to the target system account.
                </p>
            </div>
        </div>
    );
}

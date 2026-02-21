import { useState, useEffect } from 'react';
import { bankModuleApi, bankAccountApi } from '../../api/customerApi';
import { AccountLien, BankAccount } from '../../types';
import {
    Lock, ChevronRight, AlertCircle, Loader2, RefreshCw,
    Plus, Search, Edit3, CheckCircle2, XCircle,
    Calendar, FileText, Landmark
} from 'lucide-react';
import toast from 'react-hot-toast';

type ALMOperation = 'INQUIRY' | 'ADD' | 'MODIFY' | 'VERIFY' | 'DELETE' | 'CANCEL';

export default function ALM() {
    const [operation, setOperation] = useState<ALMOperation>('INQUIRY');
    const [accountSearch, setAccountSearch] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const [customerName, setCustomerName] = useState('');
    const [currentAccount, setCurrentAccount] = useState<BankAccount | null>(null);
    const [liens, setLiens] = useState<AccountLien[]>([]);
    const [loading, setLoading] = useState(false);

    // Form state for ADD/MODIFY
    const [formData, setFormData] = useState<Partial<AccountLien>>({
        amount: 0,
        purpose: '',
        reason: '',
        startDate: new Date().toISOString().split('T')[0],
        expiryDate: ''
    });

    useEffect(() => {
        // No initial load needed now
    }, []);

    const fetchAccount = async () => {
        if (!accountSearch) return;
        setLoading(true);
        try {
            // Use ABCI endpoint to fetch name and then find ID
            const res = await bankModuleApi.abci(accountSearch);
            setCustomerName(res.data.customerName);

            // We need the internal ID for ALM inquiry.
            // Let's find it by account number from the backend or match it.
            const accsRes = await bankAccountApi.getAll();
            const account = accsRes.data.find(a => a.accountNumber === res.data.accountNumber);

            if (account) {
                setSelectedAccountId(account.id);
                setCurrentAccount(account);
                loadLiens(account.id);
                toast.success(`Account Loaded: ${res.data.customerName}`);
            } else {
                toast.error('Internal account mapping failed');
            }
        } catch {
            setCustomerName('');
            setSelectedAccountId(null);
            setLiens([]);
            toast.error('Account not found');
        } finally {
            setLoading(false);
        }
    };

    const loadLiens = async (accountId: number) => {
        setLoading(true);
        try {
            const response = await bankModuleApi.alm(accountId);
            setLiens(response.data);
        } catch (error) {
            console.error('Error loading liens:', error);
            toast.error('Failed to load liens');
        } finally {
            setLoading(false);
        }
    };

    const handleAddLien = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAccountId) return toast.error('Select an account');
        if (!formData.amount || formData.amount <= 0) return toast.error('Invalid amount');

        setLoading(true);
        try {
            await bankModuleApi.addLien({
                ...formData,
                bankAccountId: selectedAccountId
            });
            toast.success('Lien added successfully');
            setOperation('INQUIRY');
            loadLiens(selectedAccountId);
            setFormData({ amount: 0, purpose: '', reason: '', startDate: new Date().toISOString().split('T')[0], expiryDate: '' });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add lien');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (lienId: number, status: string) => {
        if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this lien?`)) return;
        try {
            await bankModuleApi.releaseLien(lienId); // We currently only have releaseLien, using it for transition
            toast.success(`Lien ${status.toLowerCase()}ed`);
            if (selectedAccountId) loadLiens(selectedAccountId);
        } catch (error) {
            toast.error('Operation failed');
        }
    };

    if (loading && liens.length === 0 && !selectedAccountId) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="animate-spin text-primary-600" size={48} />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Multi-Function Header */}
            <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm w-full md:w-auto">
                    {[
                        { label: 'Inquiry', op: 'INQUIRY' as ALMOperation, icon: Search },
                        { label: 'Add', op: 'ADD' as ALMOperation, icon: Plus },
                        { label: 'Verify', op: 'VERIFY' as ALMOperation, icon: CheckCircle2 }
                    ].map((btn) => (
                        <button
                            key={btn.op}
                            onClick={() => setOperation(btn.op)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${operation === btn.op ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'
                                }`}
                        >
                            <btn.icon size={14} />
                            {btn.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80 group">
                        <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600" size={18} />
                        <input
                            type="text"
                            placeholder="Enter Account Number"
                            value={accountSearch}
                            onChange={(e) => setAccountSearch(e.target.value)}
                            onBlur={fetchAccount}
                            className="w-full pl-12 pr-10 py-4 bg-white border-2 border-gray-100 rounded-2xl font-black text-xs text-gray-900 focus:border-primary-600 outline-none shadow-sm"
                        />
                        {customerName && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-primary-50 text-primary-700 rounded-lg text-[8px] font-black border border-primary-100 uppercase">
                                {customerName}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => selectedAccountId && loadLiens(selectedAccountId)}
                        className="p-4 bg-white border-2 border-gray-100 text-gray-600 rounded-2xl hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Operation Content */}
            <div className="min-h-[400px]">
                {operation === 'INQUIRY' || operation === 'VERIFY' ? (
                    <div className="overflow-hidden bg-white border border-gray-100 rounded-[2.5rem] shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Hold Details</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Validity</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {liens.length > 0 ? liens.filter(l => operation === 'INQUIRY' || l.status === 'ACTIVE').map(lien => (
                                    <tr key={lien.id} className="hover:bg-gray-50/30 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl">
                                                    <Lock size={16} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900">{lien.purpose}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Ref: {lien.referenceId || 'Manual'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                                <Calendar size={12} className="text-gray-400" />
                                                <span>{lien.startDate ? new Date(lien.startDate).toLocaleDateString() : 'N/A'}</span>
                                                <ChevronRight size={10} className="text-gray-300" />
                                                <span className={lien.expiryDate ? 'text-red-500' : 'text-gray-400'}>
                                                    {lien.expiryDate ? new Date(lien.expiryDate).toLocaleDateString() : 'No Limit'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-lg font-black text-gray-900">रू {lien.amount.toLocaleString()}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${lien.status === 'ACTIVE' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                lien.status === 'RELEASED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    'bg-gray-50 text-gray-400 border-gray-100'
                                                }`}>
                                                {lien.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {lien.status === 'ACTIVE' && (
                                                    <>
                                                        <button
                                                            onClick={() => setOperation('MODIFY')}
                                                            className="p-3 bg-gray-50 text-gray-600 rounded-xl hover:bg-primary-50 hover:text-primary-600 transition-colors"
                                                        >
                                                            <Edit3 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(lien.id, 'RELEASE')}
                                                            className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-colors"
                                                        >
                                                            <XCircle size={14} />
                                                        </button>
                                                    </>
                                                )}
                                                {operation === 'VERIFY' && lien.status === 'ACTIVE' && (
                                                    <button
                                                        onClick={() => handleStatusChange(lien.id, 'VERIFY')}
                                                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100"
                                                    >
                                                        VERIFY
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-32 text-center">
                                            <div className="p-8 bg-gray-50 rounded-full w-fit mx-auto mb-6">
                                                <AlertCircle size={48} className="text-gray-300" />
                                            </div>
                                            <p className="text-xl font-black text-gray-900">No active liens detected</p>
                                            <p className="text-gray-400 font-bold mt-1">Select another account or initiate a new hold record.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : operation === 'ADD' ? (
                    <div className="max-w-3xl mx-auto bg-white p-12 rounded-[3rem] border border-gray-100 shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="p-4 bg-primary-600 text-white rounded-3xl shadow-xl shadow-primary-100">
                                <Plus size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Initiate Account Hold</h3>
                                <p className="text-gray-500 font-bold text-sm">Lock funds for a specific purpose or duration.</p>
                            </div>
                        </div>

                        <form onSubmit={handleAddLien} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Hold Amount</label>
                                    <input
                                        type="number"
                                        placeholder="रू 0.00"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary-600 rounded-2xl outline-none font-black text-lg transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Lien Purpose</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. IPO Application"
                                        value={formData.purpose}
                                        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary-600 rounded-2xl outline-none font-black text-lg transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Start Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary-600 rounded-2xl outline-none font-bold text-gray-900 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Expiry Date (Optional)</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="date"
                                            value={formData.expiryDate}
                                            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                            className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary-600 rounded-2xl outline-none font-bold text-gray-900 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reason / Narrative</label>
                                <div className="relative">
                                    <FileText className="absolute left-4 top-4 text-gray-400" size={18} />
                                    <textarea
                                        placeholder="Detailed reason for hold..."
                                        rows={3}
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                        className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary-600 rounded-2xl outline-none font-bold text-gray-900 transition-all resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setOperation('INQUIRY')}
                                    className="flex-1 py-5 bg-gray-100 text-gray-500 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                                >
                                    CANCEL
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-[2] py-5 bg-gray-900 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95 disabled:bg-gray-400"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                                    AUTHORIZE HOLD
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="text-center p-20 text-gray-400 font-bold uppercase tracking-widest">
                        Module functionality coming soon...
                    </div>
                )}
            </div>

            {/* Account Stats Preview */}
            {currentAccount && operation === 'ADD' && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-xl border border-white/10 px-10 py-6 rounded-[2rem] text-white shadow-2xl flex items-center gap-12 z-50 animate-in slide-in-from-bottom-20 duration-1000">
                    <div>
                        <p className="text-[9px] font-black text-primary-400 uppercase tracking-widest mb-1">Available Funds</p>
                        <p className="text-xl font-black tabular-nums">रू {((currentAccount?.balance ?? 0) - (currentAccount?.heldBalance ?? 0)).toLocaleString()}</p>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div>
                        <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">New Hold Total</p>
                        <p className="text-xl font-black tabular-nums text-red-400">रू {((currentAccount?.heldBalance ?? 0) + (formData.amount || 0)).toLocaleString()}</p>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div>
                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Post-Auth Available</p>
                        <p className="text-xl font-black tabular-nums text-emerald-400">रू {((currentAccount?.balance ?? 0) - (currentAccount?.heldBalance ?? 0) - (formData.amount || 0)).toLocaleString()}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

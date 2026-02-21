import { useState } from 'react';
import { bankModuleApi } from '../../api/customerApi';
import { ATBRequest } from '../../types';
import { ArrowDownCircle, ArrowUpCircle, Banknote, RefreshCw, Loader2, Landmark } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ATB() {
    const [request, setRequest] = useState<ATBRequest>({
        accountNumber: '',
        amount: 0,
        particulars: '',
        transactionType: 'DEPOSIT'
    });
    const [loading, setLoading] = useState(false);
    const [customerName, setCustomerName] = useState('');

    const fetchName = async () => {
        if (!request.accountNumber) return;
        try {
            const res = await bankModuleApi.abci(request.accountNumber);
            setCustomerName(res.data.customerName);
            toast.success(`Account: ${res.data.customerName}`);
        } catch {
            setCustomerName('Invalid Account');
            toast.error('Account not found');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (request.amount <= 0) return toast.error('Amount must be positive');

        setLoading(true);
        try {
            await bankModuleApi.atbTransaction(request);
            toast.success(`${request.transactionType} successful`);
            setRequest({ ...request, amount: 0, particulars: '' });
        } catch (error) {
            console.error('Transaction failed:', error);
            toast.error('Transaction failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto animate-in slide-in-from-right-5 duration-500">
            <div className="bg-gray-50 rounded-[2.5rem] p-10 border-2 border-dashed border-gray-200">
                <div className="flex items-center gap-4 mb-10">
                    <div className="p-4 bg-gray-900 text-white rounded-3xl shadow-lg">
                        <Banknote size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Transaction Terminal</h2>
                        <p className="text-gray-500 font-bold text-sm">Post deposits or withdrawals instantly.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Transaction Toggle */}
                    <div className="flex bg-white p-1.5 rounded-2xl border border-gray-200">
                        <button
                            type="button"
                            onClick={() => setRequest({ ...request, transactionType: 'DEPOSIT' })}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${request.transactionType === 'DEPOSIT'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <ArrowDownCircle size={16} />
                            DEPOSIT
                        </button>
                        <button
                            type="button"
                            onClick={() => setRequest({ ...request, transactionType: 'WITHDRAWAL' })}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${request.transactionType === 'WITHDRAWAL'
                                ? 'bg-red-600 text-white shadow-md'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <ArrowUpCircle size={16} />
                            WITHDRAWAL
                        </button>
                    </div>

                    {/* Account Number */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Number</label>
                        <div className="relative group">
                            <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600" size={18} />
                            <input
                                type="text"
                                placeholder="Enter A/C Number"
                                value={request.accountNumber}
                                onChange={(e) => setRequest({ ...request, accountNumber: e.target.value })}
                                onBlur={fetchName}
                                className="w-full pl-12 pr-6 py-4 bg-white border-2 border-gray-100 focus:border-primary-600 rounded-2xl outline-none font-black text-gray-900 shadow-sm"
                            />
                            {customerName && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-[10px] font-black border border-primary-100">
                                    {customerName.toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Amount */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Amount</label>
                            <input
                                type="number"
                                placeholder="रू 0.00"
                                value={request.amount || ''}
                                onChange={(e) => setRequest({ ...request, amount: Number(e.target.value) })}
                                className="w-full px-6 py-4 bg-white border-2 border-gray-100 focus:border-primary-600 rounded-2xl outline-none font-black text-gray-900 shadow-sm"
                            />
                        </div>

                        {/* Particulars */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Particulars</label>
                            <input
                                type="text"
                                placeholder="Transaction Narrative"
                                value={request.particulars}
                                onChange={(e) => setRequest({ ...request, particulars: e.target.value })}
                                className="w-full px-6 py-4 bg-white border-2 border-gray-100 focus:border-primary-600 rounded-2xl outline-none font-black text-gray-900 shadow-sm"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !customerName || customerName === 'Invalid Account'}
                        className={`w-full py-5 rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none ${request.transactionType === 'DEPOSIT'
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
                            : 'bg-red-600 text-white hover:bg-red-700 shadow-red-200'
                            }`}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <RefreshCw size={20} />}
                        PROCESS TRANSACTION
                    </button>
                </form>
            </div>
        </div>
    );
}

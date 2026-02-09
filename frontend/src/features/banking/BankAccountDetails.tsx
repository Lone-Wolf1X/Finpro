import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bankAccountApi } from '../../api/customerApi';
import { BankAccount } from '../../types';
import {
    ArrowLeft,
    Wallet,
    ArrowDownLeft,
    ArrowUpRight,
    History,
    FileText,
    Loader2,
    CheckCircle2,
    Download
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function BankAccountDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [account, setAccount] = useState<BankAccount | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw' | 'statement'>('overview');

    // Transaction Form State
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Statement State
    const [statement, setStatement] = useState<any>(null); // Replace any with proper type
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
            const response = await bankAccountApi.getById(Number(id));
            setAccount(response.data);
        } catch (error) {
            console.error('Failed to load account:', error);
            toast.error('Failed to load account details');
        } finally {
            setLoading(false);
        }
    };

    const loadStatement = async () => {
        try {
            setLoadingStatement(true);
            const response = await bankAccountApi.getStatement(Number(id), startDate, endDate);
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
            if (type === 'deposit') {
                await bankAccountApi.deposit(Number(id), { amount: Number(amount), description });
                toast.success('Deposit initiated successfully');
            } else {
                await bankAccountApi.withdraw(Number(id), { amount: Number(amount), description });
                toast.success('Withdrawal initiated successfully');
            }
            setAmount('');
            setDescription('');
            loadAccount(); // Refresh balance
            setActiveTab('overview');
        } catch (error) {
            console.error('Transaction failed:', error);
            toast.error('Transaction failed');
        } finally {
            setSubmitting(false);
        }
    };

    const downloadPDF = () => {
        if (!statement || !account) return;

        const doc = new jsPDF();

        // Add Header
        doc.setFontSize(20);
        doc.text('Bank Statement', 14, 22);

        doc.setFontSize(10);
        doc.text(`Account Name: ${account.customerName}`, 14, 32);
        doc.text(`Account Number: ${account.accountNumber}`, 14, 38);
        doc.text(`Bank: ${account.bankName}`, 14, 44);
        doc.text(`Statement Period: ${startDate} to ${endDate}`, 14, 50);
        doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 56);

        const tableColumn = ["Date", "Description", "Ref No", "Debit", "Credit", "Balance"];
        const tableRows: any[] = [];

        statement.transactions.forEach((tx: any) => {
            const isCredit = ['DEPOSIT', 'ALLOTMENT', 'REVERSAL', 'SETTLEMENT'].includes(tx.type);
            const isDebit = ['WITHDRAWAL', 'FEE', 'TRANSFER'].includes(tx.type);

            const debitAmount = isDebit ? tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '';
            const creditAmount = isCredit ? tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '';
            const balance = tx.balanceAfter.toLocaleString(undefined, { minimumFractionDigits: 2 });

            const rowData = [
                new Date(tx.date).toLocaleDateString(),
                tx.description,
                tx.referenceId || '-',
                debitAmount,
                creditAmount,
                balance
            ];
            tableRows.push(rowData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 65,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [22, 163, 74] }, // Green header
            columnStyles: {
                3: { halign: 'right', textColor: [220, 38, 38] }, // Debit Red
                4: { halign: 'right', textColor: [22, 163, 74] }, // Credit Green
                5: { halign: 'right', fontStyle: 'bold' } // Balance Bold
            }
        });

        doc.save(`Statement_${account.accountNumber}_${startDate}_${endDate}.pdf`);
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
            <button onClick={() => navigate('/banking/operations')} className="mt-4 text-blue-600 font-medium hover:underline">
                Back to Operations
            </button>
        </div>
    );

    const availableBalance = (account.balance || 0) - (account.heldBalance || 0);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header & Navigation */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/banking/operations')}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">{account.customerName}</h1>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                        <span className="bg-gray-100 px-2 py-0.5 rounded textxs font-mono">{account.accountNumber}</span>
                        <span>•</span>
                        <span>{account.bankName}</span>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet size={80} className="text-blue-600" />
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Actual Balance</p>
                    <p className="text-4xl font-black text-gray-900 mt-2 tracking-tighter">
                        रू {account.balance?.toLocaleString()}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ArrowUpRight size={80} className="text-orange-600" />
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Held Amount</p>
                    <p className="text-4xl font-black text-orange-600 mt-2 tracking-tighter">
                        रू {account.heldBalance?.toLocaleString() || '0'}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CheckCircle2 size={80} className="text-green-600" />
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Available</p>
                    <p className="text-4xl font-black text-green-600 mt-2 tracking-tighter">
                        रू {availableBalance.toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                <div className="border-b border-gray-100 p-2 flex gap-2 overflow-x-auto">
                    {[
                        { id: 'overview', label: 'Overview', icon: FileText },
                        { id: 'deposit', label: 'Deposit', icon: ArrowDownLeft },
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
                                <Wallet className="text-gray-300 w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Account Overview</h3>
                            <p className="text-gray-500 max-w-md mx-auto">
                                Use the tabs above to perform operations like deposits, withdrawals, or view detailed statements.
                            </p>
                        </div>
                    )}

                    {(activeTab === 'deposit' || activeTab === 'withdraw') && (
                        <div className="max-w-xl mx-auto space-y-6">
                            <div className="text-center space-y-2 mb-8">
                                <h3 className="text-2xl font-black text-gray-900">
                                    {activeTab === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}
                                </h3>
                                <p className="text-gray-500 font-medium">
                                    {activeTab === 'deposit'
                                        ? 'Add funds to this customer account'
                                        : 'Withdraw funds from this customer account'}
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
                                            ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-500/30'
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
                                        activeTab === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdrawal'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'statement' && (
                        <div className="space-y-6">
                            {/* Date Filter & Actions */}
                            <div className="flex flex-wrap gap-4 items-end bg-gray-50 p-4 rounded-2xl justify-between">
                                <div className="flex gap-4 items-end flex-wrap">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="px-3 py-2 rounded-xl border-gray-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">End Date</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="px-3 py-2 rounded-xl border-gray-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <button
                                        onClick={loadStatement}
                                        className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg active:scale-95"
                                    >
                                        Refresh Statement
                                    </button>
                                </div>

                                <button
                                    onClick={downloadPDF}
                                    disabled={!statement?.transactions?.length}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Download size={16} />
                                    Download PDF
                                </button>
                            </div>

                            {/* Statement Table */}
                            {loadingStatement ? (
                                <div className="text-center py-20">
                                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Fetching transactions...</p>
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm bg-white">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-gray-50/80 border-b border-gray-200 backdrop-blur-sm sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest w-32">Date</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest w-64">Description</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center w-32">Ref No</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right w-32">Debit</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right w-32">Credit</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right w-32">Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {statement?.transactions?.length > 0 ? (
                                                    statement.transactions.map((tx: any) => {
                                                        const isCredit = ['DEPOSIT', 'ALLOTMENT', 'REVERSAL', 'SETTLEMENT'].includes(tx.type);
                                                        const isDebit = ['WITHDRAWAL', 'FEE', 'TRANSFER'].includes(tx.type);

                                                        return (
                                                            <tr key={tx.id} className="hover:bg-blue-50/30 transition-colors group">
                                                                <td className="px-6 py-4">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-bold text-gray-700 font-mono">
                                                                            {new Date(tx.date).toLocaleDateString()}
                                                                        </span>
                                                                        <span className="text-[10px] text-gray-400 font-mono">
                                                                            {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <p className="text-xs font-bold text-gray-800 line-clamp-2" title={tx.description}>
                                                                        {tx.description}
                                                                    </p>
                                                                    <span className={`inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider
                                                                        ${tx.status === 'COMPLETED' || tx.status === 'APPROVED' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-yellow-50 text-yellow-600 border-yellow-100'}
                                                                    `}>
                                                                        {tx.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-center">
                                                                    <span className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                                                        {tx.referenceId ? `#${tx.referenceId}` : '-'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    {isDebit && (
                                                                        <span className="font-mono text-sm font-bold text-red-600">
                                                                            {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    {isCredit && (
                                                                        <span className="font-mono text-sm font-bold text-green-600">
                                                                            {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4 text-right bg-gray-50/30">
                                                                    <span className="font-mono text-sm font-black text-gray-800">
                                                                        {tx.balanceAfter.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan={6} className="px-6 py-20 text-center">
                                                            <div className="flex flex-col items-center justify-center gap-3">
                                                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                                                    <History className="text-gray-300" size={24} />
                                                                </div>
                                                                <p className="text-gray-500 font-medium">No transactions found for this period</p>
                                                                <button
                                                                    onClick={() => {
                                                                        setStartDate(new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0]);
                                                                        setEndDate(new Date().toISOString().split('T')[0]);
                                                                    }}
                                                                    className="text-blue-600 text-xs font-bold hover:underline"
                                                                >
                                                                    View last 3 months
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

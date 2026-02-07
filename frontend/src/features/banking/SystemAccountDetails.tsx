import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { systemAccountApi, bankAccountApi } from '../../api/customerApi';
import {
    ChevronLeft,
    Calendar,
    Building2,
    History
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Table from '../../components/common/Table';

export default function SystemAccountDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [account, setAccount] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [statement, setStatement] = useState<any[]>([]);

    // Date Range State
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id, startDate, endDate]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [accRes, stmtRes] = await Promise.all([
                systemAccountApi.getById(Number(id)),
                bankAccountApi.getSystemAccountStatement(Number(id), startDate, endDate)
            ]);
            setAccount(accRes.data);
            setStatement(stmtRes.data.transactions || []);
        } catch (error) {
            console.error('Failed to load system account details:', error);
            toast.error('Failed to load account details');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !account) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Loading System Account...</p>
            </div>
        );
    }

    if (!account) return <div>Account not found</div>;

    const columns = [
        {
            header: 'Date',
            accessor: (t: any) => new Date(t.date).toLocaleDateString()
        },
        {
            header: 'Description',
            accessor: 'description'
        },
        {
            header: 'Reference',
            accessor: (t: any) => <span className="font-mono text-xs">{t.referenceId || '-'}</span>
        },
        {
            header: 'Type',
            accessor: (t: any) => (
                <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${t.type === 'DEPOSIT' || t.amount > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {t.type}
                </span>
            )
        },
        {
            header: 'Amount',
            accessor: (t: any) => (
                <div className={`font-mono font-bold ${t.type === 'DEPOSIT' || t.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {t.type === 'DEPOSIT' || t.amount > 0 ? '+' : '-'}
                    रू {Math.abs(t.amount).toLocaleString()}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <button
                    onClick={() => navigate('/banking/operations')}
                    className="flex items-center text-gray-500 hover:text-gray-900 transition-colors mb-4 text-xs font-bold uppercase tracking-widest"
                >
                    <ChevronLeft size={16} className="mr-1" />
                    Back to Operations
                </button>

                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden p-8">
                    <div className="flex flex-col md:flex-row justify-between gap-8">
                        <div className="flex items-start gap-6">
                            <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl">
                                <Building2 size={32} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">{account.accountName}</h1>
                                <p className="text-sm font-medium text-gray-500 mt-1">{account.accountCode}</p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-black uppercase tracking-widest">
                                        System Account
                                    </span>
                                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg font-mono text-xs font-bold tracking-widest">
                                        {account.accountNumber}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Current Balance</p>
                            <div className="text-4xl font-black font-mono text-gray-900 tracking-tighter">
                                रू {account.balance?.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statement Section */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden p-8 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            <History size={24} className="text-gray-400" />
                            Ledger History
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">View account transactions and statement</p>
                    </div>

                    <div className="flex gap-4 items-end">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Start Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500/20 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">End Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500/20 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <Table
                    data={statement}
                    columns={columns}
                    keyField="id"
                    isLoading={loading}
                    pagination={{
                        currentPage: 1,
                        totalPages: 1,
                        onPageChange: () => { },
                        totalItems: statement.length,
                        itemsPerPage: statement.length
                    }}
                />
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bankAccountApi, systemAccountApi } from '../../api/customerApi';
import { BankAccount } from '../../types';
import Table from '../../components/common/Table';
import {
    Search,
    Building2,
    History,
    ArrowRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';

type TabType = 'CUSTOMER' | 'OFFICE';

export default function BankOperations() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('CUSTOMER');
    const [customerAccounts, setCustomerAccounts] = useState<BankAccount[]>([]);
    const [officeAccounts, setOfficeAccounts] = useState<any[]>([]); // SystemAccount type
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [customerRes, officeRes] = await Promise.all([
                bankAccountApi.getAll(),
                systemAccountApi.getAll()
            ]);
            setCustomerAccounts(customerRes.data);
            setOfficeAccounts(officeRes.data);
        } catch (error) {
            console.error('Failed to load accounts:', error);
            toast.error('Failed to load accounts');
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const getFilteredData = () => {
        const data = activeTab === 'CUSTOMER' ? customerAccounts : officeAccounts;
        const term = searchTerm.toLowerCase();

        return data.filter(item => {
            if (activeTab === 'CUSTOMER') {
                const acc = item as BankAccount;
                return (
                    acc.accountNumber.toLowerCase().includes(term) ||
                    acc.customerName.toLowerCase().includes(term) ||
                    acc.bankName.toLowerCase().includes(term)
                );
            } else {
                const acc = item as any; // SystemAccount
                return (
                    acc.accountNumber.toLowerCase().includes(term) ||
                    acc.accountName.toLowerCase().includes(term) ||
                    acc.accountCode.toLowerCase().includes(term)
                );
            }
        });
    };

    const filteredData = getFilteredData();
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Columns Configuration
    const customerColumns = [
        {
            header: 'Customer',
            accessor: (acc: BankAccount) => (
                <div>
                    <div className="font-bold text-gray-900">{acc.customerName}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">ID: {acc.customerId}</div>
                </div>
            )
        },
        {
            header: 'Account Details',
            accessor: (acc: BankAccount) => (
                <div>
                    <div className="font-mono font-medium text-gray-700">{acc.accountNumber}</div>
                    <div className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">{acc.bankName}</div>
                </div>
            )
        },
        {
            header: 'Type',
            accessor: (acc: BankAccount) => (
                <span className="px-2 py-1 bg-gray-100 rounded-md text-[10px] font-black text-gray-600 uppercase tracking-widest">
                    {acc.accountType}
                </span>
            )
        },
        {
            header: 'Balance',
            accessor: (acc: BankAccount) => (
                <div className="font-mono font-bold text-gray-900">
                    रू {(acc.balance || 0).toLocaleString()}
                </div>
            )
        },
        {
            header: 'Status',
            accessor: (acc: BankAccount) => (
                <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${acc.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {acc.status}
                </span>
            )
        },
        {
            header: 'Actions',
            accessor: (acc: BankAccount) => (
                <div className="flex gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/banking/accounts/${acc.id}`);
                        }}
                        className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        title="View Statement"
                    >
                        <History size={16} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/banking/accounts/${acc.id}`);
                        }}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Transact"
                    >
                        <ArrowRight size={16} />
                    </button>
                </div>
            )
        }
    ];

    const officeColumns = [
        {
            header: 'Account Name',
            accessor: (acc: any) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                        <Building2 size={16} />
                    </div>
                    <div>
                        <div className="font-bold text-gray-900">{acc.accountName}</div>
                        <div className="text-[10px] text-purple-500 font-bold uppercase tracking-wider">{acc.accountCode}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Account Number',
            accessor: (acc: any) => (
                <span className="font-mono font-medium text-gray-700">{acc.accountNumber}</span>
            )
        },
        {
            header: 'Balance',
            accessor: (acc: any) => (
                <div className="font-mono font-bold text-gray-900">
                    रू {(acc.balance || 0).toLocaleString()}
                </div>
            )
        },
        {
            header: 'Owner',
            accessor: (acc: any) => acc.ownerId ? `Investor ID: ${acc.ownerId}` : 'SYSTEM'
        },
        {
            header: 'Actions',
            accessor: (acc: any) => (
                <div className="flex gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            // Navigate to System Account Details (Banking view)
                            navigate(`/banking/system-accounts/${acc.id}`);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-xs font-bold uppercase tracking-wide"
                    >
                        <History size={14} />
                        View Ledger
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate('/capital-deposits/create');
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-xs font-bold uppercase tracking-wide"
                    >
                        <ArrowRight size={14} />
                        Deposit
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Banking Operations</h1>
                    <p className="text-gray-500 font-medium mt-1">Manage accounts and transactions</p>
                </div>

                {/* Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => { setActiveTab('CUSTOMER'); setCurrentPage(1); }}
                        className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'CUSTOMER'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Customer Accounts
                    </button>
                    <button
                        onClick={() => { setActiveTab('OFFICE'); setCurrentPage(1); }}
                        className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'OFFICE'
                            ? 'bg-white text-purple-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Office Accounts
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder={`Search ${activeTab === 'CUSTOMER' ? 'customers' : 'office accounts'}...`}
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-gray-700"
                />
            </div>

            {/* Table */}
            <Table
                data={paginatedData}
                columns={activeTab === 'CUSTOMER' ? customerColumns : officeColumns}
                keyField="id"
                isLoading={loading}
                pagination={{
                    currentPage,
                    totalPages,
                    totalItems,
                    itemsPerPage,
                    onPageChange: setCurrentPage
                }}
                onRowClick={(item) => {
                    if (activeTab === 'CUSTOMER') {
                        navigate(`/banking/accounts/${item.id}`);
                    } else {
                        navigate(`/banking/system-accounts/${item.id}`);
                    }
                }}
            />
        </div>
    );
}

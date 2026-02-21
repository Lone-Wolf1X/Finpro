
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerApi, bankAccountApi, ipoApplicationApi, ipoApi, portfolioApi } from '../../api/customerApi';
import { Customer, BankAccount, IPOApplication, KycStatus, IPO, CustomerPortfolio, PortfolioTransaction } from '../../types';
import { User, CreditCard, PieChart, ArrowLeft, Edit, FileSignature, History, Wallet, Plus, TrendingUp, Trash2, FileText, XCircle, Briefcase, List } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import toast from 'react-hot-toast';
import CredentialsTab from './CredentialsTab';
import AddBankAccountModal from './AddBankAccountModal';
import EditableDetailsTab from './EditableDetailsTab';
import TradingTab from './TradingTab';


export default function CustomerProfile() {
    const { user } = useAppSelector((state) => state.auth);
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [ipoApplications, setIpoApplications] = useState<IPOApplication[]>([]);
    const [activeIpos, setActiveIpos] = useState<IPO[]>([]);
    const [portfolio, setPortfolio] = useState<CustomerPortfolio[]>([]);
    const [portfolioTransactions, setPortfolioTransactions] = useState<PortfolioTransaction[]>([]);
    const [activeTab, setActiveTab] = useState<'details' | 'bank' | 'credentials' | 'ipo'>('details');
    const [ipoChildTab, setIpoChildTab] = useState<'portfolio' | 'applications' | 'open_ipos' | 'trading' | 'transactions'>('applications');

    const [showAddBankModal, setShowAddBankModal] = useState(false);
    const [selectedAppReport, setSelectedAppReport] = useState<IPOApplication | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedCustomer, setEditedCustomer] = useState<Customer | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [uploadingSignature, setUploadingSignature] = useState(false);
    const [uploadingGuardianPhoto, setUploadingGuardianPhoto] = useState(false);
    const [uploadingGuardianSignature, setUploadingGuardianSignature] = useState(false);

    useEffect(() => {
        if (id) {
            loadData(parseInt(id));
        }
    }, [id]);

    const loadData = async (customerId: number) => {
        try {
            setLoading(true);
            const [custRes, bankRes] = await Promise.all([
                customerApi.getById(customerId),
                bankAccountApi.getByCustomerId(customerId)
            ]);
            setCustomer(custRes.data);
            setBankAccounts(bankRes.data);

            try {
                const ipoRes = await ipoApplicationApi.getByCustomerId(customerId);
                setIpoApplications(ipoRes.data);
            } catch (error) {
                console.error('Failed to load IPO applications:', error);
                setIpoApplications([]);
            }

            try {
                const activeIpoRes = await ipoApi.getActive();
                setActiveIpos(activeIpoRes.data);
            } catch (error) {
                console.error('Failed to load active IPOs:', error);
                setActiveIpos([]);
            }

            try {
                const portfolioRes = await portfolioApi.getByCustomerId(customerId);
                setPortfolio(portfolioRes.data);
            } catch (error) {
                console.error('Failed to load portfolio:', error);
                setPortfolio([]);
            }

            try {
                const txRes = await portfolioApi.getTransactionsByCustomerId(customerId);
                setPortfolioTransactions(txRes.data);
            } catch (error) {
                console.error('Failed to load portfolio transactions:', error);
                setPortfolioTransactions([]);
            }
        } catch (error) {
            console.error('Failed to load profile data:', error);
        } finally {
            setLoading(false);
        }
    };


    const getStatusBadge = (status: KycStatus) => {
        const colors = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            APPROVED: 'bg-green-100 text-green-800',
            REJECTED: 'bg-red-100 text-red-800',
            RETURNED: 'bg-orange-100 text-orange-800',
            DRAFT: 'bg-gray-100 text-gray-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const handleEditToggle = () => {
        if (!isEditing) {
            setEditedCustomer(customer);
        }
        setIsEditing(!isEditing);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedCustomer(null);
    };

    const handleSaveEdit = async () => {
        if (!editedCustomer) return;
        try {
            // Use fetch directly for PUT request with Customer type
            const response = await fetch(`http://127.0.0.1:8080/api/customers/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(editedCustomer),
            });

            if (!response.ok) throw new Error('Update failed');

            const updated = await response.json();
            setCustomer(updated);
            setIsEditing(false);
            setEditedCustomer(null);
        } catch (error) {
            console.error('Failed to update customer:', error);
            alert('Failed to update customer details');
        }
    };

    const handleFileUpload = async (file: File, type: 'photo' | 'signature' | 'guardian-photo' | 'guardian-signature') => {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Only image files are allowed');
            return;
        }

        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('File size must not exceed 2MB');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const endpoint = type === 'photo' ? 'upload-photo' :
                type === 'signature' ? 'upload-signature' :
                    type === 'guardian-photo' ? 'upload-guardian-photo' :
                        'upload-guardian-signature';

            const setUploading = type === 'photo' ? setUploadingPhoto :
                type === 'signature' ? setUploadingSignature :
                    type === 'guardian-photo' ? setUploadingGuardianPhoto :
                        setUploadingGuardianSignature;

            setUploading(true);

            const response = await fetch(`http://127.0.0.1:8080/api/customers/${id}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            const pathKey = type === 'photo' ? 'photoPath' :
                type === 'signature' ? 'signaturePath' :
                    type === 'guardian-photo' ? 'guardianPhotoPath' :
                        'guardianSignaturePath';

            // Update customer state
            if (customer) {
                const updated = { ...customer, [pathKey]: data[pathKey] };
                setCustomer(updated);
                if (editedCustomer) {
                    setEditedCustomer(updated);
                }
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload file');
        } finally {
            const setUploading = type === 'photo' ? setUploadingPhoto :
                type === 'signature' ? setUploadingSignature :
                    type === 'guardian-photo' ? setUploadingGuardianPhoto :
                        setUploadingGuardianSignature;
            setUploading(false);
        }
    };

    const handleFieldChange = (field: keyof Customer, value: any) => {
        if (editedCustomer) {
            setEditedCustomer({ ...editedCustomer, [field]: value });
        }
    };

    if (loading) return <div className="p-8 text-center text-blue-600 animate-pulse font-bold">Initializing Profile Engine...</div>;
    if (!customer) return <div className="p-8 text-center text-red-500">Customer not found</div>;

    return (
        <div className="p-6 w-full space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6">
                <button onClick={() => navigate('/customers')} className="p-3 hover:bg-gray-100 rounded-xl transition-all border border-gray-100">
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 overflow-hidden">
                    {customer.photoPath ? (
                        <img src={`/uploads/${customer.photoPath}`} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                        <User size={32} />
                    )}
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-4">
                        {customer.fullName}
                        <span className={`text-xs uppercase tracking-widest px-3 py-1 rounded-full font-bold ${getStatusBadge(customer.kycStatus)}`}>
                            {customer.kycStatus}
                        </span>
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1 font-medium">
                        <span className="bg-gray-100 px-2 py-0.5 rounded">CID: {customer.customerCode || 'N/A'}</span>
                        <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">DB ID: #{customer.id}</span>
                        <span>{customer.email}</span>
                    </div>
                </div>
                <div className="ml-auto flex gap-3">
                    <button
                        onClick={() => navigate(`/customers/${customer.id}/edit`)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-md ${customer.kycStatus === 'DRAFT' || customer.kycStatus === 'RETURNED' || customer.kycStatus === 'REJECTED'
                            ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-100'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
                            }`}
                    >
                        <Edit size={18} />
                        {customer.kycStatus === 'DRAFT' || customer.kycStatus === 'RETURNED' || customer.kycStatus === 'REJECTED'
                            ? 'Submit for Verification'
                            : 'Edit Profile'}
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 w-fit">
                {[
                    { id: 'details', label: 'General Details', icon: User },
                    { id: 'bank', label: 'Bank & Ledger', icon: CreditCard },
                    { id: 'credentials', label: 'Credentials', icon: FileSignature },
                    { id: 'ipo', label: 'IPO & Portfolio', icon: PieChart },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-3 px-8 py-3 rounded-xl transition-all font-bold ${activeTab === tab.id
                            ? 'bg-blue-50 text-blue-600 shadow-inner'
                            : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>


            {/* Content Area */}
            <div className="space-y-6">
                {activeTab === 'details' && (
                    <EditableDetailsTab
                        customer={customer}
                        bankAccounts={bankAccounts}
                        isEditing={isEditing}
                        editedCustomer={editedCustomer}
                        onEdit={handleEditToggle}
                        onSave={handleSaveEdit}
                        onCancel={handleCancelEdit}
                        onChange={handleFieldChange}
                        onFileUpload={handleFileUpload}
                        onSetPrimaryAccount={async (accountId) => {
                            try {
                                await bankAccountApi.setPrimary(accountId);
                                toast.success('Primary settlement account updated');
                                loadData(parseInt(id!));
                            } catch (error) {
                                console.error('Failed to set primary account:', error);
                                toast.error('Failed to update primary account');
                            }
                        }}
                        uploadingPhoto={uploadingPhoto}
                        uploadingSignature={uploadingSignature}
                        uploadingGuardianPhoto={uploadingGuardianPhoto}
                        uploadingGuardianSignature={uploadingGuardianSignature}
                    />
                )}

                {activeTab === 'bank' && (

                    <div className="space-y-4">
                        {/* Header with Add Button */}
                        <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Bank Accounts</h3>
                                <p className="text-sm text-gray-500 mt-1">Manage customer bank accounts and transactions</p>
                            </div>
                            <button
                                onClick={() => setShowAddBankModal(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md"
                            >
                                <Plus size={18} />
                                Add Bank Account
                            </button>
                        </div>

                        {/* Bank Accounts Table */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <th className="px-8 py-4">Bank Name & Branch</th>
                                        <th className="px-8 py-4">Account Details</th>
                                        <th className="px-8 py-4 text-center">Type</th>
                                        <th className="px-8 py-4 text-center">Balance</th>
                                        <th className="px-8 py-4 text-center">Status</th>
                                        <th className="px-8 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {bankAccounts.map(bank => (
                                        <tr key={bank.id} className="hover:bg-gray-50/50 transition-all group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                        <CreditCard size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="font-extrabold text-gray-800 text-sm leading-tight">{bank.bankName}</p>
                                                        <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-tighter">{bank.branchName}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="font-mono text-sm text-gray-700 font-bold tracking-widest">{bank.accountNumber}</p>
                                                {bank.isPrimary && <span className="text-[10px] text-blue-600 font-black uppercase tracking-tighter">Primary Account</span>}
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className="text-xs font-bold text-gray-600 uppercase">{bank.accountType.replace('_', ' ')}</span>
                                            </td>
                                            <td className="px-8 py-5 text-center font-mono font-bold text-blue-700">
                                                रू {bank.balance?.toLocaleString() || '0.00'}
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest ${bank.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'}`}>
                                                    {bank.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => navigate(`/banking/accounts/${bank.id}`)}
                                                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-all"
                                                        title="Statement"
                                                    >
                                                        <History size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/banking/accounts/${bank.id}`)}
                                                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-sm"
                                                    >
                                                        Deposit
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/banking/accounts/${bank.id}`)}
                                                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all shadow-sm"
                                                    >
                                                        Withdraw
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {bankAccounts.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-12 text-center text-gray-400 font-bold italic">No bank accounts linked to this profile.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
                }

                {/* Credentials Tab */}
                {
                    activeTab === 'credentials' && (
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                            <CredentialsTab customerId={parseInt(id!)} />
                        </div>
                    )
                }

                {/* IPO Tab */}
                {
                    activeTab === 'ipo' && (
                        <div className="space-y-6">
                            <div className="flex bg-gray-100 p-1 rounded-xl w-fit font-bold">
                                {[
                                    { id: 'open_ipos', label: 'Open IPOs', icon: TrendingUp },
                                    { id: 'applications', label: 'Applications & ASBA', icon: History },
                                    { id: 'portfolio', label: 'My Portfolio', icon: Wallet },
                                    { id: 'trading', label: 'Trade Shares', icon: Briefcase },
                                    { id: 'transactions', label: 'Transactions', icon: List },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setIpoChildTab(tab.id as any)}
                                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs transition-all ${ipoChildTab === tab.id
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        <tab.icon size={14} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Portfolio Transactions Section */}
                            {ipoChildTab === 'transactions' && (
                                <div className="space-y-4">
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50 border-b border-gray-100">
                                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                    <th className="px-6 py-4">Date</th>
                                                    <th className="px-6 py-4">Symbol</th>
                                                    <th className="px-6 py-4 text-center">Type</th>
                                                    <th className="px-6 py-4 text-center">Quantity</th>
                                                    <th className="px-6 py-4 text-center">Price</th>
                                                    <th className="px-6 py-4 text-center">Fees</th>
                                                    <th className="px-6 py-4 text-right">Net Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {portfolioTransactions.map((tx) => (
                                                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-all font-medium text-xs">
                                                        <td className="px-6 py-4 text-gray-500">
                                                            {new Date(tx.transactionDate).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 font-bold text-gray-800">{tx.scripSymbol}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${tx.transactionType === 'BUY' ? 'bg-green-50 text-green-700' :
                                                                tx.transactionType === 'SELL' ? 'bg-red-50 text-red-700' :
                                                                    tx.transactionType === 'ALLOTMENT' ? 'bg-blue-50 text-blue-700' :
                                                                        'bg-purple-50 text-purple-700'
                                                                }`}>
                                                                {tx.transactionType}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center font-mono font-bold">{tx.quantity}</td>
                                                        <td className="px-6 py-4 text-center">रू {tx.pricePerShare.toLocaleString()}</td>
                                                        <td className="px-6 py-4 text-center font-mono text-gray-500">रू {tx.transactionFee?.toLocaleString() || '0'}</td>
                                                        <td className="px-6 py-4 text-right font-mono font-bold text-blue-600">
                                                            रू {(tx.transactionType === 'BUY' ? (tx.totalAmount + (tx.transactionFee || 0)) : (tx.totalAmount - (tx.transactionFee || 0))).toLocaleString()}
                                                        </td>
                                                    </tr>

                                                ))}
                                                {portfolioTransactions.length === 0 && (
                                                    <tr>
                                                        <td colSpan={7} className="px-6 py-10 text-center text-gray-400 italic">No transactions found.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Trading Section */}
                            {ipoChildTab === 'trading' && (
                                <div className="space-y-4">
                                    <TradingTab customerId={parseInt(id!)} />
                                </div>
                            )}

                            {/* Open IPOs Section */}

                            {ipoChildTab === 'open_ipos' && (
                                <div className="space-y-4">
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50 border-b border-gray-100">
                                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                    <th className="px-6 py-4">Company</th>
                                                    <th className="px-6 py-4 text-center">Price</th>
                                                    <th className="px-6 py-4 text-center">Min / Max</th>
                                                    <th className="px-6 py-4 text-center">Closing Date</th>
                                                    <th className="px-6 py-4 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {activeIpos.map(ipo => (
                                                    <tr key={ipo.id} className="hover:bg-gray-50/50 transition-all">
                                                        <td className="px-6 py-4">
                                                            <div>
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide mb-1 inline-block ${ipo.status === 'OPEN' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-600'}`}>
                                                                    {ipo.status}
                                                                </span>
                                                                <h4 className="font-bold text-gray-900">{ipo.companyName}</h4>
                                                                <p className="text-xs text-gray-500 font-medium">{ipo.symbol}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <p className="font-mono font-bold text-gray-700">रू {ipo.pricePerShare}</p>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <p className="text-xs font-bold text-gray-600">
                                                                {ipo.minQuantity} - {ipo.maxQuantity.toLocaleString()}
                                                            </p>
                                                            <p className="text-[10px] text-gray-400 uppercase">Units</p>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <p className="text-xs font-bold text-red-500">
                                                                {new Date(ipo.closeDate).toLocaleDateString()}
                                                            </p>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            {(() => {
                                                                const app = ipoApplications.find(a => a.ipoId === ipo.id);
                                                                if (!app) {
                                                                    return (
                                                                        <button
                                                                            onClick={() => navigate(`/ipo-applications/new?customerId=${id}&ipoId=${ipo.id}`)}
                                                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-blue-100 shadow-md flex items-center justify-center gap-2"
                                                                        >
                                                                            <Plus size={14} />
                                                                            Apply
                                                                        </button>
                                                                    );
                                                                }

                                                                if (['PENDING_VERIFICATION', 'REJECTED'].includes(app.applicationStatus)) {
                                                                    return (
                                                                        <button
                                                                            onClick={() => navigate(`/ipo-applications/${app.id}/edit`)}
                                                                            className="px-4 py-2 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 transition-all shadow-orange-100 shadow-md flex items-center justify-center gap-2"
                                                                        >
                                                                            <Edit size={14} />
                                                                            Edit
                                                                        </button>
                                                                    );
                                                                }

                                                                return (
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedAppReport(app);
                                                                        }}
                                                                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-all shadow-green-100 shadow-md flex items-center justify-center gap-2"
                                                                    >
                                                                        <FileText size={14} />
                                                                        Report
                                                                    </button>
                                                                );
                                                            })()}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {activeIpos.length === 0 && (
                                                    <tr>
                                                        <td colSpan={5} className="px-8 py-12 text-center text-gray-500 font-medium italic">
                                                            No active IPOs available at the moment.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    {activeIpos.length === 0 && (
                                        <p className="text-center text-gray-500 font-medium py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                                            No active IPOs available at the moment.
                                        </p>
                                    )}
                                </div>
                            )}

                            {ipoChildTab === 'applications' && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 border-b border-gray-100">
                                            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                <th className="px-8 py-4">Company Details</th>
                                                <th className="px-8 py-4 text-center">Applied Qty</th>
                                                <th className="px-8 py-4 text-center">Amount</th>
                                                <th className="px-8 py-4 text-center">Status</th>
                                                <th className="px-8 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {ipoApplications.map(app => (
                                                <tr key={app.id} className="hover:bg-gray-50/50 transition-all group">
                                                    <td className="px-8 py-5">
                                                        <p className="font-extrabold text-gray-800 text-sm leading-tight">{app.ipoCompanyName}</p>
                                                        <p className="text-[10px] font-bold text-blue-500 mt-1 tracking-widest">{new Date(app.appliedAt).toLocaleDateString()} | {app.applicationNumber}</p>
                                                    </td>
                                                    <td className="px-8 py-5 text-center font-mono font-bold text-gray-600">{app.quantity}</td>
                                                    <td className="px-8 py-5 text-center font-mono font-bold text-gray-700">रू {app.amount.toLocaleString()}</td>
                                                    <td className="px-8 py-5 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest ${app.allotmentStatus === 'ALLOTTED' ? 'bg-green-100 text-green-700' :
                                                            app.allotmentStatus === 'NOT_ALLOTTED' ? 'bg-red-100 text-red-700' :
                                                                app.applicationStatus === 'APPROVED' ? 'bg-green-50 text-emerald-600' :
                                                                    app.applicationStatus === 'REJECTED' ? 'bg-red-50 text-red-700' :
                                                                        'bg-orange-50 text-orange-700'
                                                            }`}>
                                                            {app.allotmentStatus === 'ALLOTTED' ? 'ALLOTTED' :
                                                                app.allotmentStatus === 'NOT_ALLOTTED' ? 'NOT ALLOTTED' :
                                                                    app.applicationStatus}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <div className="flex items-center justify-end gap-3">
                                                            {/* Only allow edit if PENDING_VERIFICATION or REJECTED */}
                                                            {['PENDING_VERIFICATION', 'REJECTED'].includes(app.applicationStatus) && (
                                                                <button
                                                                    onClick={() => navigate(`/ipo-applications/${app.id}/edit`)}
                                                                    className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-all"
                                                                    title="Edit Application"
                                                                >
                                                                    <Edit size={16} />
                                                                </button>
                                                            )}
                                                            {/* Only allow delete for Admin/Checker roles */}
                                                            {['ADMIN', 'SUPERADMIN', 'CHECKER'].includes(user?.role || '') && (
                                                                <button
                                                                    onClick={async () => {
                                                                        if (window.confirm('Are you sure you want to delete this application? Funds held will be released.')) {
                                                                            try {
                                                                                await ipoApplicationApi.delete(app.id);
                                                                                toast.success('Application deleted');
                                                                                loadData(parseInt(id!));
                                                                            } catch (error) {
                                                                                toast.error('Failed to delete application');
                                                                            }
                                                                        }
                                                                    }}
                                                                    className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-all"
                                                                    title="Delete Application"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => setSelectedAppReport(app)}
                                                                className="text-blue-600 font-black text-[10px] uppercase hover:underline"
                                                            >
                                                                View Result
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {ipoApplications.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-8 py-12 text-center text-gray-400 font-bold italic">No applications found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {ipoChildTab === 'portfolio' && (
                                <div className="space-y-4">
                                    {portfolio.length === 0 ? (
                                        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Briefcase className="text-gray-300" />
                                            </div>
                                            <p className="text-gray-500 font-bold italic">No shares allotted yet.</p>
                                        </div>
                                    ) : (
                                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                            <table className="w-full text-left">
                                                <thead className="bg-gray-50 border-b border-gray-100">
                                                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                        <th className="px-8 py-4">Scrip</th>
                                                        <th className="px-8 py-4 text-center">Current Balance</th>
                                                        <th className="px-8 py-4 text-center">Last Closing Price</th>
                                                        <th className="px-8 py-4 text-center">Value As Of LTP</th>
                                                        <th className="px-8 py-4 text-center">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {portfolio.map((item) => (
                                                        <tr key={item.id} className="hover:bg-gray-50/50 transition-all">
                                                            <td className="px-8 py-5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-bold text-gray-500">
                                                                        {item.scripSymbol.charAt(0)}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-gray-800">{item.scripSymbol}</p>
                                                                        <p className="text-xs text-gray-400 font-medium">{item.ipoCompanyName || 'Secondary Market'}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5 text-center font-bold text-gray-700">{item.quantity}</td>
                                                            <td className="px-8 py-5 text-center font-mono text-gray-600">
                                                                {new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR' }).format(item.currentPrice || item.purchasePrice)}
                                                            </td>
                                                            <td className="px-8 py-5 text-center font-mono font-bold text-gray-800">
                                                                {new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR' }).format(item.currentValue || item.totalCost)}
                                                            </td>
                                                            <td className="px-8 py-5 text-center">
                                                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                                    {item.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    )
                }
            </div>

            {/* Add Bank Account Modal */}
            {
                showAddBankModal && (
                    <AddBankAccountModal
                        customerId={parseInt(id!)}
                        onClose={() => setShowAddBankModal(false)}
                        onSuccess={() => {
                            loadData(parseInt(id!));
                            setShowAddBankModal(false);
                        }}
                    />
                )
            }

            {/* Application Report Modal */}
            {selectedAppReport && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-xl font-black text-gray-900">IPO Application Report</h3>
                                <p className="text-xs font-bold text-primary-500 uppercase tracking-widest mt-1">
                                    APP #{selectedAppReport.applicationNumber || selectedAppReport.id}
                                </p>
                            </div>
                            <button onClick={() => setSelectedAppReport(null)} className="text-gray-400 hover:text-gray-600">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Company</p>
                                    <p className="font-extrabold text-gray-800">{selectedAppReport.ipoCompanyName}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</p>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${selectedAppReport.allotmentStatus === 'ALLOTTED' ? 'bg-green-100 text-green-700' :
                                        selectedAppReport.allotmentStatus === 'NOT_ALLOTTED' ? 'bg-red-100 text-red-700' :
                                            selectedAppReport.applicationStatus === 'APPROVED' ? 'bg-green-50 text-emerald-600' :
                                                selectedAppReport.applicationStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                    'bg-blue-100 text-blue-700'
                                        }`}>
                                        {selectedAppReport.allotmentStatus === 'ALLOTTED' ? 'ALLOTTED' :
                                            selectedAppReport.allotmentStatus === 'NOT_ALLOTTED' ? 'NOT ALLOTTED' :
                                                selectedAppReport.applicationStatus}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Applied Quantity</p>
                                    <p className="font-bold text-gray-700 font-mono">{selectedAppReport.quantity} Units</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount Held</p>
                                    <p className="font-bold text-gray-700 font-mono">रू {selectedAppReport.amount?.toLocaleString()}</p>
                                </div>
                                {selectedAppReport.allotmentStatus === 'ALLOTTED' && (
                                    <div className="col-span-2 p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Allotted Quantity</p>
                                            <p className="text-2xl font-black text-green-700">{selectedAppReport.allotmentQuantity} Units</p>
                                        </div>
                                        <TrendingUp className="text-green-500" size={32} />
                                    </div>
                                )}
                                {selectedAppReport.applicationStatus === 'REJECTED' && (
                                    <div className="col-span-2 p-4 bg-red-50 rounded-2xl border border-red-100">
                                        <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Rejection Reason</p>
                                        <p className="text-sm font-bold text-red-700">{selectedAppReport.rejectionReason || 'No reason provided.'}</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-gray-400 uppercase">Bank Account</p>
                                    <p className="text-xs font-bold text-gray-600">{selectedAppReport.bankAccountNumber || 'N/A'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-400 uppercase">Applied date</p>
                                    <p className="text-xs font-bold text-gray-600">{new Date(selectedAppReport.appliedAt).toLocaleString()}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedAppReport(null)}
                                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-gray-800 transition-all shadow-lg"
                            >
                                Close Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}

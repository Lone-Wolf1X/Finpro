import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerApi, bankAccountApi, ipoApplicationApi } from '../../api/customerApi';
import { Customer, BankAccount, IPOApplication, KycStatus } from '../../types';
import { User, CreditCard, PieChart, ArrowLeft, Edit, FileSignature, Eye, History, Wallet } from 'lucide-react';

export default function CustomerProfile() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [ipoApplications, setIpoApplications] = useState<IPOApplication[]>([]);
    const [activeTab, setActiveTab] = useState<'details' | 'bank' | 'ipo'>('details');
    const [ipoChildTab, setIpoChildTab] = useState<'portfolio' | 'applications'>('applications');
    const [showSignature, setShowSignature] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadData(parseInt(id));
        }
    }, [id]);

    const loadData = async (customerId: number) => {
        try {
            setLoading(true);
            const [custRes, bankRes, ipoRes] = await Promise.all([
                customerApi.getById(customerId),
                bankAccountApi.getByCustomerId(customerId),
                ipoApplicationApi.getByCustomerId(customerId)
            ]);
            setCustomer(custRes.data);
            setBankAccounts(bankRes.data);
            setIpoApplications(ipoRes.data);
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

    if (loading) return <div className="p-8 text-center text-blue-600 animate-pulse font-bold">Initializing Profile Engine...</div>;
    if (!customer) return <div className="p-8 text-center text-red-500">Customer not found</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
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
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-4 flex items-center gap-2">
                                    <User size={20} className="text-blue-500" /> Personal Identity
                                </h3>
                                <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                                    {[
                                        { label: 'Gender', value: customer.gender },
                                        { label: 'Date of Birth', value: customer.dateOfBirth },
                                        { label: 'Citizenship Number', value: customer.citizenshipNumber || 'N/A' },
                                        { label: 'NID Number', value: customer.nidNumber || 'N/A' },
                                        { label: 'Contact Number', value: customer.contactNumber || 'N/A' },
                                        { label: 'Address', value: customer.address || 'N/A' },
                                    ].map((item) => (
                                        <div key={item.label}>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                                            <p className="text-base font-semibold text-gray-700">{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {customer.customerType === 'MINOR' && (
                                <div className="bg-orange-50 p-8 rounded-2xl border border-orange-100">
                                    <h3 className="text-xl font-bold mb-4 text-orange-800 flex items-center gap-2">
                                        Guardian Information
                                    </h3>
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-orange-600 uppercase tracking-wider">Guardian</p>
                                            <p className="text-lg font-extrabold text-orange-900 leading-tight">
                                                {customer.guardianName} ({customer.guardianRelation})
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-4">Documents</h3>
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Signature</p>
                                        <div
                                            className="h-32 w-full bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-all overflow-hidden relative"
                                            onClick={() => setShowSignature(!showSignature)}
                                        >
                                            {showSignature ? (
                                                customer.signaturePath ? (
                                                    <img src={`/uploads/${customer.signaturePath}`} alt="Signature" className="h-full w-full object-contain p-2" />
                                                ) : (
                                                    <div className="text-center">
                                                        <FileSignature size={28} className="text-gray-300 mx-auto" />
                                                        <p className="text-xs font-bold text-gray-400 mt-2 italic">Not Uploaded</p>
                                                    </div>
                                                )
                                            ) : (
                                                <div className="flex flex-col items-center gap-2">
                                                    <Eye size={24} className="text-blue-500" />
                                                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Show Signature</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {customer.customerType === 'MINOR' && (
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Guardian Photo</p>
                                            <div className="h-44 w-full bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden flex items-center justify-center">
                                                {customer.guardianPhotoPath ? (
                                                    <img src={`/uploads/${customer.guardianPhotoPath}`} alt="Guardian" className="h-full w-full object-cover" />
                                                ) : (
                                                    <User size={48} className="text-gray-200" />
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'bank' && (
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
                                            रू 0.00
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest ${bank.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'}`}>
                                                {bank.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-all title='Statement'"><History size={16} /></button>
                                                <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-sm">Deposit</button>
                                                <button className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all shadow-sm">Withdraw</button>
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
                )}

                {activeTab === 'ipo' && (
                    <div className="space-y-6">
                        <div className="flex bg-gray-100 p-1 rounded-xl w-fit font-bold">
                            {[
                                { id: 'applications', label: 'Applications & ASBA', icon: History },
                                { id: 'portfolio', label: 'My Portfolio', icon: Wallet },
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

                        {ipoChildTab === 'applications' ? (
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
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest ${app.applicationStatus === 'APPROVED' ? 'bg-green-50 text-green-700' :
                                                        app.applicationStatus === 'REJECTED' ? 'bg-red-50 text-red-700' :
                                                            'bg-orange-50 text-orange-700'
                                                        }`}>
                                                        {app.applicationStatus}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <button className="text-blue-600 font-black text-[10px] uppercase hover:underline">Verify Result</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <p className="text-gray-500 font-bold italic col-span-3 text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                    No shares allotted yet. Apply for upcoming IPOs!
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

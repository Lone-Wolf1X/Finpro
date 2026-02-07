import { useState, useEffect } from 'react';
import { ipoApplicationApi } from '../../api/customerApi';
import { IPOApplication } from '../../types';
import { useAppSelector } from '@/store/hooks';
import {
    Search,
    CheckCircle,
    XCircle,
    Eye,
    AlertCircle,
    RefreshCw,
    TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function IPOApplicationAdminList() {
    const { user } = useAppSelector((state) => state.auth);
    const [applications, setApplications] = useState<IPOApplication[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('PENDING');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedApp, setSelectedApp] = useState<IPOApplication | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [allotmentQty, setAllotmentQty] = useState<number>(0);

    useEffect(() => {
        loadApplications();
    }, [filterStatus]);

    const loadApplications = async () => {
        try {
            setLoading(true);
            const res = await ipoApplicationApi.getAll({ status: filterStatus === 'ALL' ? undefined : filterStatus });
            setApplications(res.data);
        } catch (error) {
            toast.error('Failed to load applications');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number) => {
        try {
            await ipoApplicationApi.approve(id, user!.firstName + ' ' + user!.lastName);
            toast.success('Application approved');
            loadApplications();
        } catch (error) {
            toast.error('Failed to approve application');
        }
    };

    const handleReject = async (id: number) => {
        if (!rejectionReason) {
            toast.error('Please provide a reason for rejection');
            return;
        }
        try {
            await ipoApplicationApi.reject(id, rejectionReason);
            toast.success('Application rejected');
            setSelectedApp(null);
            setRejectionReason('');
            loadApplications();
        } catch (error) {
            toast.error('Failed to reject application');
        }
    };

    const handleAllot = async (id: number) => {
        if (allotmentQty < 0) {
            toast.error('Please provide a valid quantity');
            return;
        }
        try {
            await ipoApplicationApi.allotShares(id, allotmentQty);
            toast.success('Shares allotted successfully');
            setSelectedApp(null);
            setAllotmentQty(0);
            loadApplications();
        } catch (error) {
            toast.error('Failed to allot shares');
        }
    };

    const filteredApps = applications.filter(app =>
        app.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.ipoCompanyName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'APPROVED': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
            case 'ALLOTTED': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-gray-100 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">IPO Applications</h1>
                    <p className="text-gray-500 font-medium">Verify and allot shares for all customer applications</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'ALLOTTED'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${filterStatus === status
                                ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-100'
                                : 'bg-white text-gray-600 border-gray-100 hover:border-primary-200 hover:bg-primary-50'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by customer or company name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-primary-100 focus:border-primary-400 outline-none transition-all"
                        />
                    </div>
                    <button onClick={loadApplications} className="p-3 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <th className="px-8 py-4">Application Info</th>
                                <th className="px-8 py-4">IPO Detail</th>
                                <th className="px-8 py-4 text-center">Amount</th>
                                <th className="px-8 py-4 text-center">Status</th>
                                <th className="px-8 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center text-gray-400 font-bold animate-pulse">
                                        Fetching applications...
                                    </td>
                                </tr>
                            ) : filteredApps.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center text-gray-400 font-medium italic">
                                        No applications found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredApps.map(app => (
                                    <tr key={app.id} className="hover:bg-gray-50/50 transition-all group">
                                        <td className="px-8 py-5">
                                            <p className="font-extrabold text-gray-800 text-sm">{app.customerName}</p>
                                            <p className="text-[10px] font-bold text-primary-500 tracking-widest">APP #{app.applicationNumber || app.id}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="font-bold text-gray-700 text-sm">{app.ipoCompanyName}</p>
                                            <p className="text-[10px] font-bold text-gray-400 italic">Units: {app.quantity}</p>
                                        </td>
                                        <td className="px-8 py-5 text-center font-mono font-bold text-gray-600">
                                            रू {app.amount.toLocaleString()}
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black border uppercase tracking-widest ${getStatusStyle(app.applicationStatus)}`}>
                                                {app.applicationStatus}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {app.applicationStatus === 'PENDING' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(app.id)}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => setSelectedApp(app)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Reject"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                    </>
                                                )}
                                                {(app.applicationStatus === 'APPROVED' || app.applicationStatus === 'ALLOTTED') && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedApp(app);
                                                            setAllotmentQty(app.allotmentQuantity || app.quantity);
                                                        }}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="Allot Shares"
                                                    >
                                                        <TrendingUp size={18} />
                                                    </button>
                                                )}
                                                <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-all" title="View Details">
                                                    <Eye size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Rejection/Allotment Modal */}
            {selectedApp && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                            <h3 className="text-xl font-black text-gray-900">
                                {selectedApp.applicationStatus === 'PENDING' ? 'Reject Application' : 'Allot Shares'}
                            </h3>
                            <button onClick={() => setSelectedApp(null)} className="text-gray-400 hover:text-gray-600">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <p className="text-xs font-bold text-gray-400 uppercase">Customer</p>
                                <p className="font-extrabold text-gray-800">{selectedApp.customerName}</p>
                                <p className="text-xs font-bold text-primary-500 mt-1">{selectedApp.ipoCompanyName}</p>
                            </div>

                            {selectedApp.applicationStatus === 'PENDING' ? (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reason for Rejection</label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all min-h-[100px]"
                                        placeholder="Explain why this application is being rejected..."
                                    />
                                    <button
                                        onClick={() => handleReject(selectedApp.id)}
                                        className="w-full py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                                    >
                                        Confirm Rejection
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Allotted Quantity</label>
                                        <input
                                            type="number"
                                            value={allotmentQty}
                                            onChange={(e) => setAllotmentQty(parseInt(e.target.value))}
                                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xl font-black text-center focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                        />
                                        <p className="text-[10px] text-center text-gray-400 font-bold uppercase">Applied: {selectedApp.quantity} Units</p>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                                        <AlertCircle className="text-blue-500 shrink-0" size={18} />
                                        <p className="text-[10px] font-bold text-blue-800 leading-relaxed uppercase">
                                            Allotting shares will update customer portfolio and adjust ledger balances (refunding extra amount if any).
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleAllot(selectedApp.id)}
                                        className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black hover:bg-primary-700 transition-all shadow-lg shadow-primary-100"
                                    >
                                        Proceed with Allotment
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

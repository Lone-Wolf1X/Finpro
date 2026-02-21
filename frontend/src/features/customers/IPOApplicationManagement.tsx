import { useState, useEffect, useMemo } from 'react';
import { ipoApi, ipoApplicationApi, allotmentApi } from '../../api/customerApi';
import { IPO, IPOApplication, AllotmentDraft } from '../../types';
import {
    Search, CheckCircle2, Check, ArrowUpDown,
    Loader2, Plus, Target, XCircle, Send, ShieldCheck
} from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { RootState } from '../../store/store';
import toast from 'react-hot-toast';
import BulkApplyModal from './BulkApplyModal';

interface AllotmentDraftItem {
    applicationId: number;
    quantity: number;
    isAllotted: boolean;
    customerName?: string;
}

export default function IPOApplicationManagement() {
    const { user } = useAppSelector((state: RootState) => state.auth);
    const [ipos, setIpos] = useState<IPO[]>([]);
    const [selectedIpo, setSelectedIpo] = useState<number | null>(null);
    const [applications, setApplications] = useState<IPOApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [appsLoading, setAppsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED' | 'ALLOTTED'>('ALL');
    const [selectedApps, setSelectedApps] = useState<number[]>([]);
    const [showBulkApply, setShowBulkApply] = useState(false);
    const [processing, setProcessing] = useState<string | null>(null);

    // Allotment Workflow States
    const [allotmentDrafts, setAllotmentDrafts] = useState<Record<number, AllotmentDraftItem>>({});
    const [pendingBatch, setPendingBatch] = useState<AllotmentDraft[]>([]);
    const [batchLoading, setBatchLoading] = useState(false);

    useEffect(() => {
        fetchIpos();
    }, []);

    useEffect(() => {
        if (selectedIpo) {
            fetchApplications(selectedIpo);
            fetchPendingBatch(selectedIpo);
            setAllotmentDrafts({}); // Clear drafts when IPO changes
        } else {
            setApplications([]);
            setPendingBatch([]);
        }
    }, [selectedIpo]);

    const fetchIpos = async () => {
        try {
            setLoading(true);
            const res = await ipoApi.getAll();
            setIpos(res.data);
            if (res.data.length > 0) {
                setSelectedIpo(res.data[0].id);
            }
        } catch (error) {
            toast.error('Failed to fetch IPOs');
        } finally {
            setLoading(false);
        }
    };

    const fetchApplications = async (ipoId: number) => {
        try {
            setAppsLoading(true);
            const res = await ipoApplicationApi.getByIpoId(ipoId);
            setApplications(res.data);
        } catch (error) {
            toast.error('Failed to fetch applications');
        } finally {
            setAppsLoading(false);
        }
    };
    const fetchPendingBatch = async (ipoId: number) => {
        if (user?.role !== 'CHECKER' && user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') return;
        try {
            setBatchLoading(true);
            const res = await allotmentApi.getPendingDrafts(ipoId);
            setPendingBatch(res.data);
        } catch (error) {
            console.error('Failed to fetch pending batch', error);
        } finally {
            setBatchLoading(false);
        }
    };

    // Bulk Allotment Actions for Makers
    const handleBulkMarkDraft = (status: 'ALLOTTED' | 'NOT_ALLOTTED') => {
        if (selectedApps.length === 0) {
            toast.error('Please select applications first');
            return;
        }

        const newDrafts = { ...allotmentDrafts };
        selectedApps.forEach(id => {
            const app = applications.find(a => a.id === id);
            if (app && app.applicationStatus === 'APPROVED') {
                newDrafts[id] = {
                    applicationId: id,
                    quantity: status === 'ALLOTTED' ? app.quantity : 0,
                    isAllotted: status === 'ALLOTTED',
                    customerName: app.customerName
                };
            }
        });

        setAllotmentDrafts(newDrafts);
        setSelectedApps([]); // Clear selection after marking
        toast.success(`Drafted ${Object.keys(newDrafts).length} allotment results`);
    };

    const submitAllotmentDrafts = async () => {
        const draftCount = Object.keys(allotmentDrafts).length;
        if (draftCount === 0) return;
        if (!selectedIpo) return;

        if (!window.confirm(`Submit results for ${draftCount} applications? These will be sent for verification.`)) return;

        try {
            setProcessing('submit-allotment');
            const items = Object.values(allotmentDrafts).map(d => ({
                applicationId: d.applicationId,
                quantity: d.quantity,
                isAllotted: d.isAllotted
            }));

            await allotmentApi.submitDrafts({ ipoId: selectedIpo, items });
            toast.success('Allotment results submitted for verification');
            setAllotmentDrafts({});
            fetchApplications(selectedIpo);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Submission failed');
        } finally {
            setProcessing(null);
        }
    };

    const handleMarkAllotment = async (applicationId: number, quantity: number, status: string) => {
        const app = applications.find(a => a.id === applicationId);
        if (!app) return;

        setAllotmentDrafts(prev => ({
            ...prev,
            [applicationId]: {
                applicationId,
                quantity,
                isAllotted: status === 'ALLOTTED',
                customerName: app.customerName
            }
        }));
        toast.success(`Drafted ${status} for ${app.customerName}`);
    };

    const handleVerifyBatch = async (approve: boolean) => {
        if (!selectedIpo) return;

        const action = approve ? 'approve' : 'reject';
        if (!window.confirm(`Are you sure you want to ${action} this allotment batch?`)) return;

        try {
            setProcessing('verify-batch');
            await allotmentApi.verify(selectedIpo, approve);
            toast.success(`Allotment batch ${approve ? 'approved' : 'rejected'} successfully`);
            setPendingBatch([]);
            fetchApplications(selectedIpo);
            fetchIpos(); // Status might have changed to ALLOTTED
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Verification failed');
        } finally {
            setProcessing(null);
        }
    };

    const handleVerify = async (id: number) => {
        try {
            setProcessing(`verify-${id}`);
            await ipoApplicationApi.verify(id);
            toast.success('Application verified');
            if (selectedIpo) fetchApplications(selectedIpo);
        } catch (error) {
            toast.error('Verification failed');
        } finally {
            setProcessing(null);
        }
    };

    const handleApprove = async (id: number) => {
        try {
            setProcessing(`approve-${id}`);
            await ipoApplicationApi.approve(id, user?.firstName || 'Admin');
            toast.success('Application approved');
            if (selectedIpo) fetchApplications(selectedIpo);
        } catch (error) {
            toast.error('Approval failed');
        } finally {
            setProcessing(null);
        }
    };

    const handleResetStatus = async (id: number) => {
        if (!window.confirm('Are you sure you want to reset this application to PENDING status?')) return;

        try {
            setProcessing(`reset-${id}`);
            await ipoApplicationApi.resetStatus(id, 'PENDING');
            toast.success('Application status reset to PENDING');
            if (selectedIpo) fetchApplications(selectedIpo);
        } catch (error) {
            toast.error('Failed to reset status');
        } finally {
            setProcessing(null);
        }
    };

    const handleInitiateAllotment = async () => {
        if (!selectedIpo || !currentIpo) return;
        if (!window.confirm(`Are you sure you want to initiate allotment phase for ${currentIpo.companyName}? This will allow Makers to mark allotment results.`)) return;

        try {
            setProcessing('init-allotment');
            await ipoApi.initiateAllotment(selectedIpo, user?.firstName || 'Admin');
            toast.success('Allotment phase initiated successfully');
            fetchIpos(); // Refresh IPO status
        } catch (error) {
            toast.error('Failed to initiate allotment phase');
        } finally {
            setProcessing(null);
        }
    };

    const filteredApps = applications.filter(app => {
        const matchesSearch = app.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.applicationNumber?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' ||
            (statusFilter === 'ALLOTTED' && (app.allotmentStatus === 'ALLOTTED' || app.applicationStatus === 'ALLOTTED')) ||
            app.applicationStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const currentIpo = ipos.find(i => i.id === selectedIpo);

    // Helper to see if an application is in the pending batch
    const pendingInBatch = useMemo(() => {
        const set = new Set(pendingBatch.map(d => d.applicationId));
        return set;
    }, [pendingBatch]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-primary-600" size={48} />
            </div>
        );
    }

    const draftCount = Object.keys(allotmentDrafts).length;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-24">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">IPO Allotment Control</h1>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-black uppercase tracking-widest">
                            Management Portal
                        </span>
                        <div className="h-1 w-1 bg-gray-300 rounded-full" />
                        <p className="text-gray-500 font-bold">Monitor and process IPO allotments with draft flow</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    {/* Bulk Actions for Maker */}
                    {currentIpo?.status === 'ALLOTMENT_PHASE' && (user?.role === 'MAKER' || user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && selectedApps.length > 0 && (
                        <div className="flex items-center gap-2 p-1 bg-gray-900 rounded-2xl shadow-xl animate-in zoom-in duration-300">
                            <button
                                onClick={() => handleBulkMarkDraft('ALLOTTED')}
                                className="px-5 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all"
                            >
                                Mark Allotted
                            </button>
                            <button
                                onClick={() => handleBulkMarkDraft('NOT_ALLOTTED')}
                                className="px-5 py-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all"
                            >
                                Mark Not Allotted
                            </button>
                        </div>
                    )}

                    {(user?.role === 'MAKER' || user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && (
                        <button
                            onClick={() => setShowBulkApply(true)}
                            className="px-6 py-4 bg-white border-2 border-primary-600 text-primary-600 rounded-2xl font-black hover:bg-primary-50 transition-all flex items-center gap-2 shadow-lg shadow-primary-50"
                        >
                            <Plus size={20} />
                            BULK APPLY
                        </button>
                    )}
                </div>
            </div>

            {/* IPO Selector Dropdown */}
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Select IPO to Manage</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
                            <select
                                value={selectedIpo || ''}
                                onChange={(e) => setSelectedIpo(Number(e.target.value))}
                                className="w-full pl-12 pr-6 py-4 bg-white border-2 border-gray-100 rounded-2xl font-black text-gray-900 focus:ring-2 focus:ring-primary-100 focus:border-primary-600 outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="" disabled>Choose an IPO...</option>
                                {ipos.map(ipo => (
                                    <option key={ipo.id} value={ipo.id}>
                                        {ipo.companyName} ({ipo.symbol}) - रू {ipo.pricePerShare}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* IPO Details Card */}
                    {currentIpo && (
                        <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-6 rounded-3xl border-2 border-primary-200">
                            <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-2">Selected IPO</p>
                            <p className="font-black text-gray-900 text-xl mb-3">{currentIpo.companyName}</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-[9px] font-black text-gray-500 uppercase">Symbol</p>
                                    <p className="font-black text-primary-700">{currentIpo.symbol}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-500 uppercase">Price</p>
                                    <p className="font-black text-gray-900">रू {currentIpo.pricePerShare}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-500 uppercase">Status</p>
                                    <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase ${currentIpo.status === 'OPEN' ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}`}>
                                        {currentIpo.status}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-500 uppercase">Applications</p>
                                    <p className="font-black text-gray-900">{applications.length}</p>
                                </div>
                            </div>

                            {/* Allotment Phase Trigger */}
                            {currentIpo.status === 'CLOSED' && (user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && (
                                <button
                                    onClick={handleInitiateAllotment}
                                    disabled={!!processing}
                                    className="mt-4 w-full py-3 bg-purple-600 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-purple-700 transition-all shadow-lg shadow-purple-200"
                                >
                                    {processing === 'init-allotment' ? <Loader2 className="animate-spin inline mr-2" size={14} /> : null}
                                    Initiate Allotment Phase
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Checker Verification Alert */}
                {pendingBatch.length > 0 && (user?.role === 'CHECKER' || user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && (
                    <div className="bg-white border-2 border-amber-500 rounded-[2rem] p-8 shadow-2xl shadow-amber-500/10 animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                            <ShieldCheck className="text-amber-500/10 w-24 h-24 rotate-12" />
                        </div>
                        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                            <div className="flex items-start gap-6">
                                <div className="p-4 bg-amber-500 rounded-3xl text-white shadow-lg shadow-amber-500/20">
                                    <ShieldCheck size={32} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900 leading-tight">Pending Batch Verification</h3>
                                    <p className="text-gray-500 font-bold mt-2 max-w-md"> There is an allotment batch for <span className="text-amber-600"> {pendingBatch.length} applications </span> waiting for your approval. </p>
                                    <div className="flex items-center gap-4 mt-6">
                                        <div className="bg-amber-50 px-4 py-2 rounded-xl flex items-center gap-2">
                                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Maker:</span>
                                            <span className="text-sm font-black text-gray-700">{pendingBatch[0].makerName || 'System Maker'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 w-full lg:w-auto">
                                <button
                                    onClick={() => handleVerifyBatch(false)}
                                    disabled={!!processing}
                                    className="flex-1 lg:flex-none px-8 py-4 bg-gray-50 text-gray-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all border-2 border-transparent hover:border-red-100"
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleVerifyBatch(true)}
                                    disabled={!!processing}
                                    className="flex-1 lg:flex-none px-12 py-4 bg-amber-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-3"
                                >
                                    {processing === 'verify-batch' ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                                    Approve Batch
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Allotment Summary Table for Checker */}
                {pendingBatch.length > 0 && (user?.role === 'CHECKER' || user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && (
                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                        <div className="px-8 py-6 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Draft Batch Details</h4>
                            {batchLoading && <Loader2 size={16} className="animate-spin text-amber-500" />}
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-white shadow-sm z-10">
                                    <tr>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase">Customer</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase">Quantity</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase text-right">Result</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {pendingBatch.map(draft => (
                                        <tr key={draft.id} className="hover:bg-amber-50/10 transition-all">
                                            <td className="px-8 py-4">
                                                <p className="font-bold text-gray-800 text-sm">{draft.customerName}</p>
                                                <p className="text-[10px] font-bold text-gray-400">{draft.applicationNumber}</p>
                                            </td>
                                            <td className="px-8 py-4 text-sm font-bold text-gray-700">
                                                {draft.allottedQuantity} <span className="text-[10px] text-gray-400 uppercase ml-1">Units</span>
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${draft.isAllotted ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {draft.isAllotted ? 'Allotted' : 'Rejected'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Main Application Table */}
                <div className="space-y-6">
                    {/* Filters bar */}
                    <div className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
                        <div className="relative flex-1 min-w-[300px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name or app number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-6 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary-100 rounded-2xl outline-none font-bold text-sm transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {(['ALL', 'PENDING', 'PENDING_VERIFICATION', 'APPROVED', 'REJECTED', 'ALLOTTED'] as const).map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${statusFilter === status
                                        ? 'bg-gray-900 text-white shadow-lg'
                                        : 'bg-white text-gray-400 hover:text-gray-900 border border-gray-100'
                                        }`}
                                >
                                    {status.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
                        <div className="overflow-x-auto">
                            {appsLoading ? (
                                <div className="p-20 flex flex-col items-center justify-center gap-4">
                                    <Loader2 className="animate-spin text-primary-600" size={32} />
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading Applications...</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50">
                                            <th className="px-8 py-5">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                    checked={selectedApps.length === filteredApps.length && filteredApps.length > 0}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedApps(filteredApps.map(a => a.id));
                                                        else setSelectedApps([]);
                                                    }}
                                                />
                                            </th>
                                            <th className="px-6 py-5">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                    Customer <ArrowUpDown size={12} />
                                                </div>
                                            </th>
                                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Quantity</th>
                                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Allotment</th>
                                            <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredApps.map(app => {
                                            const isDrafted = !!allotmentDrafts[app.id];
                                            const draftValue = allotmentDrafts[app.id];

                                            return (
                                                <tr key={app.id} className={`hover:bg-primary-50/30 transition-all ${selectedApps.includes(app.id) ? 'bg-primary-50/50' : ''} ${isDrafted ? 'bg-amber-50/20' : ''}`}>
                                                    <td className="px-8 py-6">
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                            checked={selectedApps.includes(app.id)}
                                                            onChange={() => {
                                                                setSelectedApps(prev => prev.includes(app.id) ? prev.filter(id => id !== app.id) : [...prev, app.id]);
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div>
                                                                <p className="font-black text-gray-900">{app.customerName}</p>
                                                                <p className="text-[10px] font-bold text-gray-400 font-mono mt-0.5">{app.applicationNumber}</p>
                                                            </div>
                                                            {isDrafted && (
                                                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black rounded uppercase">Draft</span>
                                                            )}
                                                            {pendingInBatch.has(app.id) && (
                                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-black rounded uppercase">Verification Pending</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${app.applicationStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                                            app.applicationStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                                app.applicationStatus === 'PENDING_VERIFICATION' ? 'bg-amber-100 text-amber-700' :
                                                                    (app.applicationStatus === 'ALLOTTED' || app.allotmentStatus === 'ALLOTTED') ? 'bg-emerald-600 text-white' :
                                                                        'bg-blue-100 text-blue-700'
                                                            }`}>
                                                            {app.applicationStatus.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-6 text-sm font-black text-gray-900 border-x border-gray-50/50">
                                                        <p>{app.quantity}</p>
                                                        <p className="text-[10px] font-bold text-gray-400 tracking-tight">रू {app.amount?.toLocaleString()}</p>
                                                    </td>
                                                    <td className="px-6 py-6 font-mono text-sm font-black text-gray-900">
                                                        {isDrafted ? (
                                                            <div className="flex items-center gap-2">
                                                                <span className={draftValue.isAllotted ? 'text-emerald-600' : 'text-red-600'}>
                                                                    {draftValue.isAllotted ? draftValue.quantity : 0} Units
                                                                </span>
                                                                <button onClick={() => setAllotmentDrafts(prev => {
                                                                    const n = { ...prev };
                                                                    delete n[app.id];
                                                                    return n;
                                                                })} className="text-gray-400 hover:text-red-600 transition-colors">
                                                                    <XCircle size={14} />
                                                                </button>
                                                            </div>
                                                        ) : pendingInBatch.has(app.id) ? (
                                                            <span className="text-blue-600 italic text-[10px]">Batch Review...</span>
                                                        ) : app.allotmentStatus !== 'PENDING' ? (
                                                            <div className="flex items-center gap-2">
                                                                <span className={app.allotmentStatus === 'ALLOTTED' ? 'text-emerald-600' : 'text-red-600'}>
                                                                    {app.allotmentQuantity} Units
                                                                </span>
                                                                <span className="text-[8px] px-1 bg-gray-100 rounded text-gray-500">{app.allotmentStatus}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-300">--</span>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {app.applicationStatus === 'PENDING_VERIFICATION' && (user?.role === 'CHECKER' || user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && (
                                                                <button
                                                                    onClick={() => handleVerify(app.id)}
                                                                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                                    title="Verify"
                                                                >
                                                                    <Check size={16} />
                                                                </button>
                                                            )}
                                                            {app.applicationStatus === 'PENDING' && (user?.role === 'CHECKER' || user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && (
                                                                <button
                                                                    onClick={() => handleApprove(app.id)}
                                                                    className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                                    title="Approve"
                                                                >
                                                                    <CheckCircle2 size={16} />
                                                                </button>
                                                            )}
                                                            {app.applicationStatus === 'APPROVED' && currentIpo?.status === 'ALLOTMENT_PHASE' && (user?.role === 'MAKER' || user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && !isDrafted && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleMarkAllotment(app.id, app.quantity, 'ALLOTTED')}
                                                                        className="px-3 py-1.5 bg-green-50 text-green-700 text-[10px] font-black rounded-lg hover:bg-green-600 hover:text-white transition-all"
                                                                    >
                                                                        ALLOT
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleMarkAllotment(app.id, 0, 'NOT_ALLOTTED')}
                                                                        className="px-3 py-1.5 bg-red-50 text-red-700 text-[10px] font-black rounded-lg hover:bg-red-600 hover:text-white transition-all"
                                                                    >
                                                                        REJECT
                                                                    </button>
                                                                </>
                                                            )}
                                                            {(app.applicationStatus === 'APPROVED' || app.applicationStatus === 'ALLOTTED') && (user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && (
                                                                <button
                                                                    onClick={() => handleResetStatus(app.id)}
                                                                    disabled={processing === `reset-${app.id}`}
                                                                    className="px-3 py-1.5 bg-orange-50 text-orange-700 text-[10px] font-black rounded-lg hover:bg-orange-600 hover:text-white transition-all"
                                                                    title="Reset to PENDING"
                                                                >
                                                                    {processing === `reset-${app.id}` ? '...' : 'RESET'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {filteredApps.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-8 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-4">
                                                        <div className="p-6 bg-gray-50 rounded-full text-gray-300">
                                                            <Target size={48} />
                                                        </div>
                                                        <div>
                                                            <p className="text-lg font-black text-gray-900">No applications found</p>
                                                            <p className="text-gray-400 font-bold">Try adjusting your search or filters</p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Action Bar for Allotment Draft Submission */}
            {draftCount > 0 && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
                    <div className="bg-gray-900 text-white px-8 py-4 rounded-[2.5rem] shadow-2xl flex items-center gap-8 border border-white/10 backdrop-blur-md">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Drafting Allotment</span>
                            <span className="font-black text-lg">{draftCount} Records Marked</span>
                        </div>
                        <div className="h-10 w-px bg-white/10" />
                        <div className="flex gap-4">
                            <button
                                onClick={() => setAllotmentDrafts({})}
                                className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-xs uppercase transition-all"
                            >
                                Clear Draft
                            </button>
                            <button
                                onClick={submitAllotmentDrafts}
                                disabled={!!processing}
                                className="px-8 py-3 bg-primary-600 hover:bg-primary-700 rounded-2xl font-black text-xs uppercase flex items-center gap-2 transition-all shadow-lg shadow-primary-500/20"
                            >
                                {processing === 'submit-allotment' ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                                Submit to Checker
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <BulkApplyModal
                isOpen={showBulkApply}
                onClose={() => setShowBulkApply(false)}
                onSuccess={() => selectedIpo && fetchApplications(selectedIpo)}
            />
        </div>
    );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Edit, Trash2, Plus, Eye, Gavel, Rocket } from 'lucide-react';
import { ipoApi } from '../../api/customerApi';
import { IPO, IPOStatus } from '../../types';

export default function IPOManagement() {
    const navigate = useNavigate();
    const [ipos, setIpos] = useState<IPO[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<IPOStatus | 'ALL'>('ALL');

    useEffect(() => {
        loadIPOs();
    }, [filter]);

    const loadIPOs = async () => {
        try {
            setLoading(true);
            const response = filter === 'ALL'
                ? await ipoApi.getAll()
                : await ipoApi.getAll({ status: filter });
            setIpos(response.data);
        } catch (error) {
            console.error('Failed to load IPOs:', error);
            toast.error('Failed to load IPOs');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number, companyName: string) => {
        if (!window.confirm(`Are you sure you want to delete ${companyName}? This action cannot be undone.`)) {
            return;
        }

        try {
            await ipoApi.delete(id);
            toast.success('IPO deleted successfully');
            loadIPOs();
        } catch (error) {
            toast.error('Failed to delete IPO');
        }
    };

    const handleAllot = async (id: number, companyName: string) => {
        if (!window.confirm(`Are you sure you want to process allotment for ${companyName}? This will allot shares to all approved applicants.`)) {
            return;
        }

        try {
            await ipoApi.allot(id);
            toast.success('Allotment processed successfully');
            loadIPOs();
        } catch (error) {
            console.error('Failed to process allotment:', error);
            toast.error('Failed to process allotment');
        }
    };

    const handleList = async (id: number, companyName: string) => {
        if (!window.confirm(`Are you sure you want to list ${companyName}? This will activate customer portfolios.`)) {
            return;
        }

        try {
            await ipoApi.list(id);
            toast.success('IPO listed successfully');
            loadIPOs();
        } catch (error) {
            console.error('Failed to list IPO:', error);
            toast.error('Failed to list IPO');
        }
    };

    const getStatusBadge = (status: IPOStatus) => {
        const styles = {
            UPCOMING: 'bg-blue-100 text-blue-800 border-blue-200',
            OPEN: 'bg-green-100 text-green-800 border-green-200',
            CLOSED: 'bg-gray-100 text-gray-800 border-gray-200',
            ALLOTTED: 'bg-purple-100 text-purple-800 border-purple-200',
            LISTED: 'bg-indigo-100 text-indigo-800 border-indigo-200'
        };
        return `px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || styles.UPCOMING}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NP', {
            style: 'currency',
            currency: 'NPR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const canMakerApply = (status: IPOStatus) => {
        // Maker can apply only when status is OPEN
        return status === 'OPEN';
    };

    const canCheckerApprove = (status: IPOStatus) => {
        // Checker can approve applications when status is OPEN or CLOSED
        return status === 'OPEN' || status === 'CLOSED';
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-black text-gray-900">IPO Management</h1>
                    <p className="text-gray-500 font-medium mt-2">Manage all IPO listings and applications</p>
                </div>
                <button
                    onClick={() => navigate('/ipos/new')}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 font-bold transition-all shadow-lg"
                >
                    <Plus size={20} />
                    Add New IPO
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-6">
                {(['ALL', 'UPCOMING', 'OPEN', 'CLOSED', 'ALLOTTED', 'LISTED'] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${filter === status
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Company
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Symbol
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Price
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Issue Size
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Min-Max Qty
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Open Date
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Close Date
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Maker Apply
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Checker Approve
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-black text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                                        Loading IPOs...
                                    </td>
                                </tr>
                            ) : ipos.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                                        No IPOs found
                                    </td>
                                </tr>
                            ) : (
                                ipos.map((ipo) => (
                                    <tr key={ipo.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{ipo.companyName}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono font-bold text-blue-600">{ipo.symbol}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={getStatusBadge(ipo.status)}>{ipo.status}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900">
                                            {formatCurrency(ipo.pricePerShare)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-700">
                                            {ipo.issueSize.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-gray-700">
                                            {ipo.minQuantity} - {ipo.maxQuantity}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {formatDate(ipo.openDate)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {formatDate(ipo.closeDate)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {canMakerApply(ipo.status) ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                                    ✓ Yes
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                                                    ✗ No
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {canCheckerApprove(ipo.status) ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                                    ✓ Yes
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                                                    ✗ No
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {ipo.status === 'CLOSED' && (
                                                    <button
                                                        onClick={() => handleAllot(ipo.id, ipo.companyName)}
                                                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                        title="Process Allotment"
                                                    >
                                                        <Gavel size={18} />
                                                    </button>
                                                )}
                                                {ipo.status === 'ALLOTTED' && (
                                                    <button
                                                        onClick={() => handleList(ipo.id, ipo.companyName)}
                                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="List IPO"
                                                    >
                                                        <Rocket size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => navigate(`/ipos/${ipo.id}`)}
                                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/ipos/${ipo.id}/edit`)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit IPO"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(ipo.id, ipo.companyName)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete IPO"
                                                >
                                                    <Trash2 size={18} />
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

            {/* Maker-Checker Rules Info */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <h3 className="font-black text-blue-900 mb-3">Maker-Checker Workflow Rules</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="font-bold text-blue-800 mb-2">👤 Maker (Customer) Can Apply:</p>
                        <ul className="list-disc list-inside text-blue-700 space-y-1">
                            <li>Only when IPO status is <span className="font-bold">OPEN</span></li>
                            <li>Within the open and close date range</li>
                            <li>Must have sufficient balance</li>
                        </ul>
                    </div>
                    <div>
                        <p className="font-bold text-blue-800 mb-2">✓ Checker (Admin) Can Approve:</p>
                        <ul className="list-disc list-inside text-blue-700 space-y-1">
                            <li>When IPO status is <span className="font-bold">OPEN</span> or <span className="font-bold">CLOSED</span></li>
                            <li>Can verify and approve pending applications</li>
                            <li>Can reject applications with remarks</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

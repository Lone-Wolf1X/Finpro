import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { RootState } from '../../store/store';
import { ipoApi } from '../../api/customerApi';
import { IPO, IPOStatus } from '../../types';

export default function IPOList() {
    const navigate = useNavigate();
    const [ipos, setIpos] = useState<IPO[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'UPCOMING'>('ACTIVE');

    useEffect(() => {
        loadIPOs();
    }, [filter]);

    const loadIPOs = async () => {
        try {
            setLoading(true);
            let response;
            if (filter === 'ACTIVE') {
                response = await ipoApi.getActive();
            } else if (filter === 'UPCOMING') {
                response = await ipoApi.getUpcoming();
            } else {
                response = await ipoApi.getAll();
            }
            setIpos(response.data);
        } catch (error) {
            console.error('Failed to load IPOs:', error);
            toast.error('Failed to load IPOs');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: IPOStatus) => {
        const colors = {
            UPCOMING: 'bg-blue-100 text-blue-800 border border-blue-200',
            OPEN: 'bg-green-100 text-green-800 border border-green-200',
            CLOSED: 'bg-gray-100 text-gray-800 border border-gray-200',
            ALLOTTED: 'bg-purple-100 text-purple-800 border border-purple-200',
            LISTED: 'bg-indigo-100 text-indigo-800 border border-indigo-200'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NP', {
            style: 'currency',
            currency: 'NPR'
        }).format(amount);
    };

    const { user } = useSelector((state: RootState) => state.auth);
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to dispose of this IPO? This action cannot be undone.')) {
            return;
        }

        try {
            await ipoApi.delete(id);
            toast.success('IPO disposed successfully');
            loadIPOs();
        } catch (error) {
            toast.error('Failed to dispose IPO');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">IPO Listings</h1>
                    <p className="text-gray-500 font-medium mt-1">Discover and invest in new opportunities</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => navigate('/ipos/new')}
                        className="bg-primary-600 text-white px-6 py-3 rounded-2xl hover:bg-primary-700 font-bold transition-all shadow-lg shadow-primary-200"
                    >
                        + Add IPO
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 inline-flex mb-8">
                {(['ACTIVE', 'UPCOMING', 'ALL'] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${filter === status
                            ? 'bg-gray-900 text-white shadow-md'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        {status === 'ALL' ? 'All IPOs' : status === 'ACTIVE' ? 'Open Now' : 'Coming Soon'}
                    </button>
                ))}
            </div>

            {/* IPO Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    [1, 2, 3].map((n) => (
                        <div key={n} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 animate-pulse">
                            <div className="flex justify-between items-start mb-6">
                                <div className="h-8 bg-gray-100 rounded-lg w-16"></div>
                                <div className="h-8 bg-gray-100 rounded-full w-20"></div>
                            </div>
                            <div className="h-8 bg-gray-100 rounded-lg w-3/4 mb-4"></div>
                            <div className="space-y-3">
                                <div className="h-4 bg-gray-100 rounded w-full"></div>
                                <div className="h-4 bg-gray-100 rounded w-full"></div>
                            </div>
                        </div>
                    ))
                ) : ipos.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <span className="text-2xl">📋</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No IPOs found</h3>
                        <p className="text-gray-500">Check back later for new opportunities.</p>
                    </div>
                ) : (
                    ipos.map((ipo) => (
                        <div key={ipo.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group overflow-hidden">
                            <div className="p-8 pb-6 flex-grow">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-xl font-black text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                        {ipo.companyName.charAt(0)}
                                    </div>
                                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${getStatusBadge(ipo.status)}`}>
                                        {ipo.status}
                                    </span>
                                </div>

                                <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight group-hover:text-primary-600 transition-colors">
                                    {ipo.companyName}
                                </h3>
                                <p className="text-sm font-bold text-gray-400 mb-6 flex items-center gap-2">
                                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] tracking-wide">{ipo.symbol || 'IPO'}</span>
                                    <span>•</span>
                                    <span>{ipo.issueSize.toLocaleString()} Units</span>
                                </p>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Price</span>
                                        <span className="text-lg font-black text-gray-900">{formatCurrency(ipo.pricePerShare)}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Min Qty</span>
                                            <span className="text-sm font-bold text-gray-700">{ipo.minQuantity} Units</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Max Qty</span>
                                            <span className="text-sm font-bold text-gray-700">{ipo.maxQuantity} Units</span>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-100 pt-4 mt-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                                {ipo.status === 'UPCOMING' ? 'Opens On' :
                                                    ipo.status === 'OPEN' ? 'Closes On' : 'Closed On'}
                                            </span>
                                            <span className={`text-sm font-bold ${ipo.status === 'OPEN' ? 'text-red-500' : 'text-gray-700'
                                                }`}>
                                                {ipo.status === 'UPCOMING' ? formatDate(ipo.openDate) :
                                                    ipo.status === 'OPEN' ? formatDate(ipo.closeDate) : formatDate(ipo.closeDate)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 pt-0 mt-auto grid grid-cols-2 gap-3">
                                {isAdmin ? (
                                    // Admin buttons: Edit and Dispose
                                    <>
                                        <button
                                            onClick={() => navigate(`/ipos/edit/${ipo.id}`)}
                                            className="col-span-1 w-full py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl active:scale-95"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(ipo.id)}
                                            className="col-span-1 w-full py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-all shadow-lg hover:shadow-xl active:scale-95"
                                        >
                                            Dispose
                                        </button>
                                    </>
                                ) : (
                                    // Customer buttons: Apply or View Details
                                    ipo.status === 'OPEN' ? (
                                        <button
                                            onClick={() => navigate(`/ipo-applications/new?ipoId=${ipo.id}`)}
                                            className="col-span-2 w-full py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl active:scale-95"
                                        >
                                            Apply Now
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => navigate(`/ipos/${ipo.id}`)}
                                            className="col-span-2 w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-bold hover:bg-gray-100 hover:text-gray-600 transition-all"
                                        >
                                            View Details
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

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
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: IPOStatus) => {
        const colors = {
            UPCOMING: 'bg-blue-100 text-blue-800',
            OPEN: 'bg-green-100 text-green-800',
            CLOSED: 'bg-gray-100 text-gray-800',
            ALLOTTED: 'bg-purple-100 text-purple-800',
            LISTED: 'bg-indigo-100 text-indigo-800'
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
                <h1 className="text-2xl font-bold">IPO Listings</h1>
                {isAdmin && (
                    <button
                        onClick={() => navigate('/ipos/new')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        + Add IPO
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="flex gap-4">
                    <button
                        onClick={() => setFilter('ACTIVE')}
                        className={`px-4 py-2 rounded-lg ${filter === 'ACTIVE'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Active IPOs
                    </button>
                    <button
                        onClick={() => setFilter('UPCOMING')}
                        className={`px-4 py-2 rounded-lg ${filter === 'UPCOMING'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Upcoming
                    </button>
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`px-4 py-2 rounded-lg ${filter === 'ALL'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        All IPOs
                    </button>
                </div>
            </div>

            {/* IPO Cards */}
            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : ipos.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No IPOs found</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ipos.map((ipo) => (
                        <div key={ipo.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition flex flex-col">
                            <div className="p-6 flex-grow">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{ipo.companyName}</h3>
                                        {ipo.symbol && (
                                            <p className="text-sm text-gray-500">{ipo.symbol}</p>
                                        )}
                                    </div>
                                    <span className={`px-3 py-1 text-xs rounded-full ${getStatusBadge(ipo.status)}`}>
                                        {ipo.status}
                                    </span>
                                </div>

                                <div className="space-y-3 mb-4">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Price per Share</span>
                                        <span className="font-semibold">{formatCurrency(ipo.pricePerShare)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Issue Size</span>
                                        <span className="font-semibold">{ipo.issueSize.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Min Quantity</span>
                                        <span className="font-semibold">{ipo.minQuantity}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Max Quantity</span>
                                        <span className="font-semibold">{ipo.maxQuantity}</span>
                                    </div>
                                </div>

                                <div className="border-t pt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Open Date</span>
                                        <span>{formatDate(ipo.openDate)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Close Date</span>
                                        <span>{formatDate(ipo.closeDate)}</span>
                                    </div>
                                </div>

                                {ipo.description && (
                                    <p className="mt-4 text-sm text-gray-600 line-clamp-2">{ipo.description}</p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="p-6 pt-0 mt-auto flex gap-2">
                                {ipo.isOpen && (
                                    <button
                                        onClick={() => navigate(`/ipo-applications/new?ipoId=${ipo.id}`)}
                                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                                    >
                                        Apply Now
                                    </button>
                                )}
                                <button
                                    onClick={() => navigate(`/ipos/${ipo.id}`)}
                                    className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium"
                                >
                                    Details
                                </button>
                                {isAdmin && (
                                    <>
                                        <button
                                            onClick={() => navigate(`/ipos/${ipo.id}/edit`)}
                                            className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 font-medium"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(ipo.id)}
                                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"
                                        >
                                            Dispose
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

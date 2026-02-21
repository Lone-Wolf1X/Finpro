import { useState, useEffect } from 'react';
import { ipoApi, secondaryMarketApi } from '../../api/customerApi';
import { IPO } from '../../types';
import { DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminMarketDashboard() {
    const [ipos, setIpos] = useState<IPO[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [selectedIPO, setSelectedIPO] = useState<IPO | null>(null);

    const [actionType, setActionType] = useState<'LIST' | 'UPDATE_PRICE' | null>(null);
    const [inputPrice, setInputPrice] = useState<number>(0);

    useEffect(() => {
        loadIPOs();
    }, []);

    const loadIPOs = async () => {
        try {
            setLoading(true);
            const res = await ipoApi.getAll();
            // Filter only relevant IPOs (ALLOTTED or LISTED)
            const marketIPOs = res.data.filter(ipo =>
                ipo.status === 'ALLOTTED' || ipo.status === 'LISTED'
            );
            setIpos(marketIPOs);
        } catch (error) {
            console.error("Failed to load IPOs", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (ipo: IPO, type: 'LIST' | 'UPDATE_PRICE') => {
        setSelectedIPO(ipo);
        setActionType(type);
        setInputPrice(type === 'UPDATE_PRICE' ? (ipo.currentPrice || 0) : (ipo.pricePerShare || 0));

    };

    const getCircuitLimits = (lcp: number) => {
        return { lower: lcp * 0.9, upper: lcp * 1.1 };
    };

    const submitAction = async () => {
        if (!selectedIPO || inputPrice <= 0) return;

        try {
            setLoading(true);

            if (actionType === 'LIST') {
                await secondaryMarketApi.listIPO(selectedIPO.id, inputPrice);
                toast.success(`${selectedIPO.companyName} listed successfully @ Rs. ${inputPrice}`);
            } else if (actionType === 'UPDATE_PRICE') {
                // Client-side validation for better UX (Backend also validates)
                if (selectedIPO.lastClosingPrice) {
                    const { lower, upper } = getCircuitLimits(selectedIPO.lastClosingPrice);
                    if (inputPrice < lower || inputPrice > upper) {
                        toast.error(`Price must be within circuit limits (Rs. ${lower.toFixed(2)} - ${upper.toFixed(2)})`);
                        setLoading(false);
                        return;
                    }
                }
                await secondaryMarketApi.updatePrice(selectedIPO.id, inputPrice);
                toast.success(`Price updated for ${selectedIPO.symbol}`);
            }

            // Close Modal & Reload
            setSelectedIPO(null);
            setActionType(null);
            loadIPOs();

        } catch (error: any) {
            toast.error(error.response?.data?.message || "Action failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <TrendingUp /> Secondary Market Administration
            </h1>

            <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 font-semibold text-gray-700">Company</th>
                            <th className="px-6 py-3 font-semibold text-gray-700">Symbol</th>
                            <th className="px-6 py-3 font-semibold text-gray-700">Status</th>
                            <th className="px-6 py-3 font-semibold text-gray-700 text-right">LTP (Current)</th>
                            <th className="px-6 py-3 font-semibold text-gray-700 text-right">Last Closing</th>
                            <th className="px-6 py-3 font-semibold text-gray-700 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {ipos.map(ipo => (
                            <tr key={ipo.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium">{ipo.companyName}</td>
                                <td className="px-6 py-4 text-blue-600 font-bold">{ipo.symbol}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${ipo.status === 'LISTED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {ipo.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    Rs. {ipo.currentPrice?.toFixed(2) || '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    Rs. {ipo.lastClosingPrice?.toFixed(2) || '-'}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {ipo.status === 'ALLOTTED' ? (
                                        <button
                                            onClick={() => handleAction(ipo, 'LIST')}
                                            className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                                        >
                                            List on Market
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleAction(ipo, 'UPDATE_PRICE')}
                                            className="px-3 py-1 bg-slate-700 text-white rounded text-xs font-medium hover:bg-slate-800 flex items-center gap-1 mx-auto"
                                        >
                                            <DollarSign size={12} /> Update Price
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {ipos.length === 0 && !loading && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    No IPOs available for market actions (Must be ALLOTTED or LISTED).
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {selectedIPO && actionType && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-[400px] shadow-xl">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">
                            {actionType === 'LIST' ? `List ${selectedIPO.symbol}` : `Update Price: ${selectedIPO.symbol}`}
                        </h3>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {actionType === 'LIST' ? 'Initial Listing Price' : 'New Market Price (LTP)'}
                            </label>
                            <input
                                type="number"
                                value={inputPrice}
                                onChange={(e) => setInputPrice(parseFloat(e.target.value))}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            {actionType === 'UPDATE_PRICE' && selectedIPO.lastClosingPrice && (
                                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                    <AlertTriangle size={12} className="text-orange-500" />
                                    Circuit Limits: Rs. {(selectedIPO.lastClosingPrice * 0.9).toFixed(2)} - {(selectedIPO.lastClosingPrice * 1.1).toFixed(2)}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => { setSelectedIPO(null); setActionType(null); }}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitAction}
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

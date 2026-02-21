import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface IPO {
    id: number;
    companyName: string;
    symbol: string;
    status: string;
    totalApplications?: number;
    closeDate: string;
}

const AllotmentInitiation: React.FC = () => {
    const [ipos, setIpos] = useState<IPO[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIPO, setSelectedIPO] = useState<IPO | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    useEffect(() => {
        fetchClosedIPOs();
    }, []);

    const fetchClosedIPOs = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8080/api/ipos', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Filter only CLOSED IPOs
            const closedIPOs = response.data.filter((ipo: IPO) => ipo.status === 'CLOSED');
            setIpos(closedIPOs);
        } catch (error) {
            console.error('Error fetching IPOs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInitiateAllotment = async () => {
        if (!selectedIPO) return;

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:8080/api/ipos/${selectedIPO.id}/initiate-allotment`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert(`Allotment phase initiated for ${selectedIPO.companyName}`);
            setShowConfirmDialog(false);
            setSelectedIPO(null);
            fetchClosedIPOs();
        } catch (error: any) {
            console.error('Error initiating allotment:', error);
            alert(error.response?.data?.message || 'Failed to initiate allotment phase');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-black text-gray-900">Allotment Initiation</h1>
                    <p className="text-gray-600 mt-2">Initiate allotment phase for closed IPOs</p>
                </div>

                {loading && ipos.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading IPOs...</p>
                    </div>
                ) : ipos.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <p className="text-gray-500 text-lg">No closed IPOs available for allotment initiation</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ipos.map((ipo) => (
                            <div key={ipo.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900">{ipo.companyName}</h3>
                                        <p className="text-sm text-gray-500 mt-1">Symbol: {ipo.symbol}</p>
                                    </div>
                                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">
                                        {ipo.status}
                                    </span>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Close Date:</span>
                                        <span className="font-semibold">{new Date(ipo.closeDate).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setSelectedIPO(ipo);
                                        setShowConfirmDialog(true);
                                    }}
                                    disabled={loading}
                                    className="w-full px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Initiate Allotment Phase
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Confirmation Dialog */}
                {showConfirmDialog && selectedIPO && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
                            <h2 className="text-2xl font-black text-gray-900 mb-4">Confirm Allotment Initiation</h2>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to initiate the allotment phase for <strong>{selectedIPO.companyName}</strong>?
                            </p>
                            <p className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg mb-6">
                                ⚠️ This will change the IPO status to ALLOTMENT_PHASE and allow Makers to mark allotments.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowConfirmDialog(false);
                                        setSelectedIPO(null);
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleInitiateAllotment}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Processing...' : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AllotmentInitiation;

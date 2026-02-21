import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface AllotmentSummary {
    id: number;
    ipoId: number;
    companyName: string;
    symbol: string;
    totalApplications: number;
    totalAllotted: number;
    totalNotAllotted: number;
    totalSharesAllotted: number;
    totalAmountSettled: number;
    initiatedBy: string;
    initiatedAt: string;
    completedBy: string;
    completedAt: string;
}

const AllotmentReports: React.FC = () => {
    const [summaries, setSummaries] = useState<AllotmentSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedSummary, setSelectedSummary] = useState<AllotmentSummary | null>(null);

    useEffect(() => {
        fetchAllSummaries();
    }, []);

    const fetchAllSummaries = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8080/api/allotment/all-summaries', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSummaries(response.data);
        } catch (error) {
            console.error('Error fetching summaries:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateAllotmentRate = (summary: AllotmentSummary) => {
        if (summary.totalApplications === 0) return 0;
        return ((summary.totalAllotted / summary.totalApplications) * 100).toFixed(2);
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-black text-gray-900">Allotment Reports</h1>
                    <p className="text-gray-600 mt-2">View comprehensive allotment statistics and summaries</p>
                </div>

                {loading && summaries.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading reports...</p>
                    </div>
                ) : summaries.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <p className="text-gray-500 text-lg">No allotment reports available</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {summaries.map((summary) => (
                            <div key={summary.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all">
                                <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-2xl font-black text-white">{summary.companyName}</h2>
                                            <p className="text-purple-100 text-sm">Symbol: {summary.symbol}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-purple-100 text-sm">Allotment Rate</p>
                                            <p className="text-3xl font-black text-white">{calculateAllotmentRate(summary)}%</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    {/* Statistics Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                        <div className="bg-blue-50 rounded-lg p-4">
                                            <p className="text-xs text-blue-600 font-bold mb-1">Total Applications</p>
                                            <p className="text-2xl font-black text-blue-900">{summary.totalApplications}</p>
                                        </div>
                                        <div className="bg-green-50 rounded-lg p-4">
                                            <p className="text-xs text-green-600 font-bold mb-1">Allotted</p>
                                            <p className="text-2xl font-black text-green-900">{summary.totalAllotted}</p>
                                        </div>
                                        <div className="bg-red-50 rounded-lg p-4">
                                            <p className="text-xs text-red-600 font-bold mb-1">Not Allotted</p>
                                            <p className="text-2xl font-black text-red-900">{summary.totalNotAllotted}</p>
                                        </div>
                                        <div className="bg-purple-50 rounded-lg p-4">
                                            <p className="text-xs text-purple-600 font-bold mb-1">Total Shares</p>
                                            <p className="text-2xl font-black text-purple-900">{summary.totalSharesAllotted.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {/* Amount Settled */}
                                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 mb-6">
                                        <p className="text-sm text-gray-700 font-bold mb-1">Total Amount Settled</p>
                                        <p className="text-3xl font-black text-gray-900">रू {summary.totalAmountSettled.toLocaleString()}</p>
                                    </div>

                                    {/* Workflow Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-600 mb-1">Initiated By</p>
                                            <p className="font-bold text-gray-900">{summary.initiatedBy || 'N/A'}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {summary.initiatedAt ? new Date(summary.initiatedAt).toLocaleString() : 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600 mb-1">Completed By</p>
                                            <p className="font-bold text-gray-900">{summary.completedBy || 'N/A'}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {summary.completedAt ? new Date(summary.completedAt).toLocaleString() : 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="mt-6">
                                        <button
                                            onClick={() => setSelectedSummary(summary)}
                                            className="w-full px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-all"
                                        >
                                            View Detailed Report
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Detail Modal */}
                {selectedSummary && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                                <h2 className="text-2xl font-black text-white">{selectedSummary.companyName} - Detailed Report</h2>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="font-bold text-gray-700">Symbol:</span>
                                        <span className="text-gray-900">{selectedSummary.symbol}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="font-bold text-gray-700">Total Applications:</span>
                                        <span className="text-gray-900">{selectedSummary.totalApplications}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="font-bold text-gray-700">Allotted:</span>
                                        <span className="text-green-600 font-bold">{selectedSummary.totalAllotted}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="font-bold text-gray-700">Not Allotted:</span>
                                        <span className="text-red-600 font-bold">{selectedSummary.totalNotAllotted}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="font-bold text-gray-700">Total Shares Allotted:</span>
                                        <span className="text-gray-900">{selectedSummary.totalSharesAllotted.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="font-bold text-gray-700">Total Amount Settled:</span>
                                        <span className="text-gray-900 font-bold">रू {selectedSummary.totalAmountSettled.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="font-bold text-gray-700">Allotment Rate:</span>
                                        <span className="text-purple-600 font-bold">{calculateAllotmentRate(selectedSummary)}%</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedSummary(null)}
                                    className="w-full mt-6 px-4 py-2 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AllotmentReports;

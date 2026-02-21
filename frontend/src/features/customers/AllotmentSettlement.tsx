import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface IPO {
    id: number;
    companyName: string;
    symbol: string;
    pricePerShare: number;
}

interface Application {
    id: number;
    applicationNumber: string;
    customerId: number;
    customerName: string;
    quantity: number;
    amount: number;
    bankAccountNumber: string;
}

interface AllotmentDecision {
    applicationId: number;
    isAllotted: boolean;
    quantity: number;
}

const AllotmentSettlement: React.FC = () => {
    const [ipos, setIpos] = useState<IPO[]>([]);
    const [selectedIPO, setSelectedIPO] = useState<IPO | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [decisions, setDecisions] = useState<Map<number, AllotmentDecision>>(new Map());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchIPOsInAllotmentPhase();
    }, []);

    useEffect(() => {
        if (selectedIPO) {
            fetchApplications(selectedIPO.id);
        }
    }, [selectedIPO]);

    const fetchIPOsInAllotmentPhase = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8080/api/allotment/ipos-in-allotment-phase', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIpos(response.data);
        } catch (error) {
            console.error('Error fetching IPOs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchApplications = async (ipoId: number) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:8080/api/allotment/${ipoId}/applications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setApplications(response.data);

            // Initialize decisions map
            const initialDecisions = new Map<number, AllotmentDecision>();
            response.data.forEach((app: Application) => {
                initialDecisions.set(app.id, {
                    applicationId: app.id,
                    isAllotted: false,
                    quantity: 0
                });
            });
            setDecisions(initialDecisions);
        } catch (error) {
            console.error('Error fetching applications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAllotment = (applicationId: number, isAllotted: boolean, quantity: number) => {
        const newDecisions = new Map(decisions);
        newDecisions.set(applicationId, {
            applicationId,
            isAllotted,
            quantity: isAllotted ? quantity : 0
        });
        setDecisions(newDecisions);
    };

    const handleSelectAll = (allot: boolean) => {
        const newDecisions = new Map<number, AllotmentDecision>();
        applications.forEach((app) => {
            newDecisions.set(app.id, {
                applicationId: app.id,
                isAllotted: allot,
                quantity: allot ? app.quantity : 0
            });
        });
        setDecisions(newDecisions);
    };

    const handleSubmit = async () => {
        if (!selectedIPO) {
            alert('Please select an IPO');
            return;
        }

        const items = Array.from(decisions.values());

        if (items.length === 0) {
            alert('No decisions to submit');
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            await axios.post(
                'http://localhost:8080/api/allotment/submit',
                {
                    ipoId: selectedIPO.id,
                    items: items
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert('Allotment decisions submitted successfully for Checker verification!');
            setSelectedIPO(null);
            setApplications([]);
            setDecisions(new Map());
            fetchIPOsInAllotmentPhase();
        } catch (error: any) {
            console.error('Error submitting allotment:', error);
            alert(error.response?.data?.message || 'Failed to submit allotment decisions');
        } finally {
            setLoading(false);
        }
    };

    const getStats = () => {
        const allotted = Array.from(decisions.values()).filter(d => d.isAllotted).length;
        const notAllotted = decisions.size - allotted;
        const totalShares = Array.from(decisions.values())
            .filter(d => d.isAllotted)
            .reduce((sum, d) => sum + d.quantity, 0);

        return { allotted, notAllotted, totalShares };
    };

    const stats = getStats();

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-black text-gray-900">Allotment Settlement</h1>
                    <p className="text-gray-600 mt-2">Mark allotment decisions for IPO applications</p>
                </div>

                {/* IPO Selection */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Select IPO</label>
                    <select
                        value={selectedIPO?.id || ''}
                        onChange={(e) => {
                            const ipo = ipos.find(i => i.id === Number(e.target.value));
                            setSelectedIPO(ipo || null);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold"
                    >
                        <option value="">-- Select IPO --</option>
                        {ipos.map((ipo) => (
                            <option key={ipo.id} value={ipo.id}>
                                {ipo.companyName} ({ipo.symbol}) - रू {ipo.pricePerShare}/share
                            </option>
                        ))}
                    </select>
                </div>

                {/* Statistics Cards */}
                {selectedIPO && applications.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 rounded-lg p-4">
                            <p className="text-xs text-blue-600 font-bold mb-1">Total Applications</p>
                            <p className="text-3xl font-black text-blue-900">{applications.length}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                            <p className="text-xs text-green-600 font-bold mb-1">Marked Allotted</p>
                            <p className="text-3xl font-black text-green-900">{stats.allotted}</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-4">
                            <p className="text-xs text-red-600 font-bold mb-1">Marked Not Allotted</p>
                            <p className="text-3xl font-black text-red-900">{stats.notAllotted}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4">
                            <p className="text-xs text-purple-600 font-bold mb-1">Total Shares</p>
                            <p className="text-3xl font-black text-purple-900">{stats.totalShares}</p>
                        </div>
                    </div>
                )}

                {/* Applications Table */}
                {selectedIPO && applications.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-black text-white">Applications for {selectedIPO.companyName}</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleSelectAll(true)}
                                    className="px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-lg hover:bg-green-600 transition-all"
                                >
                                    Allot All
                                </button>
                                <button
                                    onClick={() => handleSelectAll(false)}
                                    className="px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-lg hover:bg-red-600 transition-all"
                                >
                                    Reject All
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-black text-gray-700 uppercase">Customer Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-black text-gray-700 uppercase">App #</th>
                                        <th className="px-4 py-3 text-right text-xs font-black text-gray-700 uppercase">Quantity</th>
                                        <th className="px-4 py-3 text-right text-xs font-black text-gray-700 uppercase">Amount</th>
                                        <th className="px-4 py-3 text-left text-xs font-black text-gray-700 uppercase">Bank Account</th>
                                        <th className="px-4 py-3 text-center text-xs font-black text-gray-700 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {applications.map((app) => {
                                        const decision = decisions.get(app.id);
                                        return (
                                            <tr key={app.id} className={`hover:bg-gray-50 ${decision?.isAllotted ? 'bg-green-50' : decision?.isAllotted === false && decisions.has(app.id) ? 'bg-red-50' : ''}`}>
                                                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{app.customerName}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{app.applicationNumber}</td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-900">{app.quantity}</td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-900">रू {app.amount.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{app.bankAccountNumber}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex gap-2 justify-center">
                                                        <button
                                                            onClick={() => handleMarkAllotment(app.id, true, app.quantity)}
                                                            className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${decision?.isAllotted
                                                                ? 'bg-green-600 text-white'
                                                                : 'bg-green-50 text-green-700 hover:bg-green-600 hover:text-white'
                                                                }`}
                                                        >
                                                            ALLOT
                                                        </button>
                                                        <button
                                                            onClick={() => handleMarkAllotment(app.id, false, 0)}
                                                            className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${decision?.isAllotted === false
                                                                ? 'bg-red-600 text-white'
                                                                : 'bg-red-50 text-red-700 hover:bg-red-600 hover:text-white'
                                                                }`}
                                                        >
                                                            REJECT
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 flex justify-end">
                            <button
                                onClick={handleSubmit}
                                disabled={loading || decisions.size === 0}
                                className="px-6 py-3 bg-blue-600 text-white font-black rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Submitting...' : 'Submit for Verification'}
                            </button>
                        </div>
                    </div>
                )}

                {selectedIPO && applications.length === 0 && !loading && (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <p className="text-gray-500 text-lg">No approved applications found for this IPO</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AllotmentSettlement;

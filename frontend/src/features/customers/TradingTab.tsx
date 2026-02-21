import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { ipoApi, portfolioApi, secondaryMarketApi, transactionVerificationApi } from '../../api/customerApi';

import { IPO, CustomerPortfolio } from '../../types';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface TradingTabProps {
    customerId?: number;
}

export default function TradingTab({ customerId }: TradingTabProps = {}) {
    const { user } = useSelector((state: RootState) => state.auth);
    const [mode, setMode] = useState<'BUY' | 'SELL' | 'CREDIT' | 'DEBIT'>('BUY');
    const [loading, setLoading] = useState(false);

    // Data
    const [activeIPOs, setActiveIPOs] = useState<IPO[]>([]);
    const [portfolio, setPortfolio] = useState<CustomerPortfolio[]>([]);

    // Form State
    const [selectedSymbol, setSelectedSymbol] = useState('');
    const [quantity, setQuantity] = useState<string>('');
    const [price, setPrice] = useState<number>(0);

    const [holdingPeriod, setHoldingPeriod] = useState<'SHORT_TERM' | 'LONG_TERM'>('SHORT_TERM');

    // Selected Item Details
    const [selectedIPO, setSelectedIPO] = useState<IPO | null>(null);
    const [selectedHolding, setSelectedHolding] = useState<CustomerPortfolio | null>(null);

    useEffect(() => {
        if (user?.id) {
            loadMarketData();
            loadPortfolio();
        }
    }, [user, customerId]);

    const loadMarketData = async () => {
        try {
            const res = await ipoApi.getAll({ status: 'LISTED' });
            setActiveIPOs(res.data);
        } catch (error) {
            console.error("Failed to load market data", error);
        }
    };

    const loadPortfolio = async () => {
        try {
            setLoading(true);
            const targetId = customerId || user?.id;
            if (targetId) {
                const res = await portfolioApi.getByCustomerId(targetId);
                setPortfolio(res.data);
            }
        } catch (error) {
            console.error("Failed to load portfolio", error);
        } finally {
            setLoading(false);
        }
    };

    // Fees Calculation Logic
    const calculateFees = (qty: number, prc: number, isSell: boolean) => {
        const amount = qty * prc;
        if (amount <= 0) return { commission: 0, sebon: 0, dp: 0, cgt: 0, total: 0, net: 0, totalPayable: 0, totalReceivable: 0 };

        let commission = 0;
        if (amount <= 2500) {
            commission = 10;
        } else if (amount <= 50000) {
            commission = amount * 0.0036;
        } else if (amount <= 500000) {
            commission = amount * 0.0033;
        } else if (amount <= 2000000) {
            commission = amount * 0.0031;
        } else if (amount <= 10000000) {
            commission = amount * 0.0027;
        } else {
            commission = amount * 0.0024;
        }

        if (commission < 10) commission = 10;

        const sebon = amount * 0.00015;
        const dp = 25;

        let cgt = 0;
        if (isSell && selectedHolding) {
            const sellFees = commission + sebon + dp;
            const netRealizable = amount - sellFees;

            // WACC Cost Basis (Total Cost / Quantity) * Sell Qty
            const purchaseCost = (selectedHolding.totalCost / selectedHolding.quantity) * qty;
            const profit = netRealizable - purchaseCost;

            if (profit > 0) {
                const rate = holdingPeriod === 'LONG_TERM' ? 0.05 : 0.075;
                cgt = profit * rate;
            }
        }

        const total = commission + sebon + dp + cgt;

        const totalPayable = amount + total; // For Buy (fees added)
        const totalReceivable = amount - total; // For Sell (fees deducted)

        return { commission, sebon, dp, cgt, total, totalPayable, totalReceivable };
    };

    const fees = calculateFees(parseInt(quantity) || 0, price, mode === 'SELL');

    // Handle Symbol Selection
    useEffect(() => {
        if (mode === 'BUY' && selectedSymbol) {
            const ipo = activeIPOs.find(i => i.symbol === selectedSymbol);
            setSelectedIPO(ipo || null);
            if (ipo && ipo.currentPrice) setPrice(ipo.currentPrice);
        } else if (mode === 'SELL' && selectedSymbol) {
            const holding = portfolio.find(p => p.scripSymbol === selectedSymbol);
            setSelectedHolding(holding || null);
            if (holding) setPrice(holding.currentPrice || holding.purchasePrice);

            // Auto-detect holding period if possible (holdingSince)
            if (holding && holding.holdingSince) {
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                const holdingDate = new Date(holding.holdingSince);
                setHoldingPeriod(holdingDate < oneYearAgo ? 'LONG_TERM' : 'SHORT_TERM');
            }
        } else {
            setSelectedIPO(null);
            setSelectedHolding(null);
            setPrice(0);
        }
    }, [selectedSymbol, mode, activeIPOs, portfolio]);

    // Circuit Breaker Calculation
    const getCircuitLimits = (lastClosingPrice: number) => {
        const lower = lastClosingPrice * 0.90;
        const upper = lastClosingPrice * 1.10;
        return { lower, upper };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const qtyNum = parseInt(quantity);

        try {
            // Validation
            let lcp = 0;
            if (mode === 'BUY' && selectedIPO) {
                lcp = selectedIPO.lastClosingPrice || selectedIPO.currentPrice || selectedIPO.pricePerShare;
            } else if (mode === 'SELL' && selectedHolding) {
                lcp = selectedHolding.lastClosingPrice || selectedHolding.currentPrice || selectedHolding.purchasePrice;
            }

            if (lcp > 0) {
                const { lower, upper } = getCircuitLimits(lcp);
                if (price < lower || price > upper) {
                    toast.error(`Price must be within 10% circuit limits (Rs. ${lower.toFixed(2)} - Rs. ${upper.toFixed(2)})`);
                    setLoading(false);
                    return;
                }
            }

            const targetId = customerId || user!.id;

            if (mode === 'BUY') {
                if (customerId) {
                    await secondaryMarketApi.buyOnBehalf(targetId, selectedSymbol, qtyNum, price);
                } else {
                    await secondaryMarketApi.buy(selectedSymbol, qtyNum, price);
                }
                toast.success(`Buy order placed for ${qtyNum} shares of ${selectedSymbol}`);
            } else if (mode === 'SELL') {
                if (!selectedHolding) return;
                if (customerId) {
                    await secondaryMarketApi.sellOnBehalf(targetId, selectedHolding.id, qtyNum, price);
                } else {
                    await secondaryMarketApi.sell(selectedHolding.id, qtyNum, price);
                }
                toast.success(`Sell order placed for ${qtyNum} shares of ${selectedSymbol}`);
            }

            loadPortfolio();
            loadMarketData();
            setQuantity('');

        } catch (error: any) {
            toast.error(error.response?.data?.message || "Transaction failed");
        } finally {
            setLoading(false);
        }
    };

    const currentLCP = (mode === 'BUY')
        ? (selectedIPO?.lastClosingPrice || selectedIPO?.currentPrice || 0)
        : (selectedHolding?.lastClosingPrice || selectedHolding?.currentPrice || 0);

    const { lower: lowerLimit, upper: upperLimit } = getCircuitLimits(currentLCP);

    const [activeTab, setActiveTab] = useState<'TRADE' | 'ORDERS'>('TRADE');
    const [orders, setOrders] = useState<any[]>([]);

    useEffect(() => {
        if (activeTab === 'ORDERS' && (user?.id || customerId)) {
            loadOrders();
        }
    }, [activeTab, user, customerId]);

    const loadOrders = async () => {
        try {
            const targetId = customerId || user?.id;
            if (targetId) {
                // We need to implement getByCustomerId in transactionVerificationApi
                // Assuming it's added or we use a different endpoint.
                // For now, let's use the one we just added.
                const res = await transactionVerificationApi.getByCustomerId(targetId);
                setOrders(res.data);
            }
        } catch (error) {
            console.error("Failed to load orders", error);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-600" />
                    Trade Shares
                </h2>
                <div className="flex bg-gray-50 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('TRADE')}
                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'TRADE' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        New Order
                    </button>
                    <button
                        onClick={() => setActiveTab('ORDERS')}
                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'ORDERS' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Order Status
                    </button>
                </div>
            </div>

            {activeTab === 'TRADE' ? (
                <>
                    {/* Mode Switch */}
                    <div className="flex bg-gray-50 p-1.5 rounded-xl mb-6 w-fit border border-gray-100">
                        <button
                            onClick={() => { setMode('BUY'); setSelectedSymbol(''); }}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'BUY' ? 'bg-green-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Buy
                        </button>
                        <button
                            onClick={() => { setMode('SELL'); setSelectedSymbol(''); }}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'SELL' ? 'bg-red-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Sell
                        </button>
                    </div>


                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Select Scrip</label>
                                <select
                                    value={selectedSymbol}
                                    onChange={(e) => setSelectedSymbol(e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-bold text-gray-700"
                                    required
                                >
                                    <option value="">-- Select Symbol --</option>
                                    {(mode === 'BUY' || mode === 'CREDIT') ? (
                                        activeIPOs.map(ipo => (
                                            <option key={ipo.id} value={ipo.symbol}>
                                                {ipo.symbol} - {ipo.companyName}
                                            </option>
                                        ))
                                    ) : (
                                        portfolio.filter(p => p.status !== 'SOLD').map(p => (
                                            <option key={p.id} value={p.scripSymbol}>
                                                {p.scripSymbol} ({p.quantity} shares)
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>

                            {(selectedIPO || selectedHolding) && (
                                <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 text-sm space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-blue-600 font-bold">Last Closing Price (LCP):</span>
                                        <span className="font-black text-blue-900 font-mono">रू {currentLCP.toFixed(2)}</span>
                                    </div>
                                    {(mode === 'BUY' || mode === 'SELL') && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-blue-600 font-bold">Circuit Limits (±10%):</span>
                                            <span className="font-extrabold text-blue-700 font-mono">
                                                {lowerLimit.toFixed(2)} - {upperLimit.toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                    {(mode === 'SELL' || mode === 'DEBIT') && selectedHolding && (
                                        <>
                                            <div className="flex justify-between items-center pt-2 border-t border-blue-100">
                                                <span className="text-blue-600 font-bold">Available Quantity:</span>
                                                <span className="font-black text-blue-900">{selectedHolding.quantity}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-blue-600 font-bold">WACC:</span>
                                                <span className="font-black text-blue-900">Rs. {(selectedHolding.totalCost / selectedHolding.quantity).toFixed(2)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            {/* Holding Period Selector for Sell */}
                            {mode === 'SELL' && (
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Holding Period</label>
                                    <select
                                        value={holdingPeriod}
                                        onChange={(e) => setHoldingPeriod(e.target.value as any)}
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-bold text-gray-700"
                                    >
                                        <option value="SHORT_TERM">Less Than 1 Year [7.5%]</option>
                                        <option value="LONG_TERM">More Than 1 Year [5%]</option>
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Quantity</label>
                                <input
                                    type="number"
                                    min="1"
                                    max={(mode === 'SELL') && selectedHolding ? selectedHolding.quantity : undefined}
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-bold text-gray-700"
                                    required
                                    placeholder="Enter quantity"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Price (Rs.)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={price}
                                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                                    className={`w-full p-3 border rounded-xl focus:ring-2 bg-white font-bold text-gray-700 ${(price > 0 && (price < lowerLimit || price > upperLimit))
                                        ? 'border-red-300 focus:ring-red-500 bg-red-50'
                                        : 'border-gray-200 focus:ring-blue-500'
                                        }`}
                                    required
                                />
                                {(price > 0 && (price < lowerLimit || price > upperLimit)) && (
                                    <p className="text-[10px] text-red-600 mt-2 font-black uppercase tracking-tighter flex items-center gap-1">
                                        <AlertCircle size={14} /> Price outside circuit limits!
                                    </p>
                                )}
                            </div>

                            {/* Fees Breakdown */}
                            {(parseInt(quantity) > 0 && price > 0) && (
                                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 text-xs space-y-2">
                                    <h3 className="font-black text-gray-400 uppercase tracking-widest mb-2">Estimated Fees</h3>
                                    <div className="flex justify-between items-center text-gray-600">
                                        <span>Total Amount</span>
                                        <span className="font-bold">Rs. {(parseInt(quantity) * price).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-600">
                                        <span>* Commission</span>
                                        <span className="font-bold">Rs. {fees.commission.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-600">
                                        <span>SEBON FEE</span>
                                        <span className="font-bold">Rs. {fees.sebon.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-600">
                                        <span>DP Charge</span>
                                        <span className="font-bold">Rs. {fees.dp.toFixed(2)}</span>
                                    </div>
                                    {mode === 'SELL' && (
                                        <div className="flex justify-between items-center text-gray-600">
                                            <span>Capital Gain Tax ({holdingPeriod === 'LONG_TERM' ? '5%' : '7.5%'})</span>
                                            <span className="font-bold">Rs. {fees.cgt.toFixed(2)}</span>
                                        </div>
                                    )}

                                    <div className={`flex justify-between items-center pt-2 border-t border-gray-200 font-extrabold text-sm ${mode === 'BUY' ? 'text-red-600' : 'text-green-600'}`}>
                                        <span>Total Amount {mode === 'BUY' ? 'Payable' : 'Receivable'}</span>
                                        <span className="font-mono">
                                            Rs. {(mode === 'BUY' ? fees.totalPayable : fees.totalReceivable).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-2 italic">
                                        * Commission includes NEPSE Commission & SEBON Regularity Fee logic if applicable.
                                    </div>
                                </div>
                            )}

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading || !selectedSymbol || !quantity || parseInt(quantity) <= 0 || price <= 0 || (price < lowerLimit || price > upperLimit)}
                                    className={`w-full py-4 rounded-2xl font-black text-white shadow-lg transition-all active:scale-95 ${loading || !selectedSymbol || !quantity || parseInt(quantity) <= 0 || price <= 0 || (price < lowerLimit || price > upperLimit)
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : mode === 'BUY'
                                            ? 'bg-green-600 hover:bg-green-700 shadow-green-100'
                                            : 'bg-red-600 hover:bg-red-700 shadow-red-100'
                                        }`}
                                >
                                    {loading ? 'Processing...' : `Place ${mode === 'BUY' ? 'Buy' : 'Sell'} Order`}
                                </button>
                            </div>
                        </div>
                    </form>
                </>
            ) : (
                <div className="space-y-4">
                    {orders.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 italic">No orders found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Details</th>
                                        <th className="px-4 py-3 text-center">Amount</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50/50 transition-all text-xs font-medium">
                                            <td className="px-4 py-3 text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 font-bold text-gray-700">{order.transactionType}</td>
                                            <td className="px-4 py-3 text-gray-600">{order.description}</td>
                                            <td className="px-4 py-3 text-center font-mono">Rs. {order.amount.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${order.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                    order.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

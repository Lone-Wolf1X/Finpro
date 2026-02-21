import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { portfolioApi } from '../../api/customerApi';
import { CustomerPortfolio } from '../../types';
import { FileText, Printer, FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-react';

import TradingTab from './TradingTab';
import TransactionHistory from './TransactionHistory';

export default function PortfolioList() {
    const { user } = useSelector((state: RootState) => state.auth);
    const [portfolio, setPortfolio] = useState<CustomerPortfolio[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'HOLDINGS' | 'TRADING' | 'TRANSACTIONS'>('HOLDINGS');

    useEffect(() => {
        if (user?.id && activeTab === 'HOLDINGS') {
            loadPortfolio();
        }
    }, [user, activeTab]);

    const loadPortfolio = async () => {
        try {
            setLoading(true);
            const { customerApi } = await import('../../api/customerApi');
            const customersRes = await customerApi.getAll();
            const myCustomer = customersRes.data.find(c => c.email === user?.email);

            if (myCustomer) {
                const res = await portfolioApi.getByCustomerId(myCustomer.id);
                setPortfolio(res.data);
            } else {
                try {
                    const res = await portfolioApi.getByCustomerId(user?.id || 0);
                    setPortfolio(res.data);
                } catch (e) {
                    // ignore
                }
            }

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
    };

    const totalValue = portfolio.reduce((sum, item) => sum + (item.currentValue || 0), 0);

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">My Portfolio</h1>
                    <p className="text-sm text-gray-500">View Portfolio & Trade</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Tab Switcher */}
                    <div className="bg-white border border-gray-300 rounded-md overflow-hidden flex shadow-sm mr-4">
                        <button
                            onClick={() => setActiveTab('HOLDINGS')}
                            className={`px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === 'HOLDINGS' ? 'bg-slate-800 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            My Holdings
                        </button>
                        <button
                            onClick={() => setActiveTab('TRADING')}
                            className={`px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === 'TRADING' ? 'bg-slate-800 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Trade (Buy/Sell)
                        </button>
                        <button
                            onClick={() => setActiveTab('TRANSACTIONS')}
                            className={`px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === 'TRANSACTIONS' ? 'bg-slate-800 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            My Transactions
                        </button>
                    </div>

                    <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-600 hover:bg-gray-50 uppercase shadow-sm">
                        <FileText size={14} /> PDF
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-600 hover:bg-gray-50 uppercase shadow-sm">
                        <FileSpreadsheet size={14} /> CSV
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-600 hover:bg-gray-50 uppercase shadow-sm">
                        <Printer size={14} /> Print
                    </button>
                </div>
            </div>

            {/* Content */}
            {activeTab === 'TRADING' ? (
                <TradingTab />
            ) : activeTab === 'TRANSACTIONS' ? (
                <TransactionHistory />
            ) : (
                <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-gray-500 text-sm">Loading portfolio data...</div>
                    ) : portfolio.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 text-sm">No holdings found in your portfolio.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50/50">
                                        <th className="px-4 py-3 font-bold text-gray-600 w-12 text-center">#</th>
                                        <th className="px-4 py-3 font-bold text-gray-600">Scrip</th>
                                        <th className="px-4 py-3 font-bold text-gray-600 text-right">Current Balance</th>
                                        <th className="px-4 py-3 font-bold text-gray-600 text-right">Last Closing Price</th>
                                        <th className="px-4 py-3 font-bold text-gray-600 text-right">Value As Of Last Closing Price</th>
                                        <th className="px-4 py-3 font-bold text-gray-600 text-right">Last Transaction Price(LTP)</th>
                                        <th className="px-4 py-3 font-bold text-gray-600 text-right">Value As Of LTP</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {portfolio.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-center text-gray-500 font-medium">{index + 1}</td>
                                            <td className="px-4 py-3 font-medium text-gray-800">{item.scripSymbol}</td>
                                            <td className="px-4 py-3 text-right text-gray-700">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(item.lastClosingPrice || 0)}</td>
                                            <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(item.valueAsOfLastClosingPrice || 0)}</td>
                                            <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(item.currentPrice || item.purchasePrice)}</td>
                                            <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(item.currentValue || 0)}</td>
                                        </tr>
                                    ))}
                                    {/* Total Row */}
                                    <tr className="bg-gray-50 font-bold border-t border-gray-200">
                                        <td colSpan={2} className="px-4 py-3 text-gray-800">Total:</td>
                                        <td colSpan={4}></td>
                                        <td className="px-4 py-3 text-right text-gray-800">Rs.{formatCurrency(totalValue)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination (Visual Only) */}
                    <div className="bg-gray-50 p-4 border-t border-gray-200 flex items-center gap-2">
                        <button className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all disabled:opacity-50">
                            <ChevronLeft size={14} />
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded bg-slate-800 text-white font-medium text-xs shadow-sm">
                            1
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all disabled:opacity-50">
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

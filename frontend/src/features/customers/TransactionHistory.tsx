import React, { useEffect, useState } from 'react';
import { PortfolioTransaction } from '../../types';
import { portfolioApi } from '../../api/customerApi';
import { Loader2, ArrowUpRight, ArrowDownLeft, RefreshCcw } from 'lucide-react';

const TransactionHistory = () => {
    const [transactions, setTransactions] = useState<PortfolioTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await portfolioApi.getTransactions();
            setTransactions(response.data);
        } catch (err: any) {
            console.error("Failed to fetch transactions:", err);
            setError("Failed to load transaction history.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'BUY':
                return <ArrowDownLeft className="w-5 h-5 text-red-500" />;
            case 'SELL':
                return <ArrowUpRight className="w-5 h-5 text-green-500" />;
            case 'ALLOTMENT':
            case 'BONUS':
                return <RefreshCcw className="w-5 h-5 text-blue-500" />;
            default:
                return <div className="w-5 h-5 bg-gray-200 rounded-full" />;
        }
    };

    const getTransactionColor = (type: string) => {
        switch (type) {
            case 'BUY':
                return 'text-red-600 bg-red-50';
            case 'SELL':
                return 'text-green-600 bg-green-50';
            case 'ALLOTMENT':
                return 'text-blue-600 bg-blue-50';
            case 'BONUS':
                return 'text-purple-600 bg-purple-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                {error}
                <button
                    onClick={fetchTransactions}
                    className="ml-4 text-sm underline hover:text-red-800"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
                <button
                    onClick={fetchTransactions}
                    className="p-2 hover:bg-gray-100 rounded-full transition"
                    title="Refresh"
                >
                    <RefreshCcw className="w-4 h-4 text-gray-500" />
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Details</th>
                            <th className="px-6 py-3 text-right">Quantity</th>
                            <th className="px-6 py-3 text-right">Price</th>
                            <th className="px-6 py-3 text-right">Total Amount</th>
                            <th className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {transactions.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    No transactions found.
                                </td>
                            </tr>
                        ) : (
                            transactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(tx.transactionDate).toLocaleDateString()}
                                        <div className="text-xs text-gray-400">
                                            {new Date(tx.transactionDate).toLocaleTimeString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className={`p-2 rounded-lg mr-3 ${getTransactionColor(tx.transactionType)}`}>
                                                {getTransactionIcon(tx.transactionType)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{tx.scripSymbol}</div>
                                                <div className="text-xs text-gray-500">{tx.remarks}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                                        {tx.quantity}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                        ₹{tx.pricePerShare.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                                        ₹{tx.totalAmount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTransactionColor(tx.transactionType)}`}>
                                            {tx.transactionType}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TransactionHistory;

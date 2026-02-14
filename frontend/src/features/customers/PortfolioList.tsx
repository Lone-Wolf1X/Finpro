import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { RootState } from '../../store/store';
import { portfolioApi, secondaryMarketApi, customerApi } from '../../api/customerApi';
import { CustomerPortfolio } from '../../types';
import { Briefcase, RefreshCw } from 'lucide-react';

export default function PortfolioList() {
    const { user } = useSelector((state: RootState) => state.auth);
    const [portfolio, setPortfolio] = useState<CustomerPortfolio[]>([]);
    const [loading, setLoading] = useState(true);
    const [sellingItem, setSellingItem] = useState<CustomerPortfolio | null>(null);
    const [sellQuantity, setSellQuantity] = useState<number>(0);
    const [sellPrice, setSellPrice] = useState<number>(0);

    useEffect(() => {
        if (user?.id) {
            loadPortfolio();
        }
    }, [user]);

    const loadPortfolio = async () => {
        try {
            setLoading(true);
            // Re-importing customerApi to be sure
            const { customerApi } = await import('../../api/customerApi');
            const customersRes = await customerApi.getAll();
            const myCustomer = customersRes.data.find(c => c.email === user?.email);

            if (myCustomer) {
                const res = await portfolioApi.getByCustomerId(myCustomer.id);
                setPortfolio(res.data);
            } else {
                // Try finding by ID if they are same (dev env)
                try {
                    const res = await portfolioApi.getByCustomerId(user?.id || 0);
                    setPortfolio(res.data);
                } catch (e) {
                    // ignore
                }
            }

        } catch (error) {
            console.error(error);
            // toast.error('Failed to load portfolio');
        } finally {
            setLoading(false);
        }
    };

    const handleSell = async () => {
        if (!sellingItem) return;
        if (sellQuantity <= 0 || sellQuantity > sellingItem.quantity) {
            toast.error('Invalid quantity');
            return;
        }
        if (sellPrice <= 0) {
            toast.error('Invalid price');
            return;
        }

        try {
            await secondaryMarketApi.sell(sellingItem.id, sellQuantity, sellPrice);
            toast.success('Sell order executed successfully!');
            setSellingItem(null);
            loadPortfolio();
        } catch (error) {
            toast.error('Failed to sell shares');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR' }).format(amount);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">My Portfolio</h1>
                    <p className="text-gray-500 font-medium">Manage your holdings and investments</p>
                </div>
                <button onClick={loadPortfolio} className="p-3 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stats Card (Optional) */}
                <div className="lg:col-span-3 bg-gray-900 text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
                    <div className="bg-gradient-to-r from-primary-500/20 to-purple-500/20 absolute inset-0"></div>
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                            <Briefcase size={32} className="text-primary-300" />
                        </div>
                        <div>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Total Investment</p>
                            <h2 className="text-4xl font-black mt-1">
                                {formatCurrency(portfolio.reduce((sum, item) => sum + item.totalCost, 0))}
                            </h2>
                        </div>
                    </div>
                </div>

                {/* Portfolio Items */}
                <div className="lg:col-span-3">
                    {loading ? (
                        <div className="text-center py-12">Loading...</div>
                    ) : portfolio.length === 0 ? (
                        <div className="bg-white p-12 rounded-3xl text-center border border-gray-100 border-dashed">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Briefcase className="text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">No Holdings Found</h3>
                            <p className="text-gray-500">Apply for IPOs or buy shares from the secondary market.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <th className="px-8 py-4">Script</th>
                                        <th className="px-8 py-4 text-center">Quantity</th>
                                        <th className="px-8 py-4 text-center">Avg. Price</th>
                                        <th className="px-8 py-4 text-center">Total Cost</th>
                                        <th className="px-8 py-4 text-center">Status</th>
                                        <th className="px-8 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {portfolio.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50 transition-all">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-bold text-gray-500">
                                                        {item.scripSymbol.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800">{item.scripSymbol}</p>
                                                        <p className="text-xs text-gray-400 font-medium">{item.ipoCompanyName || 'Secondary Market'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center font-bold text-gray-700">{item.quantity}</td>
                                            <td className="px-8 py-5 text-center font-mono text-gray-600">{formatCurrency(item.purchasePrice)}</td>
                                            <td className="px-8 py-5 text-center font-mono font-bold text-gray-800">{formatCurrency(item.totalCost)}</td>
                                            <td className="px-8 py-5 text-center">
                                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button
                                                    onClick={() => {
                                                        setSellingItem(item);
                                                        setSellQuantity(item.quantity);
                                                        setSellPrice(item.purchasePrice * 1.1); // suggest 10% profit
                                                    }}
                                                    className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-xs hover:bg-red-100 transition-colors"
                                                >
                                                    Sell
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Sell Modal */}
            {sellingItem && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                            <h3 className="text-xl font-black text-gray-900">Sell {sellingItem.scripSymbol}</h3>
                            <button onClick={() => setSellingItem(null)} className="text-gray-400 hover:text-gray-600">
                                <span className="sr-only">Close</span>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Quantity (Max: {sellingItem.quantity})</label>
                                    <input
                                        type="number"
                                        value={sellQuantity}
                                        onChange={(e) => setSellQuantity(parseInt(e.target.value))}
                                        max={sellingItem.quantity}
                                        min={1}
                                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Selling Price (Per Share)</label>
                                    <input
                                        type="number"
                                        value={sellPrice}
                                        onChange={(e) => setSellPrice(parseFloat(e.target.value))}
                                        min={1}
                                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none"
                                    />
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Total Receiveable</span>
                                    <span className="text-lg font-black text-green-600">{formatCurrency(sellQuantity * sellPrice)}</span>
                                </div>
                            </div>
                            <button
                                onClick={handleSell}
                                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                            >
                                Confirm Sell Order
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

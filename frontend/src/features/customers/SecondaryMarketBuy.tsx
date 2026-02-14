import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { secondaryMarketApi } from '../../api/customerApi';
import { TrendingUp, ShoppingCart, AlertCircle } from 'lucide-react';

export default function SecondaryMarketBuy() {
    const [symbol, setSymbol] = useState('');
    const [quantity, setQuantity] = useState<number>(10);
    const [price, setPrice] = useState<number>(100);
    const [loading, setLoading] = useState(false);

    const handleBuy = async () => {
        if (!symbol || quantity <= 0 || price <= 0) {
            toast.error('Please fill all fields correctly');
            return;
        }

        try {
            setLoading(true);
            await secondaryMarketApi.buy(symbol.toUpperCase(), quantity, price);
            toast.success('Buy order executed successfully! Check your portfolio.');
            setSymbol('');
            setQuantity(10);
            setPrice(100);
        } catch (error) {
            toast.error('Failed to buy shares. Check funds or try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                    <TrendingUp size={32} />
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-2">Buy Shares</h1>
                <p className="text-gray-500 font-medium">Secondary Market / Instant Buy</p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Script Symbol</label>
                        <input
                            type="text"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                            placeholder="Ex: NICA, NABIL"
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-black text-xl placeholder-gray-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none uppercase"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Quantity</label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value))}
                                min={1}
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Price Per Share</label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(parseFloat(e.target.value))}
                                min={1}
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                            />
                        </div>
                    </div>

                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 mt-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">Total Cost</span>
                            <span className="text-2xl font-black text-blue-900">
                                {new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR' }).format(quantity * price)}
                            </span>
                        </div>
                        <div className="flex gap-2 text-blue-400 text-xs font-medium">
                            <AlertCircle size={14} />
                            <p>Funds will be debited from your primary bank account.</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleBuy}
                    disabled={loading}
                    className={`w-full py-5 rounded-2xl font-black text-white shadow-xl transition-all flex items-center justify-center gap-3 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200 hover:-translate-y-1'
                        }`}
                >
                    {loading ? 'Processing...' : (
                        <>
                            <ShoppingCart size={20} />
                            Buy Shares Now
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ipoApi, ipoApplicationApi, customerApi, bankAccountApi } from '../../api/customerApi';
import { IPO, Customer, BankAccount } from '../../types';
import { useAppSelector } from '@/store/hooks';
import { Search, Plus, Trash2, Send, AlertCircle, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

interface IPOApplyItem {
    customerId: number;
    customerName: string;
    customerCode: string;
    bankAccountId: number;
    bankName: string;
    quantity: string;
    availableBanks: BankAccount[];
}

export default function BulkIPOApplyPage() {
    const { user } = useAppSelector((state) => state.auth);
    const navigate = useNavigate();

    const [ipos, setIpos] = useState<IPO[]>([]);
    const [selectedIpo, setSelectedIpo] = useState<IPO | null>(null);
    const [items, setItems] = useState<IPOApplyItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadIPOs();
    }, []);

    const loadIPOs = async () => {
        try {
            const res = await ipoApi.getActive();
            setIpos(res.data);
            if (res.data.length > 0) {
                setSelectedIpo(res.data[0]);
            }
        } catch (error) {
            toast.error('Failed to load active IPOs');
        }
    };

    useEffect(() => {
        if (searchTerm.length > 2) {
            const timer = setTimeout(() => {
                customerApi.getAll({ search: searchTerm }).then(res => {
                    setSearchResults(res.data);
                });
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setSearchResults([]);
        }
    }, [searchTerm]);

    const addCustomer = async (customer: Customer) => {
        if (items.find((i: IPOApplyItem) => i.customerId === customer.id)) {
            toast.error('Customer already added to batch');
            return;
        }

        try {
            // Fetch bank accounts for this customer
            const bankRes = await bankAccountApi.getByCustomerId(customer.id);
            const accounts = bankRes.data;

            if (accounts.length === 0) {
                toast.error(`${customer.fullName} has no registered bank accounts`);
                return;
            }

            const primaryAccount = accounts.find(a => a.isPrimary) || accounts[0];

            setItems([...items, {
                customerId: customer.id,
                customerName: customer.fullName,
                customerCode: customer.customerCode || '',
                bankAccountId: primaryAccount.id,
                bankName: primaryAccount.bankName || 'Unknown',
                quantity: selectedIpo?.minQuantity.toString() || '10',
                availableBanks: accounts
            }]);
            setSearchTerm('');
            setSearchResults([]);
        } catch (error) {
            toast.error('Failed to fetch customer bank accounts');
        }
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_: IPOApplyItem, i: number) => i !== index));
    };

    const updateItem = (index: number, field: keyof IPOApplyItem, value: any) => {
        const newItems = [...items];
        if (field === 'bankAccountId') {
            const accountId = parseInt(value);
            const account = newItems[index].availableBanks.find((a: BankAccount) => a.id === accountId);
            newItems[index].bankAccountId = accountId;
            newItems[index].bankName = account?.bankName || 'Unknown';
        } else {
            (newItems[index] as any)[field] = value;
        }
        setItems(newItems);
    };

    const handleSubmit = async () => {
        if (!selectedIpo) {
            toast.error('Please select an IPO');
            return;
        }
        if (items.length === 0) {
            toast.error('Add at least one customer');
            return;
        }

        const invalidItems = items.filter((i: IPOApplyItem) => {
            const q = parseInt(i.quantity);
            return isNaN(q) || q < selectedIpo.minQuantity || q > selectedIpo.maxQuantity;
        });

        if (invalidItems.length > 0) {
            toast.error(`Some items have invalid quantities. (Min: ${selectedIpo.minQuantity}, Max: ${selectedIpo.maxQuantity})`);
            return;
        }

        try {
            setLoading(true);
            const payload = {
                ipoId: selectedIpo.id,
                items: items.map((i: IPOApplyItem) => ({
                    customerId: i.customerId,
                    bankAccountId: i.bankAccountId,
                    quantity: parseInt(i.quantity)
                })),
                makerId: user?.id
            };

            await ipoApplicationApi.bulkCreate(payload);
            toast.success('Bulk IPO application batch created successfully');
            navigate('/dashboard');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create bulk applications');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 w-full space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900">Bulk IPO Apply</h1>
                        <p className="text-gray-500 font-medium">Apply for multiple customers in a single batch</p>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || items.length === 0}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-100"
                    >
                        {loading ? 'Processing...' : <><Send size={18} /> Submit Batch</>}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select IPO</label>
                        <select
                            value={selectedIpo?.id || ''}
                            onChange={(e) => {
                                const ipo = ipos.find((i: IPO) => i.id === parseInt(e.target.value));
                                setSelectedIpo(ipo || null);
                                // Sync quantities if IPO changes
                                if (ipo) {
                                    setItems(items.map((prev: IPOApplyItem) => ({ ...prev, quantity: ipo.minQuantity.toString() })));
                                }
                            }}
                            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                        >
                            {ipos.map((ipo: IPO) => (
                                <option key={ipo.id} value={ipo.id}>{ipo.companyName} ({ipo.symbol})</option>
                            ))}
                        </select>
                    </div>
                    {selectedIpo && (
                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center gap-3">
                            <Briefcase className="text-blue-500" size={24} />
                            <div>
                                <p className="text-xs font-bold text-blue-900">{selectedIpo.companyName}</p>
                                <p className="text-[10px] font-bold text-blue-700">Price: रू {selectedIpo.pricePerShare} | Range: {selectedIpo.minQuantity} - {selectedIpo.maxQuantity}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Bank Account</th>
                                    <th className="px-6 py-4 text-center">Quantity</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-medium italic">
                                            No customers added. Use the search to add customers to the batch.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item: IPOApplyItem, index: number) => (
                                        <tr key={index} className="hover:bg-gray-50/50 transition-all">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-gray-800 text-sm">{item.customerName}</p>
                                                <p className="text-[10px] font-bold text-blue-500 tracking-wider">CID: {item.customerCode}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={item.bankAccountId}
                                                    onChange={(e) => updateItem(index, 'bankAccountId', e.target.value)}
                                                    className="w-full bg-transparent text-sm font-bold text-gray-700 outline-none border-b-2 border-gray-100 focus:border-blue-500 p-1"
                                                >
                                                    {item.availableBanks.map((acc: BankAccount) => (
                                                        <option key={acc.id} value={acc.id}>
                                                            {acc.bankName} - {acc.accountNumber}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                    className="w-20 text-center font-mono font-bold bg-transparent border-b-2 border-gray-100 focus:border-blue-500 outline-none transition-all p-1"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-3">
                            <Plus size={18} className="text-green-500" /> Add Customer
                        </h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                placeholder="Search Name/CID/Phone..."
                            />
                        </div>

                        {searchResults.length > 0 && (
                            <div className="max-h-64 overflow-y-auto divide-y divide-gray-50 border border-gray-50 rounded-xl">
                                {searchResults.map((customer: Customer) => (
                                    <div
                                        key={customer.id}
                                        onClick={() => addCustomer(customer)}
                                        className="p-3 hover:bg-blue-50 cursor-pointer transition-all flex justify-between items-center group"
                                    >
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 group-hover:text-blue-700">{customer.fullName}</p>
                                            <p className="text-[10px] font-bold text-gray-400">CID: {customer.customerCode}</p>
                                        </div>
                                        <Plus size={14} className="text-gray-300 group-hover:text-blue-500" />
                                    </div>
                                ))}
                            </div>
                        )}
                        {searchTerm.length > 2 && searchResults.length === 0 && (
                            <p className="text-xs text-center text-gray-400 italic">No customers found</p>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <h1 className="font-bold text-gray-800 border-b pb-2">Batch Summary</h1>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-bold text-gray-600">
                                <span>Total Applications</span>
                                <span>{items.length}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-gray-600">
                                <span>Total Quantity</span>
                                <span>{items.reduce((sum: number, i: IPOApplyItem) => sum + (parseInt(i.quantity) || 0), 0)}</span>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-4">
                                <div className="flex justify-between text-lg font-black text-blue-900">
                                    <span>Total Value</span>
                                    <span>रू {(items.reduce((sum: number, i: IPOApplyItem) => sum + (parseInt(i.quantity) || 0), 0) * (selectedIpo?.pricePerShare || 0)).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
                        <AlertCircle className="text-amber-500 shrink-0" size={18} />
                        <p className="text-[10px] font-bold text-amber-800 leading-relaxed uppercase tracking-tight">
                            Ensure all customers have sufficient balance in their selected bank accounts. Funds will be held immediately upon submission.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

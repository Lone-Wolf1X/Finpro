import { useState, useEffect } from 'react';
import { Customer, IPO, BankDTO } from '../../types';
import { customerApi, ipoApplicationApi, ipoApi, bankApi } from '../../api/customerApi';
import { XCircle, CheckCircle2, Loader2, Users, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface BulkApplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function BulkApplyModal({ isOpen, onClose, onSuccess }: BulkApplyModalProps) {
    const [ipos, setIpos] = useState<IPO[]>([]);
    const [selectedIpo, setSelectedIpo] = useState<number | null>(null);
    const [banks, setBanks] = useState<BankDTO[]>([]);
    const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
    const [quantity, setQuantity] = useState(10);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [ipoRes, customerRes, bankRes] = await Promise.all([
                ipoApi.getActive(),
                customerApi.getAll(),
                bankApi.getAll(true) // Fetch active banks only
            ]);
            setIpos(ipoRes.data);
            setCustomers(customerRes.data.filter(c => c.kycStatus === 'APPROVED' || c.kycStatus === 'DRAFT'));
            setBanks(bankRes.data);
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedCustomers(filteredCustomers.map(c => c.id));
        } else {
            setSelectedCustomers([]);
        }
    };

    const toggleCustomer = (id: number) => {
        setSelectedCustomers(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const handleBulkApply = async () => {
        if (!selectedIpo || selectedCustomers.length === 0) {
            toast.error('Please select IPO and at least one customer');
            return;
        }

        try {
            setProcessing(true);
            await ipoApplicationApi.bulkCreate({
                ipoId: selectedIpo,
                customerIds: selectedCustomers,
                quantity: quantity,
                bankId: selectedBankId || undefined
            });
            toast.success(`Bulk application submitted for ${selectedCustomers.length} customers`);
            onSuccess();
            onClose();
        } catch (error) {
            toast.error('Bulk application failed');
        } finally {
            setProcessing(false);
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary-600 text-white rounded-2xl shadow-lg shadow-primary-200">
                            <Users size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Bulk IPO Application</h2>
                            <p className="text-sm font-bold text-primary-600 uppercase tracking-widest mt-0.5">Application Wizard</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900"
                    >
                        <XCircle size={32} />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Left Side: IPO and Quantity */}
                    <div className="w-full md:w-1/3 p-8 border-r border-gray-100 bg-white space-y-8 overflow-y-auto">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Select IPO</label>
                            <div className="space-y-2">
                                {loading ? (
                                    <div className="h-20 bg-gray-50 rounded-2xl animate-pulse" />
                                ) : (
                                    ipos.map(ipo => (
                                        <button
                                            key={ipo.id}
                                            onClick={() => setSelectedIpo(ipo.id)}
                                            className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${selectedIpo === ipo.id
                                                ? 'border-primary-600 bg-primary-50 ring-4 ring-primary-50'
                                                : 'border-gray-100 hover:border-gray-200 bg-white'
                                                }`}
                                        >
                                            <p className="font-black text-gray-900">{ipo.companyName}</p>
                                            <p className="text-xs font-bold text-primary-600 mt-1">{ipo.symbol}</p>
                                        </button>
                                    ))
                                )}
                                {ipos.length === 0 && !loading && (
                                    <p className="text-sm text-gray-500 italic p-4 text-center">No active IPOs found</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-gray-50">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Quantity per Customer</label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value))}
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-primary-600 focus:bg-white rounded-2xl outline-none font-black text-gray-900 transition-all text-center text-2xl"
                                min="1"
                            />
                        </div>

                        <div className="space-y-4 pt-4 border-t border-gray-50">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Select Bank (Optional)</label>
                            <select
                                value={selectedBankId || ''}
                                onChange={(e) => setSelectedBankId(e.target.value ? Number(e.target.value) : null)}
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-primary-600 focus:bg-white rounded-xl outline-none font-bold text-gray-900 transition-all text-sm appearance-none"
                            >
                                <option value="">Auto-Detect (Primary Account)</option>
                                {banks.map(bank => (
                                    <option key={bank.id} value={bank.id}>{bank.name} ({bank.branchName})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Right Side: Customer Selection */}
                    <div className="flex-1 p-8 flex flex-col bg-gray-50/30 overflow-hidden">
                        <div className="flex items-center justify-between mb-6 gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search customers..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-6 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-100 transition-all font-medium text-sm"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                    />
                                    <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0
                                        ? 'bg-primary-600 border-primary-600'
                                        : 'border-gray-300 group-hover:border-primary-400'
                                        }`}>
                                        {selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0 && <CheckCircle2 size={14} className="text-white" />}
                                    </div>
                                    <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Select All</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                            {loading ? (
                                Array(6).fill(0).map((_, i) => (
                                    <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />
                                ))
                            ) : (
                                filteredCustomers.map(customer => (
                                    <div
                                        key={customer.id}
                                        onClick={() => toggleCustomer(customer.id)}
                                        className={`p-4 rounded-xl border border-gray-100 flex items-center gap-4 cursor-pointer transition-all ${selectedCustomers.includes(customer.id)
                                            ? 'bg-primary-50 border-primary-200'
                                            : 'bg-white hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${selectedCustomers.includes(customer.id)
                                            ? 'bg-primary-600 border-primary-600'
                                            : 'border-gray-300'
                                            }`}>
                                            {selectedCustomers.includes(customer.id) && <CheckCircle2 size={14} className="text-white" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-black text-gray-900">{customer.fullName}</p>
                                            <p className="text-[10px] font-bold text-gray-400 tracking-wider font-mono">{customer.phone}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase ${customer.kycStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {customer.kycStatus}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                            {filteredCustomers.length === 0 && !loading && (
                                <div className="text-center py-12 space-y-4">
                                    <div className="p-4 bg-gray-50 w-fit mx-auto rounded-full text-gray-400">
                                        <Users size={32} />
                                    </div>
                                    <p className="text-sm font-bold text-gray-400 tracking-wider uppercase">No matching customers</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-gray-100 bg-white flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selected Customers</p>
                        <p className="text-xl font-black text-primary-600">{selectedCustomers.length}</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="px-8 py-4 font-black text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest text-xs"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleBulkApply}
                            disabled={processing || !selectedIpo || selectedCustomers.length === 0}
                            className={`px-10 py-4 bg-gray-900 text-white rounded-2xl font-black transition-all flex items-center gap-3 shadow-lg hover:shadow-gray-200 disabled:opacity-50 disabled:cursor-not-allowed ${!processing && 'hover:scale-105 active:scale-95'
                                }`}
                        >
                            {processing ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <CheckCircle2 size={20} />
                            )}
                            CONFIRM BULK APPLY
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

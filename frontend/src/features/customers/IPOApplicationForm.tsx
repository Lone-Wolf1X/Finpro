import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ipoApplicationApi, ipoApi, customerApi, bankAccountApi } from '../../api/customerApi';
import { Customer, IPO, BankAccount, CreateIPOApplicationRequest } from '../../types';

export default function IPOApplicationForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preselectedIpoId = searchParams.get('ipoId');

    const [formData, setFormData] = useState<CreateIPOApplicationRequest>({
        customerId: 0,
        ipoId: Number(preselectedIpoId) || 0,
        bankAccountId: 0,
        quantity: 0
    });

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [ipos, setIpos] = useState<IPO[]>([]);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [selectedIPO, setSelectedIPO] = useState<IPO | null>(null);
    const [totalAmount, setTotalAmount] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadCustomers();
        loadIPOs();
    }, []);

    useEffect(() => {
        if (formData.customerId) {
            loadBankAccounts(formData.customerId);
        }
    }, [formData.customerId]);

    useEffect(() => {
        if (formData.ipoId) {
            const ipo = ipos.find(i => i.id === formData.ipoId);
            setSelectedIPO(ipo || null);
        }
    }, [formData.ipoId, ipos]);

    useEffect(() => {
        if (selectedIPO && formData.quantity) {
            setTotalAmount(selectedIPO.pricePerShare * formData.quantity);
        } else {
            setTotalAmount(0);
        }
    }, [selectedIPO, formData.quantity]);

    const loadCustomers = async () => {
        try {
            const response = await customerApi.getAll({ kycStatus: 'APPROVED' });
            setCustomers(response.data);
        } catch (error) {
            console.error('Failed to load customers:', error);
        }
    };

    const loadIPOs = async () => {
        try {
            const response = await ipoApi.getActive();
            setIpos(response.data);
        } catch (error) {
            console.error('Failed to load IPOs:', error);
        }
    };

    const loadBankAccounts = async (customerId: number) => {
        try {
            const response = await bankAccountApi.getActiveByCustomerId(customerId);
            setBankAccounts(response.data);

            // Auto-select primary account if available
            const primaryAccount = response.data.find(acc => acc.isPrimary);
            if (primaryAccount) {
                setFormData(prev => ({ ...prev, bankAccountId: primaryAccount.id }));
            }
        } catch (error) {
            console.error('Failed to load bank accounts:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!selectedIPO) {
            alert('Please select an IPO');
            return;
        }

        if (formData.quantity < selectedIPO.minQuantity) {
            alert(`Minimum quantity is ${selectedIPO.minQuantity}`);
            return;
        }

        if (formData.quantity > selectedIPO.maxQuantity) {
            alert(`Maximum quantity is ${selectedIPO.maxQuantity}`);
            return;
        }

        if (!formData.bankAccountId) {
            alert('Please select a bank account');
            return;
        }

        try {
            setLoading(true);
            await ipoApplicationApi.create(formData);
            alert('IPO application submitted successfully!');
            navigate('/ipo-applications');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to submit application');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NP', {
            style: 'currency',
            currency: 'NPR'
        }).format(amount);
    };

    return (
        <div className="p-6">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center mb-6">
                    <button
                        onClick={() => navigate('/ipos')}
                        className="mr-4 text-gray-600 hover:text-gray-800"
                    >
                        ← Back
                    </button>
                    <h1 className="text-2xl font-bold">Apply for IPO</h1>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
                    {/* Customer Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">
                            Select Customer <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={formData.customerId}
                            onChange={(e) => setFormData({ ...formData, customerId: Number(e.target.value) })}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            <option value={0}>-- Select Customer --</option>
                            {customers.map((customer) => (
                                <option key={customer.id} value={customer.id}>
                                    {customer.fullName} ({customer.email})
                                </option>
                            ))}
                        </select>
                        <p className="text-sm text-gray-600 mt-1">Only customers with APPROVED KYC are shown</p>
                    </div>

                    {/* IPO Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">
                            Select IPO <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={formData.ipoId}
                            onChange={(e) => setFormData({ ...formData, ipoId: Number(e.target.value) })}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            <option value={0}>-- Select IPO --</option>
                            {ipos.map((ipo) => (
                                <option key={ipo.id} value={ipo.id}>
                                    {ipo.companyName} ({ipo.symbol}) - {formatCurrency(ipo.pricePerShare)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* IPO Details */}
                    {selectedIPO && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h3 className="font-semibold mb-3">IPO Details</h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-gray-600">Price per Share:</span>
                                    <span className="ml-2 font-semibold">{formatCurrency(selectedIPO.pricePerShare)}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Issue Size:</span>
                                    <span className="ml-2 font-semibold">{selectedIPO.issueSize.toLocaleString()}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Min Quantity:</span>
                                    <span className="ml-2 font-semibold">{selectedIPO.minQuantity}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Max Quantity:</span>
                                    <span className="ml-2 font-semibold">{selectedIPO.maxQuantity}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quantity */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">
                            Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            required
                            min={selectedIPO?.minQuantity || 1}
                            max={selectedIPO?.maxQuantity || 1000}
                            value={formData.quantity || ''}
                            onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                        {selectedIPO && (
                            <p className="text-sm text-gray-600 mt-1">
                                Min: {selectedIPO.minQuantity}, Max: {selectedIPO.maxQuantity}
                            </p>
                        )}
                    </div>

                    {/* Bank Account Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">
                            Select Bank Account <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={formData.bankAccountId}
                            onChange={(e) => setFormData({ ...formData, bankAccountId: Number(e.target.value) })}
                            className="w-full px-3 py-2 border rounded-lg"
                            disabled={!formData.customerId}
                        >
                            <option value={0}>-- Select Bank Account --</option>
                            {bankAccounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.bankName} - {account.accountNumber}
                                    {account.isPrimary && ' (Primary)'}
                                </option>
                            ))}
                        </select>
                        {formData.customerId && bankAccounts.length === 0 && (
                            <p className="text-sm text-red-600 mt-1">
                                No active bank accounts found. Please add a bank account first.
                            </p>
                        )}
                    </div>

                    {/* Total Amount & Fund Hold Notice */}
                    {totalAmount > 0 && (
                        <div className="space-y-4 mb-6">
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-semibold">Total Amount:</span>
                                    <span className="text-2xl font-bold text-green-700">
                                        {formatCurrency(totalAmount)}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg flex gap-3">
                                <div className="mt-1">
                                    <svg className="h-5 w-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-orange-800 uppercase tracking-tight">Fund Holding Policy (CASBA)</p>
                                    <p className="text-xs text-orange-700 leading-relaxed mt-1">
                                        By submitting this application, you authorize the system to <span className="font-extrabold">HOLD</span> the total amount of {formatCurrency(totalAmount)} from your selected bank account. This amount will be blocked and processed once the IPO application is verified.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/ipos')}
                            className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Submitting...' : 'Submit Application'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

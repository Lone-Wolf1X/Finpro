import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { ipoApplicationApi, ipoApi, customerApi, bankAccountApi } from '../../api/customerApi';
import { Customer, IPO, BankAccount, CreateIPOApplicationRequest } from '../../types';

export default function IPOApplicationForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preselectedIpoId = searchParams.get('ipoId');
    const preselectedCustomerId = searchParams.get('customerId');

    const [formData, setFormData] = useState<CreateIPOApplicationRequest>({
        customerId: Number(preselectedCustomerId) || 0,
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
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;

    useEffect(() => {
        loadCustomers();
        loadIPOs();
        if (id) {
            loadApplication();
        }
    }, [id]);

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

    const loadApplication = async () => {
        try {
            setLoading(true);
            const response = await ipoApplicationApi.getById(Number(id!));
            const app = response.data;
            setFormData({
                customerId: app.customerId,
                ipoId: app.ipoId,
                bankAccountId: app.bankAccountId || 0,
                quantity: app.quantity
            });
        } catch (error) {
            console.error('Failed to load application:', error);
            alert('Failed to load application details');
        } finally {
            setLoading(false);
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

            // Get logged in user for makerId
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;

            const submitData = {
                ...formData,
                makerId: user?.role === 'MAKER' || user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' ? user.id : undefined
            };

            if (isEdit) {
                await ipoApplicationApi.update(Number(id), submitData);
                alert('IPO application updated successfully!');
            } else {
                await ipoApplicationApi.create(submitData);
                alert('IPO application submitted successfully!');
            }

            // Redirect back to customer profile if customerId exists
            if (preselectedCustomerId || (isEdit && formData.customerId)) {
                navigate(`/customers/${preselectedCustomerId || formData.customerId}`);
            } else {
                navigate('/ipo-applications');
            }
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
            <div className="w-full">
                <div className="flex items-center mb-6">
                    <button
                        onClick={() => navigate('/ipos')}
                        className="mr-4 text-gray-600 hover:text-gray-800"
                    >
                        ← Back
                    </button>
                    <h1 className="text-2xl font-bold">{isEdit ? 'Edit IPO Application' : 'Apply for IPO'}</h1>
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
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    const step = selectedIPO?.minQuantity || 10;
                                    const newVal = (formData.quantity || 0) - step;
                                    if (newVal >= (selectedIPO?.minQuantity || 1)) {
                                        setFormData({ ...formData, quantity: newVal });
                                    }
                                }}
                                className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200 font-bold text-gray-600"
                            >
                                -
                            </button>
                            <input
                                type="number"
                                required
                                min={selectedIPO?.minQuantity || 1}
                                max={selectedIPO?.maxQuantity || 1000}
                                value={formData.quantity || ''}
                                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                                className="w-full px-4 py-3 border rounded-xl font-mono text-lg font-bold text-center"
                                placeholder="Enter Quantity"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    const step = selectedIPO?.minQuantity || 10;
                                    const newVal = (formData.quantity || 0) + step;
                                    if (newVal <= (selectedIPO?.maxQuantity || 1000000)) {
                                        setFormData({ ...formData, quantity: newVal });
                                    }
                                }}
                                className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200 font-bold text-gray-600"
                            >
                                +
                            </button>
                        </div>
                        {selectedIPO && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, quantity: selectedIPO.minQuantity })}
                                    className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full hover:bg-blue-100"
                                >
                                    Min: {selectedIPO.minQuantity}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, quantity: selectedIPO.minQuantity * 2 })}
                                    className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full hover:bg-blue-100"
                                >
                                    {selectedIPO.minQuantity * 2}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, quantity: selectedIPO.minQuantity * 5 })}
                                    className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full hover:bg-blue-100"
                                >
                                    {selectedIPO.minQuantity * 5}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, quantity: selectedIPO.maxQuantity })}
                                    className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full hover:bg-gray-200"
                                >
                                    Max: {selectedIPO.maxQuantity}
                                </button>
                            </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2 font-medium">
                            Enter the number of units you want to apply for.
                        </p>
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

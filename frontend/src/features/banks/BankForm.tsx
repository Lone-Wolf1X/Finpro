import { useState, useEffect } from 'react';
import { createBank, updateBank } from '../../api/bankService';
import { Bank, BankCreateDTO } from '../../types/bank.types';

interface BankFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    bank?: Bank;
}

export default function BankForm({ isOpen, onClose, onSuccess, bank }: BankFormProps) {
    const isEdit = !!bank;
    const [formData, setFormData] = useState<BankCreateDTO>({
        name: '',
        branchName: '',
        localBody: '',
        isCasba: false,
        casbaCharge: 0,
        active: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (bank) {
            setFormData({
                name: bank.name,
                branchName: bank.branchName || '',
                localBody: bank.localBody || '',
                isCasba: bank.isCasba,
                casbaCharge: bank.casbaCharge,
                active: bank.active
            });
        } else {
            setFormData({
                name: '',
                branchName: '',
                localBody: '',
                isCasba: false,
                casbaCharge: 0,
                active: true
            });
        }
    }, [bank]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isEdit && bank) {
                await updateBank(bank.id, formData);
            } else {
                await createBank(formData);
            }
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save bank');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">{isEdit ? 'Edit Bank' : 'Add New Bank'}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Bank Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                                placeholder="e.g. Nabil Bank"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Branch Name</label>
                            <input
                                type="text"
                                value={formData.branchName || ''}
                                onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                                placeholder="e.g. Head Office"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Local Body</label>
                            <input
                                type="text"
                                value={formData.localBody || ''}
                                onChange={(e) => setFormData({ ...formData, localBody: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                                placeholder="Type..."
                            />
                        </div>

                        <div className="flex items-center h-full pt-6">
                            <input
                                type="checkbox"
                                checked={formData.isCasba}
                                onChange={(e) => setFormData({ ...formData, isCasba: e.target.checked })}
                                className="mr-2 h-4 w-4"
                                id="isCasba"
                            />
                            <label htmlFor="isCasba" className="text-sm font-medium cursor-pointer">CASBA Enabled</label>
                        </div>

                        {formData.isCasba && (
                            <div>
                                <label className="block text-sm font-medium mb-1">CASBA Charge (0-5)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="5"
                                    value={formData.casbaCharge}
                                    onChange={(e) => setFormData({ ...formData, casbaCharge: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                        )}

                        <div className="flex items-center h-full pt-6">
                            <input
                                type="checkbox"
                                checked={formData.active}
                                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                className="mr-2 h-4 w-4"
                                id="isActive"
                            />
                            <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">Active</label>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-2 bg-red-50 text-red-700 text-sm rounded border border-red-200">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Bank'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

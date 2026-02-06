import { useState, useEffect } from 'react';
import { getBanks, deleteBank } from '../../api/bankService';
import { Bank } from '../../types/bank.types';
import BankForm from './BankForm';

export default function BankList() {
    const [banks, setBanks] = useState<Bank[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingBank, setEditingBank] = useState<Bank | undefined>(undefined);
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        loadBanks();
    }, []);

    const loadBanks = async () => {
        try {
            setLoading(true);
            const data = await getBanks();
            setBanks(data);
        } catch (error) {
            console.error('Failed to load banks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this bank?')) {
            try {
                await deleteBank(id);
                loadBanks();
            } catch (error) {
                console.error('Failed to delete bank:', error);
                alert('Failed to delete bank');
            }
        }
    };

    const handleEdit = (bank: Bank) => {
        setEditingBank(bank);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingBank(undefined);
        setIsFormOpen(true);
    };

    const handleFormClose = () => {
        setIsFormOpen(false);
        setEditingBank(undefined);
    };

    const handleFormSuccess = () => {
        handleFormClose();
        loadBanks();
    };

    return (
        <div className="p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Bank Management</h1>
                    <button
                        onClick={handleAddNew}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        + Add Bank
                    </button>
                </div>

                {loading ? (
                    <div>Loading banks...</div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        CASBA
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        CASBA Charge
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {banks.map((bank) => (
                                    <tr key={bank.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{bank.name}</div>
                                            <div className="text-sm text-gray-500">{bank.localBody}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bank.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {bank.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {bank.isCasba ? 'Yes' : 'No'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {bank.casbaCharge}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(bank)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(bank.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isFormOpen && (
                <BankForm
                    isOpen={isFormOpen}
                    onClose={handleFormClose}
                    onSuccess={handleFormSuccess}
                    bank={editingBank}
                />
            )}
        </div>
    );
}

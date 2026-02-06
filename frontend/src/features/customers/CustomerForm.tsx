import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { customerApi } from '../../api/customerApi';
import { getBanks } from '../../api/bankService';
import { CreateCustomerRequest, Gender, Customer } from '../../types';
import { Bank } from '../../types/bank.types';
import BulkUploadModal from './BulkUploadModal.tsx';

export default function CustomerForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [formData, setFormData] = useState<CreateCustomerRequest>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        gender: 'MALE',
        dateOfBirth: '',
        contactNumber: '',
        bankAccountNumber: '',
        bankId: 0,
        address: '',
        citizenshipNumber: '',
        nidNumber: '',
        guardianId: undefined,
        guardianName: '',
        guardianRelation: ''
    });


    const [banks, setBanks] = useState<Bank[]>([]);
    const [eligibleGuardians, setEligibleGuardians] = useState<Customer[]>([]);
    const [age, setAge] = useState<number>(0);
    const [isMinor, setIsMinor] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showBulkUpload, setShowBulkUpload] = useState(false);

    useEffect(() => {

        loadBanks();
        loadGuardians();
        if (isEdit) {
            loadCustomer();
        }
    }, [id]);

    useEffect(() => {
        if (formData.dateOfBirth) {
            calculateAge(formData.dateOfBirth);
        }
    }, [formData.dateOfBirth]);

    const loadBanks = async () => {
        try {
            const data = await getBanks(true);
            setBanks(data);
        } catch (error) {
            console.error('Failed to load banks:', error);
        }
    }

    const loadGuardians = async () => {
        try {
            const response = await customerApi.getEligibleGuardians();
            setEligibleGuardians(response.data);
        } catch (error) {
            console.error('Failed to load guardians:', error);
        }
    }



    const loadCustomer = async () => {
        try {
            const response = await customerApi.getById(Number(id));
            const customer = response.data;
            setFormData({
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
                phone: customer.phone,
                gender: customer.gender,
                dateOfBirth: customer.dateOfBirth,
                contactNumber: customer.contactNumber || '',
                bankAccountNumber: customer.bankAccountNumber || '',
                bankId: customer.bankId || 0,
                address: customer.address || '',
                citizenshipNumber: customer.citizenshipNumber || '',
                nidNumber: customer.nidNumber || '',
                guardianId: customer.guardianId,
                guardianName: customer.guardianName || '',
                guardianRelation: customer.guardianRelation || ''
            });
        } catch (error) {
            console.error('Failed to load customer:', error);
        }
    };

    const calculateAge = (dob: string) => {
        const birthDate = new Date(dob);
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            calculatedAge--;
        }

        setAge(calculatedAge);
        setIsMinor(calculatedAge < 18);
    };

    const handleSaveDraft = async () => {
        try {
            setLoading(true);
            const draftData: Partial<CreateCustomerRequest> = { ...formData };

            // For draft, we don't strictly require bank or guardian, but good to send what we have
            if (isEdit) {
                await customerApi.updateDraft(Number(id), draftData);
            } else {
                await customerApi.createDraft(draftData);
            }
            alert('Customer saved as draft successfully!');
            navigate('/customers');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to save draft');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation - Strict for Submit
        if (isMinor) {
            if (!formData.guardianId) {
                alert('Guardian is required for minor customers. Please select from the list.');
                return;
            }
            // Since we use ID now, Name/Relation are auxiliary but let's ensure they are set if using text input fallback (removed)
        }

        if (!formData.bankId || !formData.bankAccountNumber) {
            alert('Bank information is mandatory for submission');
            return;
        }

        try {
            setLoading(true);
            if (isEdit) {
                await customerApi.update(Number(id), formData);
            } else {
                await customerApi.create(formData);
            }
            alert('Customer submitted successfully!');
            navigate('/customers');
        } catch (error: any) {
            console.error("Submit Error", error);
            alert(error.response?.data?.message || 'Failed to save customer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <button
                            onClick={() => navigate('/customers')}
                            className="mr-4 text-gray-600 hover:text-gray-800"
                        >
                            ← Back
                        </button>
                        <h1 className="text-2xl font-bold">
                            {isEdit ? 'Edit Customer' : 'Add New Customer'}
                        </h1>
                    </div>
                    {!isEdit && (
                        <button
                            onClick={() => setShowBulkUpload(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            Bulk Upload
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
                    {/* Personal Information */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    First Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Last Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Gender <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    <option value="MALE">Male</option>
                                    <option value="FEMALE">Female</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Date of Birth <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.dateOfBirth}
                                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                                {age > 0 && (
                                    <p className="text-xs mt-1 text-gray-500">
                                        Age: {age} {isMinor && <span className="text-red-600 font-bold">(MINOR)</span>}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Phone <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    required
                                    pattern="[0-9]{10}"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Secondary Contact</label>
                                <input
                                    type="tel"
                                    value={formData.contactNumber}
                                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium mb-2">Address</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Identity Information */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-4">Identity Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Citizenship Number
                                </label>
                                <input
                                    type="text"
                                    value={formData.citizenshipNumber || ''}
                                    onChange={(e) => setFormData({ ...formData, citizenshipNumber: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="e.g. 12-34-56-7890"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    National ID (NID)
                                </label>
                                <input
                                    type="text"
                                    value={formData.nidNumber || ''}
                                    onChange={(e) => setFormData({ ...formData, nidNumber: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="e.g. 123-456-789"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Guardian Selection (for MINOR) */}
                    {isMinor && (
                        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <h2 className="text-lg font-semibold mb-4 text-yellow-800">
                                Guardian Information (Required for Minor)
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Select Guardian <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required={isMinor}
                                        value={formData.guardianId || ''}
                                        onChange={(e) => {
                                            const selectedId = Number(e.target.value);
                                            const selectedGuardian = eligibleGuardians.find(g => g.id === selectedId);
                                            setFormData({
                                                ...formData,
                                                guardianId: selectedId,
                                                guardianName: selectedGuardian?.fullName || ''
                                            });
                                        }}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    >
                                        <option value="">-- Select Guardian --</option>
                                        {eligibleGuardians.map((guardian) => (
                                            <option key={guardian.id} value={guardian.id}>
                                                {guardian.fullName} (ID: {guardian.id}, Ph: {guardian.phone})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Only MAJOR customers with APPROVED KYC can be guardians.
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Relation <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required={isMinor}
                                        value={formData.guardianRelation || ''}
                                        onChange={(e) => setFormData({ ...formData, guardianRelation: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    >
                                        <option value="">-- Select Relation --</option>
                                        <option value="FATHER">Father</option>
                                        <option value="MOTHER">Mother</option>
                                        <option value="GRANDFATHER">Grandfather</option>
                                        <option value="GRANDMOTHER">Grandmother</option>
                                        <option value="UNCLE">Uncle</option>
                                        <option value="AUNT">Aunt</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bank Information */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-4">Bank Information (Mandatory)</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Select Bank <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.bankId}
                                    onChange={(e) => setFormData({ ...formData, bankId: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    <option value={0}>-- Select Bank --</option>
                                    {banks.map((bank) => (
                                        <option key={bank.id} value={bank.id}>
                                            {bank.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Bank Account Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.bankAccountNumber}
                                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={handleSaveDraft}
                            disabled={loading}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                        >
                            Save as Draft
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/customers')}
                            className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : (isEdit ? 'Submit Customer' : 'Create Customer')}
                        </button>
                    </div>
                </form>
            </div>

            {showBulkUpload && (
                <BulkUploadModal onClose={() => setShowBulkUpload(false)} onSuccess={() => navigate('/customers')} />
            )}
        </div>
    );
}

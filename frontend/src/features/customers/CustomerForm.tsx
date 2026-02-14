import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { customerApi } from '../../api/customerApi';
import { getBanks } from '../../api/bankService';
import { CreateCustomerRequest, Gender, Customer } from '../../types';
import { Bank } from '../../types/bank.types';
import BulkUploadModal from './BulkUploadModal.tsx';
import { Camera, CreditCard, Plus, Trash2 } from 'lucide-react';

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
        initialDeposit: 0,
        address: '',
        citizenshipNumber: '',
        nidNumber: '',
        guardianId: undefined,
        guardianName: '',
        guardianRelation: '',
        remarks: '',
        photoPath: '',
        signaturePath: '',
        guardianPhotoPath: '',
        guardianSignaturePath: '',
        secondaryBankAccounts: []
    });


    const [banks, setBanks] = useState<Bank[]>([]);
    const [eligibleGuardians, setEligibleGuardians] = useState<Customer[]>([]);
    const [age, setAge] = useState<number>(0);
    const [isMinor, setIsMinor] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showBulkUpload, setShowBulkUpload] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);

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
            setCurrentCustomer(customer);
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
                guardianRelation: customer.guardianRelation || '',
                remarks: customer.remarks || '',
                photoPath: customer.photoPath || '',
                signaturePath: customer.signaturePath || '',
                guardianPhotoPath: customer.guardianPhotoPath || '',
                guardianSignaturePath: customer.guardianSignaturePath || '',
                secondaryBankAccounts: [] // Default if not using separate API for secondary
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

            // Add skipGuardianKycCheck if it's a minor submission to avoid blocking on guardian status
            const submitData = {
                ...formData,
                skipGuardianKycCheck: isMinor
            };

            if (isEdit) {
                await customerApi.update(Number(id), submitData);
            } else {
                await customerApi.create(submitData);
            }
            alert('Customer submitted successfully!');
            navigate('/customers');
        } catch (error: any) {
            console.error("Submit Error", error.response?.data);
            const message = error.response?.data?.message || 'Failed to save customer';
            const errors = error.response?.data?.errors;

            if (errors && Array.isArray(errors)) {
                alert(`${message}:\n${errors.join('\n')}`);
            } else if (typeof errors === 'object') {
                const errorDetails = Object.entries(errors).map(([field, msg]) => `${field}: ${msg}`).join('\n');
                alert(`${message}:\n${errorDetails}`);
            } else {
                alert(message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="w-full">
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

                {formData.remarks && (
                    <div className="mb-6 bg-orange-50 border border-orange-200 p-4 rounded-lg">
                        <h3 className="text-sm font-bold text-orange-800 mb-1">KYC Return/Reject Remarks:</h3>
                        <p className="text-sm text-orange-700">{formData.remarks}</p>
                    </div>
                )}

                {isEdit && (
                    <div className="mb-6 bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-center justify-between">
                        <div>
                            <span className="text-sm font-medium text-gray-500">Customer ID: </span>
                            <span className="text-lg font-mono font-bold text-blue-700">
                                {currentCustomer?.customerCode || 'Loading...'}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${isMinor ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                {isMinor ? 'MINOR' : 'MAJOR'}
                            </span>
                        </div>
                    </div>
                )}

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

                    {/* Photos & Signatures */}
                    <div className="mb-6 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <h2 className="text-lg font-black text-gray-800 mb-6 uppercase tracking-tight flex items-center gap-2">
                            <Camera size={20} className="text-blue-600" />
                            Photos & Signatures
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Customer Photo/Sign */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Customer Documents</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Profile Photo Path</label>
                                        <input
                                            type="text"
                                            value={formData.photoPath}
                                            onChange={(e) => setFormData({ ...formData, photoPath: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-700 placeholder:text-gray-300"
                                            placeholder="e.g. photo_123.jpg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Signature Path</label>
                                        <input
                                            type="text"
                                            value={formData.signaturePath}
                                            onChange={(e) => setFormData({ ...formData, signaturePath: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-700 placeholder:text-gray-300"
                                            placeholder="e.g. sign_123.png"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Guardian Photo/Sign (Visible if Minor) */}
                            {isMinor && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Guardian Documents</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Guardian Photo Path</label>
                                            <input
                                                type="text"
                                                value={formData.guardianPhotoPath}
                                                onChange={(e) => setFormData({ ...formData, guardianPhotoPath: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-700 placeholder:text-gray-300"
                                                placeholder="e.g. guardian_photo.jpg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Guardian Signature Path</label>
                                            <input
                                                type="text"
                                                value={formData.guardianSignaturePath}
                                                onChange={(e) => setFormData({ ...formData, guardianSignaturePath: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-700 placeholder:text-gray-300"
                                                placeholder="e.g. guardian_sign.png"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
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
                                        disabled={isEdit} // Lock guardian for existing minors
                                        onChange={(e) => {
                                            const selectedId = Number(e.target.value);
                                            const selectedGuardian = eligibleGuardians.find(g => g.id === selectedId);
                                            setFormData({
                                                ...formData,
                                                guardianId: selectedId,
                                                guardianName: selectedGuardian?.fullName || ''
                                            });
                                        }}
                                        className={`w-full px-3 py-2 border rounded-lg ${isEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
                    <div className="mb-6 p-6 bg-blue-50/30 rounded-2xl border border-blue-100">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
                                <CreditCard size={20} className="text-blue-600" />
                                Bank Information
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Primary Bank <span className="text-red-500">*</span></label>
                                <select
                                    required
                                    value={formData.bankId}
                                    onChange={(e) => setFormData({ ...formData, bankId: Number(e.target.value) })}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-700"
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
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Primary Account Number <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={formData.bankAccountNumber}
                                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-700 placeholder:text-gray-300"
                                    placeholder="Enter primary account number"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Initial Deposit (रू)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.initialDeposit || 0}
                                    onChange={(e) => setFormData({ ...formData, initialDeposit: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-700 placeholder:text-gray-300"
                                    placeholder="0.00"
                                />
                                <p className="text-xs text-gray-500 mt-1 px-1">Optional: Initial deposit amount for this account</p>
                            </div>
                        </div>

                        {/* Secondary Bank Accounts (Visible in Draft/Edit if allowed) */}
                        {(!isEdit || currentCustomer?.kycStatus === 'DRAFT') && (
                            <div className="mt-8 pt-8 border-t border-blue-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest">Secondary Bank Accounts</h3>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const updated = [...(formData.secondaryBankAccounts || [])];
                                            updated.push({ bankId: 0, accountNumber: '', accountType: 'SAVINGS' as any });
                                            setFormData({ ...formData, secondaryBankAccounts: updated });
                                        }}
                                        className="text-[10px] font-black bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-all uppercase tracking-widest flex items-center gap-1 shadow-sm"
                                    >
                                        <Plus size={12} /> Add Bank
                                    </button>
                                </div>

                                {formData.secondaryBankAccounts && formData.secondaryBankAccounts.length > 0 ? (
                                    <div className="space-y-4">
                                        {formData.secondaryBankAccounts.map((acc, index) => (
                                            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white rounded-xl border border-blue-50 shadow-sm relative group">
                                                <div className="md:col-span-2">
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Bank Name</label>
                                                    <select
                                                        value={acc.bankId}
                                                        onChange={(e) => {
                                                            const updated = [...formData.secondaryBankAccounts!];
                                                            updated[index].bankId = Number(e.target.value);
                                                            setFormData({ ...formData, secondaryBankAccounts: updated });
                                                        }}
                                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-700 text-sm"
                                                    >
                                                        <option value={0}>-- Select Bank --</option>
                                                        {banks.map((bank) => (
                                                            <option key={bank.id} value={bank.id}>{bank.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Account Number</label>
                                                    <input
                                                        type="text"
                                                        value={acc.accountNumber}
                                                        onChange={(e) => {
                                                            const updated = [...formData.secondaryBankAccounts!];
                                                            updated[index].accountNumber = e.target.value;
                                                            setFormData({ ...formData, secondaryBankAccounts: updated });
                                                        }}
                                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-700 text-sm"
                                                        placeholder="Account #"
                                                    />
                                                </div>
                                                <div className="flex items-end justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const updated = formData.secondaryBankAccounts!.filter((_, i) => i !== index);
                                                            setFormData({ ...formData, secondaryBankAccounts: updated });
                                                        }}
                                                        className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-6 text-center bg-white/50 border border-dashed border-blue-100 rounded-xl">
                                        <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">No secondary accounts added</p>
                                    </div>
                                )}
                            </div>
                        )}
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
                            {loading ? 'Saving...' : (
                                isEdit ? (
                                    currentCustomer?.kycStatus === 'DRAFT' || currentCustomer?.kycStatus === 'RETURNED' || currentCustomer?.kycStatus === 'REJECTED'
                                        ? 'Submit for Verification'
                                        : 'Update Customer'
                                ) : (
                                    JSON.parse(localStorage.getItem('user') || '{}').role === 'MAKER'
                                        ? 'Create & Save Draft'
                                        : 'Create Customer'
                                )
                            )}
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

// Helper component for editable Details tab
import React from 'react';
import { Customer } from '../../types';
import { User, Edit, FileSignature, Save, X, Upload } from 'lucide-react';

interface EditableDetailsTabProps {
    customer: Customer;
    isEditing: boolean;
    editedCustomer: Customer | null;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    onChange: (field: keyof Customer, value: any) => void;
    onFileUpload: (file: File, type: 'photo' | 'signature' | 'guardian-photo' | 'guardian-signature') => void;
    uploadingPhoto: boolean;
    uploadingSignature: boolean;
    uploadingGuardianPhoto: boolean;
    uploadingGuardianSignature: boolean;
}

const EditableDetailsTab: React.FC<EditableDetailsTabProps> = ({
    customer,
    isEditing,
    editedCustomer,
    onEdit,
    onSave,
    onCancel,
    onChange,
    onFileUpload,
    uploadingPhoto,
    uploadingSignature,
    uploadingGuardianPhoto,
    uploadingGuardianSignature,
}) => {
    const displayCustomer = isEditing && editedCustomer ? editedCustomer : customer;

    // Helper to bust cache for images
    const getImageUrl = (path: string | undefined) => {
        if (!path) return null;
        return `http://127.0.0.1:8080/${path}?t=${new Date().getTime()}`;
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Personal Identity Section */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <User size={20} className="text-blue-500" /> Personal Identity
                    </h3>
                    {!isEditing ? (
                        <button
                            onClick={onEdit}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all border border-blue-600 shadow-sm"
                        >
                            <Edit size={16} />
                            Edit
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={onSave}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all shadow-sm"
                            >
                                <Save size={16} />
                                Save
                            </button>
                            <button
                                onClick={onCancel}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 transition-all shadow-sm"
                            >
                                <X size={16} />
                                Cancel
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Gender */}
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Gender</p>
                        {isEditing ? (
                            <select
                                value={displayCustomer.gender}
                                onChange={(e) => onChange('gender', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 font-medium"
                            >
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHER">Other</option>
                            </select>
                        ) : (
                            <p className="text-base font-bold text-gray-700">{displayCustomer.gender}</p>
                        )}
                    </div>

                    {/* Date of Birth */}
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Date of Birth</p>
                        {isEditing ? (
                            <input
                                type="date"
                                value={displayCustomer.dateOfBirth}
                                onChange={(e) => onChange('dateOfBirth', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 font-medium"
                            />
                        ) : (
                            <p className="text-base font-bold text-gray-700">{displayCustomer.dateOfBirth}</p>
                        )}
                    </div>

                    {/* Citizenship Number */}
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Citizenship Number</p>
                        {isEditing ? (
                            <input
                                type="text"
                                value={displayCustomer.citizenshipNumber || ''}
                                onChange={(e) => onChange('citizenshipNumber', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 font-medium"
                                placeholder="Enter Citizenship No."
                            />
                        ) : (
                            <p className="text-base font-bold text-gray-700">{displayCustomer.citizenshipNumber || 'N/A'}</p>
                        )}
                    </div>

                    {/* NID Number */}
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">NID Number</p>
                        {isEditing ? (
                            <input
                                type="text"
                                value={displayCustomer.nidNumber || ''}
                                onChange={(e) => onChange('nidNumber', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 font-medium"
                                placeholder="Enter NID No."
                            />
                        ) : (
                            <p className="text-base font-bold text-gray-700">{displayCustomer.nidNumber || 'N/A'}</p>
                        )}
                    </div>

                    {/* Contact Number */}
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Contact Number</p>
                        {isEditing ? (
                            <input
                                type="text"
                                value={displayCustomer.contactNumber || ''}
                                onChange={(e) => onChange('contactNumber', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 font-medium"
                                placeholder="Enter Contact No."
                            />
                        ) : (
                            <p className="text-base font-bold text-gray-700">{displayCustomer.contactNumber || 'N/A'}</p>
                        )}
                    </div>

                    {/* Address */}
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Address</p>
                        {isEditing ? (
                            <input
                                type="text"
                                value={displayCustomer.address || ''}
                                onChange={(e) => onChange('address', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 font-medium"
                                placeholder="Enter Address"
                            />
                        ) : (
                            <p className="text-base font-bold text-gray-700">{displayCustomer.address || 'N/A'}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Documents Section (Cleaned Up) */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6 border-b pb-4">
                    <FileSignature size={20} className="text-purple-500" /> Documents & Identification
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Customer Photo */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col items-center">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">
                            Customer Photo
                        </label>
                        <div className="relative group">
                            {displayCustomer.photoPath ? (
                                <img
                                    src={getImageUrl(displayCustomer.photoPath)!}
                                    alt="Customer"
                                    className="w-48 h-48 object-cover rounded-2xl shadow-lg border-4 border-white"
                                />
                            ) : (
                                <div className="w-48 h-48 bg-gray-200 rounded-2xl flex items-center justify-center border-4 border-white shadow-inner">
                                    <User size={64} className="text-gray-400" />
                                </div>
                            )}

                            {isEditing && (
                                <div className="mt-4 flex justify-center w-full">
                                    <label className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl cursor-pointer hover:bg-blue-700 transition-all shadow-md active:scale-95 font-bold">
                                        <Upload size={18} />
                                        {uploadingPhoto ? 'Uploading...' : 'Upload New'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => e.target.files?.[0] && onFileUpload(e.target.files[0], 'photo')}
                                            disabled={uploadingPhoto}
                                        />
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Customer Signature */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col items-center">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">
                            Customer Signature
                        </label>
                        <div className="relative group w-full flex flex-col items-center">
                            {displayCustomer.signaturePath ? (
                                <img
                                    src={getImageUrl(displayCustomer.signaturePath)!}
                                    alt="Signature"
                                    className="w-full h-48 object-contain bg-white rounded-2xl shadow-lg border-4 border-white p-2"
                                />
                            ) : (
                                <div className="w-full h-48 bg-gray-200 rounded-2xl flex items-center justify-center border-4 border-white shadow-inner">
                                    <FileSignature size={64} className="text-gray-400" />
                                </div>
                            )}

                            {isEditing && (
                                <div className="mt-4 flex justify-center w-full">
                                    <label className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl cursor-pointer hover:bg-blue-700 transition-all shadow-md active:scale-95 font-bold">
                                        <Upload size={18} />
                                        {uploadingSignature ? 'Uploading...' : 'Upload New'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => e.target.files?.[0] && onFileUpload(e.target.files[0], 'signature')}
                                            disabled={uploadingSignature}
                                        />
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Guardian Section for Minors */}
            {displayCustomer.customerType === 'MINOR' && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-4 flex items-center gap-2">
                        <User size={20} className="text-orange-500" /> Guardian Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                            <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-1">Guardian Name</p>
                            <p className="text-lg font-bold text-gray-800">{displayCustomer.guardianName || 'N/A'}</p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                            <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-1">Guardian Relation</p>
                            <p className="text-lg font-bold text-gray-800">{displayCustomer.guardianRelation || 'N/A'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Guardian Photo */}
                        <div className="bg-orange-50/[0.3] p-6 rounded-xl border border-orange-100 flex flex-col items-center">
                            <label className="text-xs font-black text-orange-800 uppercase tracking-widest mb-4">
                                Guardian Photo {isEditing && <span className="text-red-500">*</span>}
                            </label>
                            <div className="relative group">
                                {displayCustomer.guardianPhotoPath ? (
                                    <img
                                        src={getImageUrl(displayCustomer.guardianPhotoPath)!}
                                        alt="Guardian"
                                        className="w-48 h-48 object-cover rounded-2xl shadow-lg border-4 border-white"
                                    />
                                ) : (
                                    <div className="w-48 h-48 bg-gray-200 rounded-2xl flex items-center justify-center border-4 border-white shadow-inner">
                                        <User size={64} className="text-gray-400" />
                                    </div>
                                )}

                                {isEditing && (
                                    <div className="mt-4 flex justify-center w-full">
                                        <label className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-xl cursor-pointer hover:bg-orange-700 transition-all shadow-md active:scale-95 font-bold">
                                            <Upload size={18} />
                                            {uploadingGuardianPhoto ? 'Uploading...' : 'Upload'}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => e.target.files?.[0] && onFileUpload(e.target.files[0], 'guardian-photo')}
                                                disabled={uploadingGuardianPhoto}
                                            />
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Guardian Signature */}
                        <div className="bg-orange-50/[0.3] p-6 rounded-xl border border-orange-100 flex flex-col items-center">
                            <label className="text-xs font-black text-orange-800 uppercase tracking-widest mb-4">
                                Guardian Signature
                            </label>
                            <div className="relative group w-full flex flex-col items-center">
                                {displayCustomer.guardianSignaturePath ? (
                                    <img
                                        src={getImageUrl(displayCustomer.guardianSignaturePath)!}
                                        alt="Guardian Signature"
                                        className="w-full h-48 object-contain bg-white rounded-2xl shadow-lg border-4 border-white p-2"
                                    />
                                ) : (
                                    <div className="w-full h-48 bg-gray-200 rounded-2xl flex items-center justify-center border-4 border-white shadow-inner">
                                        <FileSignature size={64} className="text-gray-400" />
                                    </div>
                                )}

                                {isEditing && (
                                    <div className="mt-4 flex justify-center w-full">
                                        <label className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-xl cursor-pointer hover:bg-orange-700 transition-all shadow-md active:scale-95 font-bold">
                                            <Upload size={18} />
                                            {uploadingGuardianSignature ? 'Uploading...' : 'Upload'}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => e.target.files?.[0] && onFileUpload(e.target.files[0], 'guardian-signature')}
                                                disabled={uploadingGuardianSignature}
                                            />
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditableDetailsTab;

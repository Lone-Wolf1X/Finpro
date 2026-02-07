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

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                {/* Personal Identity Section */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <User size={20} className="text-blue-500" /> Personal Identity
                        </h3>
                        {!isEditing ? (
                            <button
                                onClick={onEdit}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
                            >
                                <Edit size={16} />
                                Edit
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={onSave}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all"
                                >
                                    <Save size={16} />
                                    Save
                                </button>
                                <button
                                    onClick={onCancel}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 transition-all"
                                >
                                    <X size={16} />
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                        {/* Gender */}
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Gender</p>
                            {isEditing ? (
                                <select
                                    value={displayCustomer.gender}
                                    onChange={(e) => onChange('gender', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="MALE">Male</option>
                                    <option value="FEMALE">Female</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            ) : (
                                <p className="text-base font-semibold text-gray-700">{displayCustomer.gender}</p>
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            ) : (
                                <p className="text-base font-semibold text-gray-700">{displayCustomer.dateOfBirth}</p>
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            ) : (
                                <p className="text-base font-semibold text-gray-700">{displayCustomer.citizenshipNumber || 'N/A'}</p>
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            ) : (
                                <p className="text-base font-semibold text-gray-700">{displayCustomer.nidNumber || 'N/A'}</p>
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            ) : (
                                <p className="text-base font-semibold text-gray-700">{displayCustomer.contactNumber || 'N/A'}</p>
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            ) : (
                                <p className="text-base font-semibold text-gray-700">{displayCustomer.address || 'N/A'}</p>
                            )}
                        </div>
                    </div>

                    {/* Photo and Signature Upload */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <h4 className="text-sm font-bold text-gray-600 uppercase mb-4">Documents</h4>
                        <div className="grid grid-cols-2 gap-6">
                            {/* Customer Photo */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                                    Customer Photo
                                </label>
                                {displayCustomer.photoPath && (
                                    <img
                                        src={`http://127.0.0.1:8080/${displayCustomer.photoPath}`}
                                        alt="Customer"
                                        className="w-32 h-32 object-cover rounded-lg mb-2 border-2 border-gray-200"
                                    />
                                )}
                                {isEditing && (
                                    <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-all border border-blue-200 w-fit">
                                        <Upload size={16} />
                                        {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => e.target.files?.[0] && onFileUpload(e.target.files[0], 'photo')}
                                            disabled={uploadingPhoto}
                                        />
                                    </label>
                                )}
                            </div>

                            {/* Customer Signature */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                                    Customer Signature
                                </label>
                                {displayCustomer.signaturePath && (
                                    <img
                                        src={`http://127.0.0.1:8080/${displayCustomer.signaturePath}`}
                                        alt="Signature"
                                        className="w-32 h-20 object-cover rounded-lg mb-2 border-2 border-gray-200"
                                    />
                                )}
                                {isEditing && (
                                    <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-all border border-blue-200 w-fit">
                                        <Upload size={16} />
                                        {uploadingSignature ? 'Uploading...' : 'Upload Signature'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => e.target.files?.[0] && onFileUpload(e.target.files[0], 'signature')}
                                            disabled={uploadingSignature}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Guardian Section for Minors */}
                {displayCustomer.customerType === 'MINOR' && (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-4">Guardian Information</h3>
                        <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Guardian Name</p>
                                <p className="text-base font-semibold text-gray-700">{displayCustomer.guardianName || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Guardian Relation</p>
                                <p className="text-base font-semibold text-gray-700">{displayCustomer.guardianRelation || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Guardian Photo and Signature */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <h4 className="text-sm font-bold text-gray-600 uppercase mb-4">Guardian Documents</h4>
                            <div className="grid grid-cols-2 gap-6">
                                {/* Guardian Photo */}
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                                        Guardian Photo {isEditing && <span className="text-red-500">*</span>}
                                    </label>
                                    {displayCustomer.guardianPhotoPath && (
                                        <img
                                            src={`http://127.0.0.1:8080/${displayCustomer.guardianPhotoPath}`}
                                            alt="Guardian"
                                            className="w-32 h-32 object-cover rounded-lg mb-2 border-2 border-gray-200"
                                        />
                                    )}
                                    {isEditing && (
                                        <label className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-lg cursor-pointer hover:bg-orange-100 transition-all border border-orange-200 w-fit">
                                            <Upload size={16} />
                                            {uploadingGuardianPhoto ? 'Uploading...' : 'Upload Guardian Photo'}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => e.target.files?.[0] && onFileUpload(e.target.files[0], 'guardian-photo')}
                                                disabled={uploadingGuardianPhoto}
                                            />
                                        </label>
                                    )}
                                </div>

                                {/* Guardian Signature */}
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                                        Guardian Signature
                                    </label>
                                    {displayCustomer.guardianSignaturePath && (
                                        <img
                                            src={`http://127.0.0.1:8080/${displayCustomer.guardianSignaturePath}`}
                                            alt="Guardian Signature"
                                            className="w-32 h-20 object-cover rounded-lg mb-2 border-2 border-gray-200"
                                        />
                                    )}
                                    {isEditing && (
                                        <label className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-lg cursor-pointer hover:bg-orange-100 transition-all border border-orange-200 w-fit">
                                            <Upload size={16} />
                                            {uploadingGuardianSignature ? 'Uploading...' : 'Upload Guardian Signature'}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => e.target.files?.[0] && onFileUpload(e.target.files[0], 'guardian-signature')}
                                                disabled={uploadingGuardianSignature}
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
                {/* Customer Photo Display */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-600 uppercase mb-4">Profile Photo</h3>
                    {displayCustomer.photoPath ? (
                        <img
                            src={`http://127.0.0.1:8080/${displayCustomer.photoPath}`}
                            alt={`${displayCustomer.firstName} ${displayCustomer.lastName}`}
                            className="w-full h-64 object-cover rounded-xl border-2 border-gray-200"
                        />
                    ) : (
                        <div className="w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-gray-200">
                            <User size={64} className="text-gray-400" />
                        </div>
                    )}
                </div>

                {/* Signature Display */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-600 uppercase mb-4">Signature</h3>
                    {displayCustomer.signaturePath ? (
                        <img
                            src={`http://127.0.0.1:8080/${displayCustomer.signaturePath}`}
                            alt="Signature"
                            className="w-full h-32 object-contain rounded-xl border-2 border-gray-200 bg-white p-2"
                        />
                    ) : (
                        <div className="w-full h-32 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-gray-200">
                            <FileSignature size={32} className="text-gray-400" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditableDetailsTab;

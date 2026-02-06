import { useState, useRef } from 'react';
import axios from 'axios';

interface BulkUploadModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function BulkUploadModal({ onClose, onSuccess }: BulkUploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        setError(null);

        try {
            await axios.post('/api/customers/bulk-import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            alert('Bulk upload successful!');
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Upload failed:', err);
            setError(err.response?.data?.message || 'Failed to upload file. Please check the format and try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Bulk Upload Customers</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        ✕
                    </button>
                </div>

                <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-4">
                        Upload a CSV file containing customer details. Ensure mandatory fields (Name, Bank Details) are included.
                    </p>

                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100"
                    />

                    {error && (
                        <div className="mt-3 p-2 bg-red-50 text-red-700 text-sm rounded border border-red-200">
                            {error}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                        disabled={uploading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                </div>
            </div>
        </div>
    );
}

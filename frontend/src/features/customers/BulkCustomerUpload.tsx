import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { Upload, Download, FileText, CheckCircle, AlertCircle, ArrowLeft, Loader2, Building } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Bank {
    id: number;
    name: string;
    isActive: boolean;
}

export default function BulkCustomerUpload() {
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [report, setReport] = useState<string[]>([]);

    // Bank Selection
    const [banks, setBanks] = useState<Bank[]>([]);
    const [selectedBankId, setSelectedBankId] = useState<number | ''>('');
    const [loadingBanks, setLoadingBanks] = useState(false);

    useEffect(() => {
        loadBanks();
    }, []);

    const loadBanks = async () => {
        try {
            setLoadingBanks(true);
            const response = await apiClient.get<Bank[]>('/banks', { params: { activeOnly: true } });
            setBanks(response.data);
            if (response.data.length > 0) {
                setSelectedBankId(response.data[0].id); // Default to first bank
            }
        } catch (error) {
            console.error('Failed to load banks', error);
            toast.error('Failed to load banks');
        } finally {
            setLoadingBanks(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setReport([]);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await apiClient.get('/customers/bulk/template', {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'bulk_customer_template.csv');
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (error) {
            console.error('Failed to download template', error);
            toast.error('Failed to download template');
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error('Please select a file');
            return;
        }
        if (!selectedBankId) {
            toast.error('Please select a bank');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('bankId', selectedBankId.toString());

        try {
            setUploading(true);
            setReport([]);
            const response = await apiClient.post<string[]>('/customers/bulk/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setReport(response.data);
            if (response.data.length > 0 && response.data[0].startsWith('Summary:')) {
                toast.success('Bulk processing completed');
            } else {
                toast.success('File uploaded successfully');
            }
        } catch (error: any) {
            console.error('Upload failed', error);
            toast.error(error.response?.data?.message || 'Failed to process file');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/customers')}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Bulk Customer Creation</h1>
                    <p className="text-gray-500 font-medium">Upload CSV to create multiple customer profiles instantly.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upload Section */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6">
                    {/* Bank Selector */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <Building size={16} className="text-blue-500" />
                            Select Bank / Branch
                        </label>
                        <select
                            value={selectedBankId}
                            onChange={(e) => setSelectedBankId(Number(e.target.value))}
                            disabled={loadingBanks}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-gray-50/50"
                        >
                            <option value="">Select Bank</option>
                            {banks.map((bank) => (
                                <option key={bank.id} value={bank.id}>
                                    {bank.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="text-center space-y-2 pt-4 border-t border-gray-100">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Upload className="text-blue-600" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Upload CSV File</h3>
                        <p className="text-sm text-gray-500">
                            Support for Major and Minor applicants. <br />
                            <span className="text-xs text-gray-400">(Max file size: 5MB)</span>
                        </p>
                    </div>

                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 transition-colors hover:border-blue-400 hover:bg-blue-50/30 group cursor-pointer relative">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="text-center space-y-2">
                            <FileText className="mx-auto text-gray-300 group-hover:text-blue-500 transition-colors" size={40} />
                            <p className="text-sm font-medium text-gray-600">
                                {file ? file.name : 'Click or Drag & Drop to Upload'}
                            </p>
                            {file && (
                                <p className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full inline-block">
                                    {(file.size / 1024).toFixed(1)} KB
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            onClick={handleDownloadTemplate}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all text-sm uppercase tracking-wide"
                        >
                            <Download size={18} />
                            Template
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={!file || uploading || !selectedBankId}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:shadow-none transition-all text-sm uppercase tracking-wide"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={18} />
                                    Process File
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Instructions & Format */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                        <div className="relative z-10 space-y-4">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <AlertCircle size={20} className="text-yellow-400" />
                                Important Notes
                            </h3>
                            <ul className="space-y-2 text-sm text-gray-300 leading-relaxed list-disc pl-4">
                                <li>Ensure dates are in <strong>YYYY-MM-DD</strong> format.</li>
                                <li><strong>Mobile Number</strong> must be unique.</li>
                                <li><strong>Bank Account Number</strong> is mandatory.</li>
                                <li><strong>Address</strong> should be filled as a single string.</li>
                                <li>For <strong>Minors</strong>, valid <strong>Guardian ID</strong> is required.</li>
                                <li>Citizenship is mandatory for <strong>Major</strong> applicants.</li>
                                <li>Default account type is <strong>SAVINGS</strong> if unspecified.</li>
                            </ul>
                        </div>
                        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                    </div>

                    {/* Report Section */}
                    {report.length > 0 && (
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg max-h-[400px] overflow-y-auto">
                            <h3 className="font-bold text-gray-900 mb-4 sticky top-0 bg-white pb-2 border-b border-gray-100">
                                Processing Report
                            </h3>
                            <div className="space-y-2">
                                {report.map((line, index) => (
                                    <div
                                        key={index}
                                        className={`p-3 rounded-xl text-sm font-medium ${index === 0
                                            ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100' // Summary line
                                            : line.startsWith('Failed')
                                                ? 'bg-red-50 text-red-600 border border-red-100'
                                                : 'bg-green-50 text-green-600 border border-green-100'
                                            }`}
                                    >
                                        {line}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

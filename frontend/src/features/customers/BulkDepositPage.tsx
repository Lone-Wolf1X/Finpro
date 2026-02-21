import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerApi, bulkDepositApi } from '../../api/customerApi';
import { Customer } from '../../types';
import { useAppSelector } from '@/store/hooks';
import { Search, Plus, Trash2, Send, Save, AlertCircle, Upload, FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface DepositItem {
    customerId: number;
    customerName: string;
    customerCode: string;
    amount: string;
    remarks: string;
}

export default function BulkDepositPage() {
    const { user } = useAppSelector((state) => state.auth);
    const navigate = useNavigate();
    const [mode, setMode] = useState<'manual' | 'csv'>('manual');
    const [items, setItems] = useState<DepositItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Customer[]>([]);
    const [batchRemarks, setBatchRemarks] = useState('');
    const [loading, setLoading] = useState(false);

    // CSV Upload State
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [bankName, setBankName] = useState('');
    const [transactionRef, setTransactionRef] = useState('');
    const [dragActive, setDragActive] = useState(false);

    useEffect(() => {
        if (searchTerm.length > 2) {
            const timer = setTimeout(() => {
                customerApi.getAll({ search: searchTerm }).then(res => {
                    setSearchResults(res.data);
                });
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setSearchResults([]);
        }
    }, [searchTerm]);

    const addCustomer = (customer: Customer) => {
        if (items.find(i => i.customerId === customer.id)) {
            toast.error('Customer already added to batch');
            return;
        }
        setItems([...items, {
            customerId: customer.id,
            customerName: customer.fullName,
            customerCode: customer.customerCode || '',
            amount: '',
            remarks: ''
        }]);
        setSearchTerm('');
        setSearchResults([]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof DepositItem, value: string) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;
        setItems(newItems);
    };

    const handleSubmit = async () => {
        if (items.length === 0) {
            toast.error('Add at least one customer');
            return;
        }
        if (items.some(i => !i.amount || parseFloat(i.amount) <= 0)) {
            toast.error('All items must have a valid positive amount');
            return;
        }

        try {
            setLoading(true);
            const payload = {
                remarks: batchRemarks,
                items: items.map(i => ({
                    customerId: i.customerId,
                    amount: parseFloat(i.amount),
                    remarks: i.remarks
                }))
            };
            await bulkDepositApi.create(payload, user!.id);
            toast.success('Bulk deposit batch created successfully');
            navigate('/dashboard');
        } catch (error) {
            toast.error('Failed to create bulk deposit');
        } finally {
            setLoading(false);
        }
    };

    const handleCSVUpload = async () => {
        if (!csvFile) {
            toast.error('Please select a CSV file');
            return;
        }
        if (!bankName.trim()) {
            toast.error('Please enter bank name');
            return;
        }

        try {
            setLoading(true);
            await bulkDepositApi.uploadCSV(csvFile, bankName, transactionRef.trim() || '', user!.id);
            toast.success('CSV uploaded successfully');
            navigate('/dashboard');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to upload CSV');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.name.endsWith('.csv')) {
                toast.error('Please select a CSV file');
                return;
            }
            setCsvFile(file);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            if (!file.name.endsWith('.csv')) {
                toast.error('Please select a CSV file');
                return;
            }
            setCsvFile(file);
        }
    };

    const downloadTemplate = () => {
        const csvContent = 'Customer Code,Customer Name,Amount,Remarks,Bank Transaction Ref\nCID001,John Doe,5000.00,Initial deposit,TXN001\nCID002,Jane Smith,10000.00,Salary credit,TXN002';
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bulk_deposit_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="p-6 w-full space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900">Bulk Deposit (Maker)</h1>
                        <p className="text-gray-500 font-medium">Create a new batch of deposits for verification</p>
                    </div>
                    <button
                        onClick={mode === 'manual' ? handleSubmit : handleCSVUpload}
                        disabled={loading || (mode === 'manual' ? items.length === 0 : !csvFile)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-100"
                    >
                        <Send size={18} /> Submit for Verification
                    </button>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-2 border-b border-gray-200">
                    <button
                        onClick={() => setMode('manual')}
                        className={`px-6 py-3 font-bold transition-all ${mode === 'manual'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        Manual Entry
                    </button>
                    <button
                        onClick={() => setMode('csv')}
                        className={`px-6 py-3 font-bold transition-all ${mode === 'csv'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        CSV Upload
                    </button>
                </div>
            </div>

            {mode === 'manual' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Item List */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <th className="px-6 py-4">Customer</th>
                                        <th className="px-6 py-4 text-center">Amount (रू)</th>
                                        <th className="px-6 py-4">Remarks</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-medium italic">
                                                No customers added to batch yet. Use the search on the right.
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((item, index) => (
                                            <tr key={index} className="hover:bg-gray-50/50 transition-all">
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-gray-800 text-sm">{item.customerName}</p>
                                                    <p className="text-[10px] font-bold text-blue-500 tracking-wider">CID: {item.customerCode}</p>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <input
                                                        type="number"
                                                        value={item.amount}
                                                        onChange={(e) => updateItem(index, 'amount', e.target.value)}
                                                        placeholder="0.00"
                                                        className="w-32 text-center font-mono font-bold bg-transparent border-b-2 border-gray-100 focus:border-blue-500 outline-none transition-all p-1"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="text"
                                                        value={item.remarks}
                                                        onChange={(e) => updateItem(index, 'remarks', e.target.value)}
                                                        placeholder="Note..."
                                                        className="w-full text-sm bg-transparent border-b-2 border-gray-100 focus:border-blue-500 outline-none transition-all p-1"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Batch Info */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-3">
                                <Save size={18} className="text-blue-500" /> Batch Details
                            </h3>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Batch Remarks</label>
                                <textarea
                                    value={batchRemarks}
                                    onChange={(e) => setBatchRemarks(e.target.value)}
                                    className="w-full mt-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all min-h-[100px]"
                                    placeholder="General remarks for the checker..."
                                />
                            </div>
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-2">
                                <div className="flex justify-between text-sm font-bold text-blue-800">
                                    <span>Total Customers</span>
                                    <span>{items.length}</span>
                                </div>
                                <div className="flex justify-between text-lg font-black text-blue-900 border-t border-blue-200 pt-2">
                                    <span>Total Amount</span>
                                    <span>रू {items.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Customer Search */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-3">
                                <Plus size={18} className="text-green-500" /> Add Customer
                            </h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                    placeholder="Search Name/CID/Phone..."
                                />
                            </div>

                            {searchResults.length > 0 && (
                                <div className="max-h-64 overflow-y-auto divide-y divide-gray-50 border border-gray-50 rounded-xl">
                                    {searchResults.map(customer => (
                                        <div
                                            key={customer.id}
                                            onClick={() => addCustomer(customer)}
                                            className="p-3 hover:bg-blue-50 cursor-pointer transition-all flex justify-between items-center group"
                                        >
                                            <div>
                                                <p className="text-sm font-bold text-gray-800 group-hover:text-blue-700">{customer.fullName}</p>
                                                <p className="text-[10px] font-bold text-gray-400">CID: {customer.customerCode}</p>
                                            </div>
                                            <Plus size={14} className="text-gray-300 group-hover:text-blue-500" />
                                        </div>
                                    ))}
                                </div>
                            )}
                            {searchTerm.length > 2 && searchResults.length === 0 && (
                                <p className="text-xs text-center text-gray-400 italic">No customers found</p>
                            )}

                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                                <AlertCircle className="text-blue-500 shrink-0" size={18} />
                                <p className="text-[10px] font-bold text-blue-800 leading-relaxed uppercase tracking-tight">
                                    All customers (including DRAFT) can receive deposits.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* CSV Upload Section */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-3">
                            <Upload size={18} className="text-blue-500" /> Upload CSV File
                        </h3>

                        {/* File Upload Zone */}
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-300'
                                }`}
                        >
                            <input
                                type="file"
                                id="csv-upload"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            {csvFile ? (
                                <div className="space-y-2">
                                    <FileText size={48} className="mx-auto text-green-500" />
                                    <p className="font-bold text-gray-800">{csvFile.name}</p>
                                    <p className="text-xs text-gray-400">
                                        {(csvFile.size / 1024).toFixed(2)} KB
                                    </p>
                                    <button
                                        onClick={() => setCsvFile(null)}
                                        className="text-sm text-red-500 hover:text-red-700 font-bold"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <Upload size={48} className="mx-auto text-gray-300" />
                                    <div>
                                        <p className="font-bold text-gray-600">
                                            Drag and drop CSV file here
                                        </p>
                                        <p className="text-sm text-gray-400">or</p>
                                        <label
                                            htmlFor="csv-upload"
                                            className="inline-block mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-bold cursor-pointer hover:bg-blue-600 transition-all"
                                        >
                                            Browse Files
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Download Template */}
                        <button
                            onClick={downloadTemplate}
                            className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                        >
                            <Download size={18} /> Download CSV Template
                        </button>
                    </div>

                    {/* Bank Details Section */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-3">
                            <Save size={18} className="text-green-500" /> Bank Details
                        </h3>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                Bank Name *
                            </label>
                            <input
                                type="text"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                className="w-full mt-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                placeholder="e.g., ABC Bank"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                Transaction Reference (Optional - Auto-generated)
                            </label>
                            <input
                                type="text"
                                value={transactionRef}
                                onChange={(e) => setTransactionRef(e.target.value)}
                                className="w-full mt-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                placeholder="Leave empty to auto-generate"
                            />
                        </div>

                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-2">
                            <div className="flex items-center gap-2 text-blue-800">
                                <AlertCircle size={16} />
                                <p className="text-xs font-bold">CSV Format</p>
                            </div>
                            <p className="text-[10px] text-blue-700 leading-relaxed">
                                Required columns: Customer Code, Customer Name, Amount<br />
                                Optional: Remarks, Bank Transaction Ref
                            </p>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
}

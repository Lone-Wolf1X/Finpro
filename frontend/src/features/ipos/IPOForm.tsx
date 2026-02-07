import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Building2, Tag, Calendar, Layout, Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function IPOForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        companyName: '',
        symbol: '',
        pricePerShare: '',
        issueSize: '',
        minQuantity: '10',
        maxQuantity: '1000',
        openDate: '',
        closeDate: '',
        description: '',
        status: 'UPCOMING'
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEdit) {
            loadIPO();
        }
    }, [id]);

    const loadIPO = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:8080/api/ipos/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data;
            setFormData({
                companyName: data.companyName,
                symbol: data.symbol,
                pricePerShare: data.pricePerShare.toString(),
                issueSize: data.issueSize.toString(),
                minQuantity: data.minQuantity.toString(),
                maxQuantity: data.maxQuantity.toString(),
                openDate: data.openDate ? data.openDate.slice(0, 16) : '',
                closeDate: data.closeDate ? data.closeDate.slice(0, 16) : '',
                description: data.description || '',
                status: data.status
            });
        } catch (error) {
            toast.error('Failed to load IPO details');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const payload = {
                ...formData,
                pricePerShare: parseFloat(formData.pricePerShare),
                issueSize: parseInt(formData.issueSize),
                minQuantity: parseInt(formData.minQuantity),
                maxQuantity: parseInt(formData.maxQuantity)
            };

            if (isEdit) {
                await axios.put(`http://localhost:8080/api/ipos/${id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('IPO updated successfully');
            } else {
                await axios.post('http://localhost:8080/api/ipos', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('IPO created successfully');
            }
            navigate('/ipos');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save IPO');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                <div className="bg-gray-900 p-10 text-white flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter">
                            {isEdit ? 'Edit IPO Posting' : 'Launch New IPO'}
                        </h1>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">
                            {isEdit ? 'Update existing market offering details' : 'Configure initial public offering parameters'}
                        </p>
                    </div>
                    <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-md">
                        <Layout className="text-blue-400" size={32} />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Basic Info */}
                    <div className="space-y-6">
                        <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                            <Building2 size={14} /> Entity Details
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Company Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-700 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                    placeholder="e.g. Next Gen Innovations Ltd."
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Ticker / Symbol</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.symbol}
                                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none uppercase font-mono"
                                    placeholder="e.g. NGIL"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Financials */}
                    <div className="space-y-6">
                        <h3 className="text-xs font-black text-green-600 uppercase tracking-widest flex items-center gap-2">
                            <Tag size={14} /> Pricing & Size
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Price (NPR)</label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    value={formData.pricePerShare}
                                    onChange={(e) => setFormData({ ...formData, pricePerShare: e.target.value })}
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-mono font-black text-gray-700 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Issue Size (Shares)</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.issueSize}
                                    onChange={(e) => setFormData({ ...formData, issueSize: e.target.value })}
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-mono font-black text-gray-700 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Min Units</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.minQuantity}
                                    onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-700 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Max Units</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.maxQuantity}
                                    onChange={(e) => setFormData({ ...formData, maxQuantity: e.target.value })}
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-700 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-6">
                        <h3 className="text-xs font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={14} /> Timeline
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Open Date & Time</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={formData.openDate}
                                    onChange={(e) => setFormData({ ...formData, openDate: e.target.value })}
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-700 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Close Date & Time</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={formData.closeDate}
                                    onChange={(e) => setFormData({ ...formData, closeDate: e.target.value })}
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-700 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Offering Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-700 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none appearance-none"
                            >
                                <option value="UPCOMING">Upcoming</option>
                                <option value="OPEN">Open</option>
                                <option value="CLOSED">Closed (Subs End)</option>
                                <option value="ALLOTTED">Allotted</option>
                                <option value="LISTED">Listed</option>
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-6">
                        <h3 className="text-xs font-black text-purple-600 uppercase tracking-widest flex items-center gap-2">
                            Description
                        </h3>
                        <textarea
                            rows={6}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-medium text-gray-600 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                            placeholder="Market insights, company background, or risk factors..."
                        />
                    </div>

                    <div className="md:col-span-2 flex gap-4 pt-6 border-t border-gray-50">
                        <button
                            type="button"
                            onClick={() => navigate('/ipos')}
                            className="flex-1 px-8 py-5 border-2 border-gray-100 rounded-2xl font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                        >
                            <X size={20} /> Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] px-8 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-500/40 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save size={20} /> {isEdit ? 'Update Offering' : 'Confirm Launch'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

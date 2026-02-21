import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { toast } from 'react-hot-toast';
import { Plus, XCircle } from 'lucide-react';

export default function TenantManagement() {
    const [tenants, setTenants] = useState([]);
    const [features, setFeatures] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<any>(null);

    // New Tenant Form State
    const [formData, setFormData] = useState({
        companyName: '',
        subdomain: '',
        adminEmail: '',
        adminPassword: '',
        plan: 'BASIC'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [tenantsRes, featuresRes] = await Promise.all([
                adminApi.getAllTenants(),
                adminApi.getAllFeatures()
            ]);
            setTenants(tenantsRes.data);
            setFeatures(featuresRes.data);
        } catch (error) {
            toast.error('Failed to load data');
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await adminApi.createTenant(formData);
            toast.success('Tenant created successfully');
            setIsCreating(false);
            loadData();
            setFormData({ companyName: '', subdomain: '', adminEmail: '', adminPassword: '', plan: 'BASIC' });
        } catch (error: any) {
            toast.error('Failed to create tenant');
        }
    };

    const toggleFeature = async (featureId: number, currentStatus: boolean) => {
        if (!selectedTenant) return;
        try {
            await adminApi.toggleFeature(selectedTenant.id, featureId, !currentStatus);
            toast.success('Feature updated');
            // Refresh logic if needed, or optimistically update
        } catch (error) {
            toast.error('Failed to update feature');
        }
    };

    return (
        <div className="p-8 bg-gray-50/50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Tenant Management</h1>
                        <p className="text-gray-500 font-bold">Manage SaaS Customers & Features</p>
                    </div>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-2xl font-black shadow-lg hover:bg-purple-700 transition-all"
                    >
                        <Plus size={20} /> Onboard New Tenant
                    </button>
                </div>

                {isCreating && (
                    <div className="mb-10 bg-white p-8 rounded-3xl border border-gray-100 shadow-2xl animate-in fade-in slide-in-from-top-4">
                        <h3 className="font-black text-lg mb-6">New Tenant Details</h3>
                        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <input
                                placeholder="Company Name"
                                className="p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 ring-purple-500/20"
                                value={formData.companyName}
                                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                required
                            />
                            <input
                                placeholder="Subdomain (e.g. agencyx)"
                                className="p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 ring-purple-500/20"
                                value={formData.subdomain}
                                onChange={e => setFormData({ ...formData, subdomain: e.target.value })}
                                required
                            />
                            <input
                                placeholder="Admin Email"
                                type="email"
                                className="p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 ring-purple-500/20"
                                value={formData.adminEmail}
                                onChange={e => setFormData({ ...formData, adminEmail: e.target.value })}
                                required
                            />
                            <input
                                placeholder="Admin Password"
                                type="password"
                                className="p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 ring-purple-500/20"
                                value={formData.adminPassword}
                                onChange={e => setFormData({ ...formData, adminPassword: e.target.value })}
                                required
                            />
                            <select
                                className="p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 ring-purple-500/20"
                                value={formData.plan}
                                onChange={e => setFormData({ ...formData, plan: e.target.value })}
                            >
                                <option value="BASIC">Basic Plan</option>
                                <option value="PRO">Pro Plan</option>
                                <option value="ENTERPRISE">Enterprise</option>
                            </select>
                            <div className="col-span-full flex gap-4 mt-4">
                                <button type="submit" className="px-8 py-3 bg-purple-600 text-white font-black rounded-xl">Create Tenant</button>
                                <button type="button" onClick={() => setIsCreating(false)} className="px-8 py-3 bg-gray-200 text-gray-700 font-black rounded-xl">Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left p-6 font-black text-gray-400 uppercase tracking-widest text-xs">Company</th>
                                <th className="text-left p-6 font-black text-gray-400 uppercase tracking-widest text-xs">Subdomain</th>
                                <th className="text-left p-6 font-black text-gray-400 uppercase tracking-widest text-xs">Plan</th>
                                <th className="text-left p-6 font-black text-gray-400 uppercase tracking-widest text-xs">Status</th>
                                <th className="text-right p-6 font-black text-gray-400 uppercase tracking-widest text-xs">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tenants.map((tenant: any) => (
                                <tr key={tenant.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                                    <td className="p-6">
                                        <div className="font-bold text-gray-800">{tenant.companyName}</div>
                                        <div className="text-xs text-gray-400">{tenant.contactEmail}</div>
                                    </td>
                                    <td className="p-6 text-gray-600 font-medium">
                                        <span className="bg-gray-100 px-3 py-1 rounded-lg text-sm">{tenant.subdomain}</span>
                                    </td>
                                    <td className="p-6">
                                        <span className="bg-purple-50 text-purple-700 font-black px-3 py-1 rounded-lg text-xs tracking-wide uppercase">{tenant.subscriptionPlan}</span>
                                    </td>
                                    <td className="p-6">
                                        <span className={`px-3 py-1 rounded-lg text-xs font-black tracking-wide uppercase ${tenant.subscriptionStatus === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                            }`}>
                                            {tenant.subscriptionStatus}
                                        </span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <button
                                            onClick={() => setSelectedTenant(tenant)}
                                            className="px-4 py-2 bg-gray-100 hover:bg-purple-50 hover:text-purple-600 rounded-xl text-xs font-black transition-colors"
                                        >
                                            Manage Features
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Feature Management Modal (Simple overlay for now) */}
                {selectedTenant && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-black text-xl">Manage Features: {selectedTenant.companyName}</h3>
                                <button onClick={() => setSelectedTenant(null)} className="p-2 hover:bg-gray-100 rounded-full"><XCircle /></button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {features.map((feature: any) => (
                                    <div key={feature.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <div>
                                            <div className="font-bold text-gray-800">{feature.name}</div>
                                            <div className="text-xs text-gray-400">{feature.category}</div>
                                        </div>
                                        <button
                                            onClick={() => toggleFeature(feature.id, true)}
                                            className="w-10 h-6 bg-gray-300 rounded-full relative transition-colors hover:bg-purple-200"
                                        >
                                            {/* Toggle switch logic placeholder - assume we query enabled state logic later */}
                                            <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 shadow-sm"></div>
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 text-center text-gray-400 text-sm">
                                Feature state management will be refined in next iteration to show current status.
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

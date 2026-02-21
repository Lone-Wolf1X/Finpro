import { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { useNavigate } from 'react-router-dom';
import { Building2, Activity } from 'lucide-react';

export default function SuperAdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalTenants: 0,
        activeTenants: 0,
        totalUsers: 0 // Mock for now or calculated from tenant list
    });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const response = await adminApi.getAllTenants();
            const tenants = response.data;
            setStats({
                totalTenants: tenants.length,
                activeTenants: tenants.filter((t: any) => t.status === 'ACTIVE').length,
                totalUsers: 0 // Placeholder
            });
        } catch (error) {
            console.error('Failed to load stats', error);
        }
    };

    return (
        <div className="p-8 bg-gray-50/50 min-h-screen">
            <div className="w-full max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
                            Super Admin Console
                        </h1>
                        <p className="text-gray-500 font-bold flex items-center gap-2">
                            <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                            SaaS Platform Management
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/tenants')}
                        className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-2xl font-black shadow-lg hover:shadow-purple-500/30 hover:bg-purple-700 transition-all active:scale-95"
                    >
                        <Building2 size={20} /> Manage Tenants
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/20">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                                <Building2 size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Tenants</p>
                                <h3 className="text-2xl font-black text-gray-800">{stats.totalTenants}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/20">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                                <Activity size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Subscriptions</p>
                                <h3 className="text-2xl font-black text-gray-800">{stats.activeTenants}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/20">
                        <h3 className="text-xl font-black text-gray-800 mb-6">Recent Onboarding</h3>
                        <p className="text-gray-400 italic">No recent activity.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

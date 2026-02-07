import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { Users, UserCheck, UserPlus, Clock } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { DashboardStats } from '@/types';

const Dashboard = () => {
    const { user, tenant } = useAppSelector((state) => state.auth);
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        totalCustomers: 0,
        activeCustomers: 0,
        pendingApprovals: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await apiClient.get<DashboardStats>('/dashboard/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: 'Total Users',
            value: stats.totalUsers,
            icon: Users,
            color: 'text-blue-600',
            gradient: 'from-blue-500 to-blue-600',
            bgLight: 'bg-blue-50',
            trend: '+12% vs last month'
        },
        {
            title: 'Total Customers',
            value: stats.totalCustomers,
            icon: UserCheck,
            color: 'text-emerald-600',
            gradient: 'from-emerald-500 to-emerald-600',
            bgLight: 'bg-emerald-50',
            trend: '+5% vs last month'
        },
        {
            title: 'Active Customers',
            value: stats.activeCustomers,
            icon: UserPlus,
            color: 'text-violet-600',
            gradient: 'from-violet-500 to-violet-600',
            bgLight: 'bg-violet-50',
            trend: '+8% vs last month'
        },
        {
            title: 'Pending Approvals',
            value: stats.pendingApprovals,
            icon: Clock,
            color: 'text-amber-600',
            gradient: 'from-amber-500 to-amber-600',
            bgLight: 'bg-amber-50',
            trend: 'Requires Action'
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Welcome back, {user?.firstName}! 👋
                    </h1>
                    <p className="text-gray-500 mt-1 text-lg">
                        Overview for {tenant?.companyName}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-600 shadow-sm">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards
                    .filter(stat => {
                        if (stat.title === 'Total Users') return user?.role === 'SUPERADMIN' || user?.role === 'ADMIN';
                        if (stat.title === 'Pending Approvals') return user?.role !== 'MAKER';
                        return true;
                    })
                    .map((stat, index) => (
                        <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                                    <h3 className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">
                                        {loading ? (
                                            <div className="h-9 w-24 bg-gray-100 rounded animate-pulse"></div>
                                        ) : (
                                            stat.value
                                        )}
                                    </h3>
                                </div>
                                <div className={`p-3 rounded-xl ${stat.bgLight} group-hover:scale-110 transition-transform duration-300`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                                <span className={`font-medium ${stat.trend === 'Requires Action' ? 'text-amber-600' : 'text-green-600'}`}>
                                    {stat.trend}
                                </span>
                            </div>
                        </div>
                    ))}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Quick Actions */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
                        <span className="text-sm text-primary-600 font-medium cursor-pointer hover:underline">View All</span>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {user?.role === 'SUPERADMIN' && (
                            <button className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-primary-100 hover:bg-primary-50 transition-all group text-left">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="block font-semibold text-gray-900 group-hover:text-primary-700">Create Admin</span>
                                    <span className="text-sm text-gray-500">Add new administrator</span>
                                </div>
                            </button>
                        )}
                        {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && (
                            <>
                                <button className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-primary-100 hover:bg-primary-50 transition-all group text-left">
                                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <UserPlus className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="block font-semibold text-gray-900 group-hover:text-primary-700">Create User</span>
                                        <span className="text-sm text-gray-500">Add staff member</span>
                                    </div>
                                </button>
                            </>
                        )}
                        {user?.role === 'MAKER' && (
                            <button className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-primary-100 hover:bg-primary-50 transition-all group text-left">
                                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <UserPlus className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="block font-semibold text-gray-900 group-hover:text-primary-700">New Customer</span>
                                    <span className="text-sm text-gray-500">Register customer</span>
                                </div>
                            </button>
                        )}
                        {user?.role === 'CHECKER' && (
                            <button className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-primary-100 hover:bg-primary-50 transition-all group text-left">
                                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="block font-semibold text-gray-900 group-hover:text-primary-700">Review Approvals</span>
                                    <span className="text-sm text-gray-500">Check pending items</span>
                                </div>
                            </button>
                        )}
                    </div>
                </div>

                {/* Recent Activity / Role Card */}
                <div className="space-y-6">
                    {/* Role Card */}
                    <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Users className="w-32 h-32" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-primary-100 font-medium mb-1">Current Role</p>
                            <h2 className="text-3xl font-bold mb-4">{user?.role}</h2>
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg text-sm">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                Active Session
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity Mini */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Recent Activity</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">System initialized</p>
                                    <p className="text-xs text-gray-500">Just now</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-gray-300 rounded-full mt-2 flex-shrink-0"></div>
                                <div>
                                    <p className="text-sm text-gray-500">No other recent activity</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

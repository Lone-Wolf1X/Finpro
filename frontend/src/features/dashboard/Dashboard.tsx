import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { Users, UserCheck, UserPlus, Clock, Edit, FileText, Plus, XCircle, Briefcase, TrendingUp } from 'lucide-react';
import { ipoApi, ipoApplicationApi, customerApi } from '@/api/customerApi';
import { IPO, IPOApplication, Customer } from '@/types';
import { useNavigate } from 'react-router-dom';
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
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [ipoApplications, setIpoApplications] = useState<IPOApplication[]>([]);
    const [activeIpos, setActiveIpos] = useState<IPO[]>([]);
    const [selectedAppReport, setSelectedAppReport] = useState<IPOApplication | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.role === 'INVESTOR') {
            fetchInvestorData();
        } else {
            fetchStats();
        }
    }, [user]);

    const fetchInvestorData = async () => {
        try {
            setLoading(true);
            // Find customer record for this user
            const customersRes = await customerApi.getAll();
            const myCustomer = customersRes.data.find(c => c.email === user?.email);

            if (myCustomer) {
                setCustomer(myCustomer);
                const [appsRes, iposRes] = await Promise.all([
                    ipoApplicationApi.getByCustomerId(myCustomer.id),
                    ipoApi.getActive()
                ]);
                setIpoApplications(appsRes.data);
                setActiveIpos(iposRes.data);
            }
        } catch (error) {
            console.error('Failed to fetch investor data:', error);
        } finally {
            setLoading(false);
        }
    };

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
                {(user?.role === 'INVESTOR' ? [
                    {
                        title: 'Total Applications',
                        value: ipoApplications.length,
                        icon: Briefcase,
                        color: 'text-primary-600',
                        bgLight: 'bg-primary-50',
                        trend: 'Your track record'
                    },
                    {
                        title: 'Total Held Amount',
                        value: `रू ${ipoApplications.reduce((sum, app) => sum + (app.amount || 0), 0).toLocaleString()}`,
                        icon: TrendingUp,
                        color: 'text-emerald-600',
                        bgLight: 'bg-emerald-50',
                        trend: 'Current investment'
                    }
                ] : statCards
                    .filter(stat => {
                        if (stat.title === 'Total Users') return user?.role === 'SUPERADMIN' || user?.role === 'ADMIN';
                        if (stat.title === 'Pending Approvals') return user?.role !== 'MAKER';
                        return true;
                    }))
                    .map((stat, index) => (
                        <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                                    <h3 className="text-xl font-bold text-gray-900 mt-2 tracking-tight">
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
                {user?.role === 'INVESTOR' ? (
                    <div className="lg:col-span-3 space-y-8">
                        {/* Active IPOs for Investor */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-900">Current IPO Opportunities</h2>
                                <span className="text-sm text-primary-600 font-medium cursor-pointer hover:underline" onClick={() => navigate('/portfolio')}>My Portfolio</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            <th className="px-6 py-4">IPO Details</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Price</th>
                                            <th className="px-6 py-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {activeIpos.map((ipo) => {
                                            const app = ipoApplications.find(a => a.ipoId === ipo.id);
                                            return (
                                                <tr key={ipo.id} className="hover:bg-gray-50/50 transition-all">
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-gray-900">{ipo.companyName}</p>
                                                        <p className="text-xs text-gray-500">{ipo.symbol}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-black uppercase">
                                                            {ipo.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-gray-900">
                                                        रू {ipo.pricePerShare}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {(() => {
                                                            if (!app) {
                                                                return (
                                                                    <button
                                                                        onClick={() => navigate(`/ipo-applications/new?customerId=${customer?.id}&ipoId=${ipo.id}`)}
                                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-blue-100 shadow-md flex items-center justify-center gap-2"
                                                                    >
                                                                        <Plus size={14} /> Apply
                                                                    </button>
                                                                );
                                                            }
                                                            if (['PENDING_VERIFICATION', 'REJECTED'].includes(app.applicationStatus)) {
                                                                return (
                                                                    <button
                                                                        onClick={() => navigate(`/ipo-applications/${app.id}/edit`)}
                                                                        className="px-4 py-2 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 transition-all shadow-orange-100 shadow-md flex items-center justify-center gap-2 ml-auto"
                                                                    >
                                                                        <Edit size={14} /> Edit
                                                                    </button>
                                                                );
                                                            }
                                                            return (
                                                                <button
                                                                    onClick={() => setSelectedAppReport(app)}
                                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-all shadow-green-100 shadow-md flex items-center justify-center gap-2 ml-auto"
                                                                >
                                                                    <FileText size={14} /> Report
                                                                </button>
                                                            );
                                                        })()}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {activeIpos.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                                    No active IPOs available at the moment.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
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
                                    <button className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-primary-100 hover:bg-primary-50 transition-all group text-left" onClick={() => navigate('/customers/new')}>
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
                                    <button className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-primary-100 hover:bg-primary-50 transition-all group text-left" onClick={() => navigate('/transactions/verify')}>
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
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Application Report Modal (Reusable logic) */}
            {selectedAppReport && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-xl font-black text-gray-900">IPO Application Report</h3>
                                <p className="text-xs font-bold text-primary-500 uppercase tracking-widest mt-1">
                                    APP #{selectedAppReport.applicationNumber || selectedAppReport.id}
                                </p>
                            </div>
                            <button onClick={() => setSelectedAppReport(null)} className="text-gray-400 hover:text-gray-600">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Company</p>
                                    <p className="font-extrabold text-gray-800">{selectedAppReport.ipoCompanyName}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</p>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${selectedAppReport.applicationStatus === 'ALLOTTED' ? 'bg-green-100 text-green-700' :
                                        selectedAppReport.applicationStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                        {selectedAppReport.applicationStatus}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Applied Quantity</p>
                                    <p className="font-bold text-gray-700 font-mono">{selectedAppReport.quantity} Units</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount Held</p>
                                    <p className="font-bold text-gray-700 font-mono">रू {selectedAppReport.amount?.toLocaleString()}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedAppReport(null)}
                                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-gray-800 transition-all shadow-lg"
                            >
                                Close Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;

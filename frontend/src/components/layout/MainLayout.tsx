import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/features/auth/authSlice';
import {
    LayoutDashboard,
    Users,
    UserCog,
    Building2,
    LogOut,
    Menu,
    Landmark,
    Wallet,
    CheckSquare
} from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { customerApi, transactionVerificationApi } from '@/api/customerApi';

const MainLayout = () => {
    const { user, tenant } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [pendingKycCount, setPendingKycCount] = useState(0);
    const [pendingTxCount, setPendingTxCount] = useState(0);

    // Handle screen resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setSidebarOpen(false);
                setIsMobile(true);
            } else {
                setSidebarOpen(true);
                setIsMobile(false);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        // Fetch notifications
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Poll every minute

        return () => {
            window.removeEventListener('resize', handleResize);
            clearInterval(interval);
        };
    }, []);

    const fetchNotifications = async () => {
        if (!user || user.role === 'INVESTOR') return;
        try {
            const kycRes = await customerApi.getAll({ kycStatus: 'PENDING' });
            setPendingKycCount(kycRes.data.length);

            if (['CHECKER', 'ADMIN', 'SUPERADMIN'].includes(user.role)) {
                const txRes = await transactionVerificationApi.getPending();
                setPendingTxCount(txRes.data.length);
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    const handleLogout = () => {
        dispatch(logout());
        toast.success('Logged out successfully');
        navigate('/login');
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['SUPERADMIN', 'ADMIN', 'MAKER', 'CHECKER'] },
        { icon: Users, label: 'User Management', path: '/users', roles: ['SUPERADMIN', 'ADMIN'] },
        { icon: UserCog, label: 'Customer Management', path: '/customers', roles: ['SUPERADMIN', 'ADMIN', 'MAKER', 'CHECKER'], badge: pendingKycCount },
        { icon: Users, label: 'KYC Alignment', path: '/admin/kyc-alignment', roles: ['SUPERADMIN', 'ADMIN'] },
        { icon: Landmark, label: 'Banking Operations', path: '/banking/operations', roles: ['MAKER', 'ADMIN', 'SUPERADMIN'] },
        { icon: CheckSquare, label: 'Verify Transactions', path: '/transactions/verify', roles: ['CHECKER', 'ADMIN', 'SUPERADMIN'], badge: pendingTxCount },
        { icon: CheckSquare, label: 'IPO Applications', path: '/ipo-applications', roles: ['SUPERADMIN', 'ADMIN', 'CHECKER'] },
        { icon: LayoutDashboard, label: 'IPO Listings', path: '/ipos', roles: ['SUPERADMIN', 'ADMIN', 'CHECKER'] },
        { icon: Landmark, label: 'Manage Banks', path: '/banks', roles: ['SUPERADMIN', 'ADMIN'] },
        { icon: LayoutDashboard, label: 'System Accounts', path: '/admin/system-accounts', roles: ['SUPERADMIN', 'ADMIN'] },
        { icon: Wallet, label: 'Bulk Deposit', path: '/bulk-deposits/create', roles: ['SUPERADMIN', 'ADMIN', 'MAKER'] },
        { icon: Wallet, label: 'Verify Bulk Deposits', path: '/bulk-deposits/verify', roles: ['SUPERADMIN', 'ADMIN', 'CHECKER'] },
        { icon: Building2, label: 'Tenant Settings', path: '/tenant', roles: ['SUPERADMIN', 'ADMIN'] },
    ];

    const filteredMenuItems = menuItems.filter(item =>
        user && item.roles.includes(user.role)
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top Navigation */}
            <nav className="bg-white border-b border-gray-200 fixed w-full z-30 transition-all duration-300">
                <div className="px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                            aria-label="Toggle sidebar"
                        >
                            {sidebarOpen ? <Menu className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">FP</div>
                            <span className="text-xl font-bold text-gray-900 hidden sm:block">Finpro</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                                <p className="text-xs text-gray-500">{user?.role}</p>
                            </div>
                            <div className="relative group cursor-pointer">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-medium shadow-md border-2 border-white">
                                    {user?.firstName?.charAt(0) || 'U'}
                                </div>

                                {/* Dropdown Menu - Added pt-2 to create a hover bridge */}
                                <div className="absolute right-0 top-full pt-2 w-48 hidden group-hover:block animate-in fade-in slide-in-from-top-2 z-50">
                                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                                            <p className="text-sm font-medium text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
                                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex pt-16 h-screen overflow-hidden">
                {/* Sidebar */}
                <aside
                    className={`fixed lg:static inset-y-0 left-0 z-20 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-20'
                        } flex flex-col pt-16 lg:pt-0`}
                >
                    <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                        {filteredMenuItems.map((item) => (
                            <Link
                                key={item.label}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
                                    ${location.pathname === item.path
                                        ? 'bg-primary-50 text-primary-700 font-medium'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                title={!sidebarOpen ? item.label : ''}
                            >
                                <item.icon className={`w-5 h-5 flex-shrink-0 ${location.pathname === item.path ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                <span className={`whitespace-nowrap transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
                                    {item.label}
                                </span>
                                {(item as any).badge > 0 && (
                                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        {(item as any).badge}
                                    </span>
                                )}

                                {!sidebarOpen && (
                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 hidden lg:block">
                                        {item.label}
                                    </div>
                                )}
                            </Link>
                        ))}
                    </div>

                    {/* Sidebar Footer */}
                    <div className="p-4 border-t border-gray-100 mt-auto">
                        <div className={`flex flex-col gap-4 ${!sidebarOpen && 'items-center'}`}>
                            {/* Tenant Info */}
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                    <Building2 className="w-4 h-4" />
                                </div>
                                {sidebarOpen && (
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-medium text-gray-900 truncate">{tenant?.companyName}</p>
                                        <p className="text-xs text-gray-500">Tenant ID: {tenant?.tenantKey}</p>
                                    </div>
                                )}
                            </div>

                            {/* Easy Logout Button */}
                            <button
                                onClick={handleLogout}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full
                                    ${!sidebarOpen ? 'justify-center p-2' : ''}`}
                                title="Sign out"
                            >
                                <LogOut className="w-5 h-5 flex-shrink-0" />
                                {sidebarOpen && <span className="text-sm font-medium">Log out</span>}
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Mobile Sidebar Overlay */}
                {isMobile && sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-10 lg:hidden backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Main Content */}
                <main className="flex-1 overflow-auto bg-gray-50 p-4 lg:p-8 w-full relative">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;

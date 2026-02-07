import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerApi } from '../../api/customerApi';
import apiClient from '../../api/apiClient';
import { Customer } from '../../types';
import {
    Users,
    Link,
    UserPlus,
    Loader2,
    Search,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Investor {
    id: number;
    userId: number;
    firstName?: string; // Derived from user normally, but DTO might have it
    lastName?: string;
    email?: string;     // From user
    investorCode: string;
    nickname: string;
    status: string;
}

export default function KYCAlignment() {
    const navigate = useNavigate();
    const [investors, setInvestors] = useState<Investor[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [investorsRes, customersRes] = await Promise.all([
                apiClient.get<Investor[]>('/investors'), // Assuming GET /api/investors exists
                customerApi.getAll()
            ]);
            setInvestors(investorsRes.data);
            setCustomers(customersRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load KYC alignment data');
        } finally {
            setLoading(false);
        }
    };

    const getLinkedCustomer = (investorId: number) => {
        // Customer DTO should have investorId. I added it to backend DTO.
        // Frontend Customer interface does not have it yet.
        return customers.find((c: any) => c.investorId === investorId);
    };

    const handleCreateProfile = (investor: Investor) => {
        // Navigate to customer creation with pre-filled data
        navigate('/customers/create', {
            state: {
                prefill: {
                    // Since investor fetched might not have full user details if generic DTO
                    // we might need to fetch user details or just pass what we have
                    firstName: investor.nickname?.split(' ')[0] || '',
                    lastName: investor.nickname?.split(' ').slice(1).join(' ') || '',
                    // email not in standard Investor DTO?
                    remarks: `Linked to Investor: ${investor.investorCode}`
                },
                investorId: investor.id
            }
        });
    };

    const normalizeSearch = (str?: string) => (str || '').toLowerCase();

    const filteredInvestors = investors.filter(inv => {
        const query = normalizeSearch(searchTerm);
        return (
            normalizeSearch(inv.investorCode).includes(query) ||
            normalizeSearch(inv.nickname).includes(query)
        );
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">KYC Alignment</h1>
                <p className="text-gray-500 font-medium mt-1">Link Investors to Customer Profiles for Banking Operations</p>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search investors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium"
                />
            </div>

            {/* Table */}
            {loading ? (
                <div className="text-center py-20">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">Loading alignment data...</p>
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Investor</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Linked Profile</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredInvestors.map(investor => {
                                const linkedCustomer = getLinkedCustomer(investor.id);
                                return (
                                    <tr key={investor.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                                    <Users size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{investor.nickname}</p>
                                                    <p className="text-xs font-mono text-gray-400">{investor.investorCode}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${investor.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {investor.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {linkedCustomer ? (
                                                <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
                                                    <CheckCircle2 size={16} />
                                                    {linkedCustomer.fullName} ({linkedCustomer.customerCode})
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-orange-500 font-medium text-sm">
                                                    <AlertCircle size={16} />
                                                    Pending KYC
                                                </div>
                                            )}
                                        </td>
                                        <td className="text-right px-6 py-4">
                                            {linkedCustomer ? (
                                                <button
                                                    onClick={() => navigate(`/customers/${linkedCustomer.id}`)}
                                                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors inline-flex items-center gap-2"
                                                >
                                                    <Link size={14} /> View Profile
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleCreateProfile(investor)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all inline-flex items-center gap-2"
                                                >
                                                    <UserPlus size={14} /> Create Profile
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

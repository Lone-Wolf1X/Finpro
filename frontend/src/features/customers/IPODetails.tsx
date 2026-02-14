import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ipoApi } from '../../api/customerApi';
import { IPO, IPOStatus } from '../../types';
import { Check, Clock, ArrowLeft, DollarSign, PieChart, Briefcase } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function IPODetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [ipo, setIpo] = useState<IPO | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadIPO(Number(id));
        }
    }, [id]);

    const loadIPO = async (ipoId: number) => {
        try {
            setLoading(true);
            const response = await ipoApi.getById(ipoId);
            setIpo(response.data);
        } catch (error) {
            console.error('Failed to load IPO details:', error);
            toast.error('Failed to load IPO details');
            navigate('/ipos');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NP', {
            style: 'currency',
            currency: 'NPR'
        }).format(amount);
    };

    const getStatusStepIndex = (status: IPOStatus) => {
        const steps: IPOStatus[] = ['UPCOMING', 'OPEN', 'CLOSED', 'ALLOTTED', 'LISTED'];
        return steps.indexOf(status);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!ipo) {
        return <div className="text-center py-12">IPO not found</div>;
    }

    const currentStepIndex = getStatusStepIndex(ipo.status);
    const steps = [
        { label: 'Upcoming', status: 'UPCOMING' },
        { label: 'Open', status: 'OPEN' },
        { label: 'Closed', status: 'CLOSED' },
        { label: 'Allotted', status: 'ALLOTTED' },
        { label: 'Listed', status: 'LISTED' }
    ];

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            {/* Header / Back Button */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/ipos')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-600" />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-gray-900">{ipo.companyName}</h1>
                    <div className="flex items-center gap-2 text-gray-500 font-medium">
                        <Briefcase size={16} />
                        <span>{ipo.symbol || 'Symbol N/A'}</span>
                    </div>
                </div>
            </div>

            {/* Timeline Stepper */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-8 border-b border-gray-50 pb-4">IPO Timeline</h3>
                <div className="relative flex justify-between">
                    {/* Connecting Line */}
                    <div className="absolute top-4 left-0 w-full h-1 bg-gray-100 -z-0 rounded-full"></div>
                    <div
                        className="absolute top-4 left-0 h-1 bg-primary-500 -z-0 rounded-full transition-all duration-500"
                        style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                    ></div>

                    {steps.map((step, index) => {
                        const isCompleted = index <= currentStepIndex;
                        const isCurrent = index === currentStepIndex;

                        return (
                            <div key={step.status} className="flex flex-col items-center relative z-10 group">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 font-bold ${isCompleted
                                        ? 'bg-primary-600 border-primary-100 text-white shadow-lg shadow-primary-200'
                                        : 'bg-white border-gray-200 text-gray-300'
                                        } ${isCurrent ? 'scale-125 ring-4 ring-primary-50' : ''}`}
                                >
                                    {isCompleted ? <Check size={16} strokeWidth={4} /> : index + 1}
                                </div>
                                <span className={`mt-4 text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${isCompleted ? 'text-primary-700' : 'text-gray-400'
                                    }`}>
                                    {step.label}
                                </span>
                                {isCurrent && (
                                    <span className="absolute -bottom-6 text-[10px] font-black text-white bg-primary-600 px-2 py-0.5 rounded-full animate-bounce">
                                        CURRENT
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Details */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-900">Issue Highlights</h3>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                    <DollarSign size={14} /> Price Per Share
                                </p>
                                <p className="text-2xl font-black text-gray-900">{formatCurrency(ipo.pricePerShare)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                    <PieChart size={14} /> Issue Size
                                </p>
                                <p className="text-2xl font-black text-gray-900">{ipo.issueSize.toLocaleString()} Units</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Min Quantity</p>
                                <p className="text-lg font-bold text-gray-800">{ipo.minQuantity.toLocaleString()} Units</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Max Quantity</p>
                                <p className="text-lg font-bold text-gray-800">{ipo.maxQuantity.toLocaleString()} Units</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-900">About the Company</h3>
                        </div>
                        <div className="p-8">
                            <p className="text-gray-600 leading-relaxed">
                                {ipo.description || 'No description available for this IPO.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sidebar / Dates / Actions */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-50 pb-2">Important Dates</h3>
                        <div className="space-y-6">
                            <div className="relative pl-6 border-l-2 border-blue-100">
                                <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white"></div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Opening Date</p>
                                <p className="font-bold text-gray-900">{formatDate(ipo.openDate)}</p>
                            </div>
                            <div className="relative pl-6 border-l-2 border-red-100">
                                <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-4 ring-white"></div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Closing Date</p>
                                <p className="font-bold text-gray-900">{formatDate(ipo.closeDate)}</p>
                            </div>
                            <div className="relative pl-6 border-l-2 border-purple-100">
                                <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-purple-500 ring-4 ring-white"></div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Allotment Date</p>
                                <p className="font-bold text-gray-900">{formatDate(ipo.allotmentDate)}</p>
                            </div>
                            <div className="relative pl-6 border-l-2 border-green-100">
                                <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-green-500 ring-4 ring-white"></div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Listing Date</p>
                                <p className="font-bold text-gray-900">{formatDate(ipo.listingDate)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Box */}
                    <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl shadow-lg shadow-primary-200 text-white p-8 text-center">
                        <h3 className="text-xl font-bold mb-2">Interested?</h3>
                        {ipo.isOpen ? (
                            <>
                                <p className="text-primary-100 mb-6 text-sm">Applications are currently open! Apply before the closing date.</p>
                                <button
                                    onClick={() => navigate(`/ipo-applications/new?ipoId=${ipo.id}`)}
                                    className="w-full py-4 bg-white text-primary-700 rounded-xl font-black hover:bg-primary-50 transition-all shadow-md transform hover:-translate-y-1"
                                >
                                    Apply Now
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="text-primary-100 mb-4 text-sm font-medium">Applications are currently closed.</p>
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-xs font-bold backdrop-blur-sm">
                                    <Clock size={14} />
                                    <span>Status: {ipo.status}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

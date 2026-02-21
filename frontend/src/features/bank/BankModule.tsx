import { useState, useRef, useEffect } from 'react';
import ABCI from './ABCI';
import ALM from './ALM';
import ATB from './ATB';
import { Search, Lock, Zap, MousePointer2, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

type MenuType = 'ABCI' | 'ALM' | 'ATB';

export default function BankModule() {
    const [activeTab, setActiveTab] = useState<MenuType>('ABCI');
    const [shortcut, setShortcut] = useState('');
    const shortcutRef = useRef<HTMLInputElement>(null);

    const handleShortcut = (e: React.FormEvent) => {
        e.preventDefault();
        const code = shortcut.toUpperCase().trim();
        if (code === 'ABCI' || code === 'ALM' || code === 'ATB') {
            setActiveTab(code);
            setShortcut('');
            toast.success(`Navigated to ${code}`);
        } else {
            toast.error('Invalid shortcut code');
        }
    };

    // Global shortcut focus (Ctrl+M or similar could be added)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'q') { // Ctrl+Q for fast focus
                e.preventDefault();
                shortcutRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header & Shortcut Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Core Banking</h1>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                            Finpro-Terminal v2.0
                        </span>
                        <div className="h-1 w-1 bg-gray-300 rounded-full" />
                        <p className="text-gray-500 font-bold text-sm">System for Real-time Account Operations</p>
                    </div>
                </div>

                <form onSubmit={handleShortcut} className="w-full md:w-80 group relative">
                    <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500 animate-pulse" size={18} />
                    <input
                        ref={shortcutRef}
                        type="text"
                        placeholder="Enter Shortcut (ABCI, ATB, ALM)"
                        value={shortcut}
                        onChange={(e) => setShortcut(e.target.value)}
                        className="w-full pl-12 pr-12 py-4 bg-white border-2 border-gray-100 focus:border-primary-600 rounded-2xl outline-none font-black text-sm transition-all shadow-sm group-hover:shadow-md"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-40">
                        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-bold">^</kbd>
                        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-bold">Q</kbd>
                    </div>
                </form>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap bg-white p-2 rounded-[2rem] border border-gray-100 shadow-sm w-fit gap-1">
                <button
                    onClick={() => setActiveTab('ABCI')}
                    className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'ABCI'
                            ? 'bg-gray-900 text-white shadow-lg scale-105'
                            : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                >
                    <Search size={16} />
                    ABCI
                </button>
                <button
                    onClick={() => setActiveTab('ATB')}
                    className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'ATB'
                            ? 'bg-gray-900 text-white shadow-lg scale-105'
                            : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                >
                    <CreditCard size={16} />
                    ATB
                </button>
                <button
                    onClick={() => setActiveTab('ALM')}
                    className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'ALM'
                            ? 'bg-gray-900 text-white shadow-lg scale-105'
                            : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                >
                    <Lock size={16} />
                    ALM
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50 p-8 min-h-[600px] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <MousePointer2 size={300} strokeWidth={1} />
                </div>
                <div className="relative z-10">
                    {activeTab === 'ABCI' && <ABCI />}
                    {activeTab === 'ATB' && <ATB />}
                    {activeTab === 'ALM' && <ALM />}
                </div>
            </div>
        </div>
    );
}

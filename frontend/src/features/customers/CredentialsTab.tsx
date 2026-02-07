import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Key, Shield } from 'lucide-react';

interface CustomerCredential {
    id: number;
    credentialType: string;
    username?: string;
    notes?: string;
    createdAt: string;
}

interface CredentialsTabProps {
    customerId: number;
}

const CREDENTIAL_TYPES = [
    { value: 'MEROSHARE', label: 'Meroshare', icon: '📈' },
    { value: 'TMS', label: 'TMS', icon: '💹' },
    { value: 'MOBILE_BANKING', label: 'Mobile Banking', icon: '📱' },
    { value: 'ATM_PIN', label: 'ATM PIN', icon: '🏧' },
    { value: 'TRANSACTION_PIN', label: 'Transaction PIN', icon: '🔐' }
];

export default function CredentialsTab({ customerId }: CredentialsTabProps) {
    const [credentials, setCredentials] = useState<CustomerCredential[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        credentialType: '',
        username: '',
        password: '',
        pin: '',
        notes: ''
    });

    useEffect(() => {
        loadCredentials();
    }, [customerId]);

    const loadCredentials = async () => {
        try {
            const response = await fetch(`/api/customers/${customerId}/credentials`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            setCredentials(data);
        } catch (err) {
            console.error('Failed to load credentials:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingId
            ? `/api/customers/${customerId}/credentials/${editingId}`
            : `/api/customers/${customerId}/credentials`;
        const method = editingId ? 'PUT' : 'POST';

        try {
            await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });
            loadCredentials();
            setShowModal(false);
            resetForm();
        } catch (err) {
            console.error('Failed to save credential:', err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this credential?')) return;

        try {
            await fetch(`/api/customers/${customerId}/credentials/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            loadCredentials();
        } catch (err) {
            console.error('Failed to delete credential:', err);
        }
    };

    const resetForm = () => {
        setFormData({ credentialType: '', username: '', password: '', pin: '', notes: '' });
        setEditingId(null);
    };

    const getTypeLabel = (type: string) => {
        return CREDENTIAL_TYPES.find(t => t.value === type)?.label || type;
    };

    return (
        <div className="space-y-6">
            {/* Security Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <Shield className="text-amber-600 mt-0.5" size={20} />
                <div className="flex-1">
                    <h4 className="font-semibold text-amber-900 mb-1">Sensitive Information</h4>
                    <p className="text-sm text-amber-700">
                        This section contains sensitive customer credentials. All data is encrypted and access is logged for security purposes.
                    </p>
                </div>
            </div>

            {/* Add Button */}
            <button
                onClick={() => { resetForm(); setShowModal(true); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md"
            >
                <Plus size={18} />
                Add Credential
            </button>

            {/* Credentials List */}
            <div className="grid gap-4">
                {credentials.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <Key size={48} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No credentials saved yet</p>
                    </div>
                ) : (
                    credentials.map((cred) => (
                        <div key={cred.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl">{CREDENTIAL_TYPES.find(t => t.value === cred.credentialType)?.icon}</span>
                                        <h4 className="font-semibold text-gray-900">{getTypeLabel(cred.credentialType)}</h4>
                                    </div>
                                    {cred.username && (
                                        <p className="text-sm text-gray-600 mb-1">
                                            <span className="font-medium">Username:</span> {cred.username}
                                        </p>
                                    )}
                                    {cred.notes && (
                                        <p className="text-sm text-gray-500 italic">{cred.notes}</p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setFormData(cred as any); setEditingId(cred.id); setShowModal(true); }}
                                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cred.id)}
                                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold">{editingId ? 'Edit' : 'Add'} Credential</h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">Type *</label>
                                <select
                                    value={formData.credentialType}
                                    onChange={(e) => setFormData({ ...formData, credentialType: e.target.value })}
                                    className="w-full px-4 py-3 border rounded-xl"
                                    required
                                >
                                    <option value="">Select Type</option>
                                    {CREDENTIAL_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2">Username</label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full px-4 py-3 border rounded-xl"
                                />
                            </div>
                            {!['ATM_PIN', 'TRANSACTION_PIN'].includes(formData.credentialType) && (
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Password</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-4 py-3 border rounded-xl"
                                    />
                                </div>
                            )}
                            {['ATM_PIN', 'TRANSACTION_PIN'].includes(formData.credentialType) && (
                                <div>
                                    <label className="block text-sm font-semibold mb-2">PIN</label>
                                    <input
                                        type="password"
                                        value={formData.pin}
                                        onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                                        className="w-full px-4 py-3 border rounded-xl"
                                        maxLength={6}
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-semibold mb-2">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-4 py-3 border rounded-xl"
                                    rows={3}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                    className="flex-1 px-6 py-3 border rounded-xl font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold"
                                >
                                    {editingId ? 'Update' : 'Add'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

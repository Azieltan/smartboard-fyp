'use client';

import { useState } from 'react';
import { api } from '../lib/api';

interface AddFriendModalProps {
    userId: string;
    onClose: () => void;
}

export default function AddFriendModal({ userId, onClose }: AddFriendModalProps) {
    const [identifier, setIdentifier] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!identifier.trim()) return;

        setStatus('loading');
        setErrorMsg('');

        try {
            await api.post('/friends', {
                userId,
                friendIdentifier: identifier.trim()
            });
            setStatus('success');
            setTimeout(onClose, 1500);
        } catch (error: any) {
            setStatus('error');
            setErrorMsg(error.response?.data?.error || 'Failed to add friend. User might not exist.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md transform transition-all scale-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">Add Friend</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Friend's Email or User ID
                        </label>
                        <input
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-800 placeholder-slate-400"
                            placeholder="e.g. john@example.com or USER123"
                            required
                            autoFocus
                        />
                    </div>

                    {status === 'success' && (
                        <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium flex items-center gap-2">
                            ✅ Friend request sent successfully!
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium flex items-center gap-2">
                            ⚠️ {errorMsg}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={status === 'loading' || status === 'success'}
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20"
                        >
                            {status === 'loading' ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Adding...
                                </span>
                            ) : 'Send Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

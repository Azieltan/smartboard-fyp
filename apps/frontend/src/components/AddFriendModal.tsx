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
            <div className="glass-panel-glow bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/10 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Add Friend</h2>
                            <p className="text-sm text-slate-400">Connect with teammates 🤝</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Friend's Email or User ID
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all placeholder-slate-500"
                                placeholder="e.g. john@example.com"
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Status Messages */}
                    {status === 'success' && (
                        <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-medium flex items-center gap-3 animate-in slide-in-from-bottom-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/30 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            Friend request sent successfully!
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="p-4 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium flex items-center gap-3 animate-in slide-in-from-bottom-2">
                            <div className="w-8 h-8 rounded-full bg-red-500/30 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            {errorMsg}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl font-medium transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={status === 'loading' || status === 'success'}
                            className="px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-pink-500/30 flex items-center gap-2"
                        >
                            {status === 'loading' ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Adding...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    <span>Send Request</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

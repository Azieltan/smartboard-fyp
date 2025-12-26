'use client';

import { useState } from 'react';
import { api } from '../lib/api';

interface JoinGroupModalProps {
    userId: string;
    onClose: () => void;
    onGroupJoined: () => void;
}

export default function JoinGroupModal({ userId, onClose, onGroupJoined }: JoinGroupModalProps) {
    const [code, setCode] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;

        setStatus('loading');
        setErrorMsg('');

        try {
            await api.post('/groups/join', {
                code: code.trim().toUpperCase(),
                userId
            });
            setStatus('success');
            onGroupJoined();
            setTimeout(onClose, 1000);
        } catch (error: any) {
            setStatus('error');
            setErrorMsg(error.response?.data?.error || 'Invalid join code');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="glass-panel-glow bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/10 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Join Group</h2>
                            <p className="text-sm text-slate-400">Enter a code to join a team 🧩</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Invite Code</label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all uppercase placeholder-slate-500"
                            placeholder="e.g. ABCDEF"
                            required
                            autoFocus
                        />
                    </div>

                    {status === 'error' && (
                        <div className="p-4 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium">
                            {errorMsg}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                        <button type="button" onClick={onClose} className="px-6 py-3 text-slate-400 hover:text-white rounded-xl font-medium transition-all">Cancel</button>
                        <button
                            type="submit"
                            disabled={status === 'loading' || status === 'success'}
                            className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl font-bold disabled:opacity-50 transition-all shadow-lg"
                        >
                            {status === 'loading' ? 'Joining...' : 'Join Group'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

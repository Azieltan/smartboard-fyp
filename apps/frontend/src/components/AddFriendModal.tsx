'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface UserPreview {
    user_id: string;
    user_name: string;
    email: string;
}

interface AddFriendModalProps {
    userId: string;
    onClose: () => void;
}

export default function AddFriendModal({ userId, onClose }: AddFriendModalProps) {
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserPreview[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserPreview | null>(null);
    const [status, setStatus] = useState<'idle' | 'searching' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length >= 3) {
                handleSearch();
            } else {
                setSearchResults([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [query]);

    const handleSearch = async () => {
        setStatus('searching');
        try {
            const data = await api.get(`/users/search?query=${query}`);
            if (Array.isArray(data)) {
                // Filter out self
                setSearchResults(data.filter(u => u.user_id !== userId));
            }
        } catch (e) {
            console.error('Search failed', e);
        } finally {
            setStatus('idle');
        }
    };

    const handleSendRequest = async () => {
        if (!selectedUser) return;

        setStatus('loading');
        setErrorMsg('');

        try {
            await api.post('/friends', {
                userId,
                friendIdentifier: selectedUser.user_id
            });
            setStatus('success');
            setTimeout(onClose, 1500);
        } catch (error: any) {
            setStatus('error');
            setErrorMsg(error.response?.data?.error || 'Failed to send request');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
            <div className="glass-panel-glow bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/10 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Add Friend</h2>
                            <p className="text-sm text-slate-400">Find teammates by name or email</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="space-y-6">
                    {!selectedUser ? (
                        <div className="space-y-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all placeholder-slate-500"
                                    placeholder="Search by name, email, or ID..."
                                    autoFocus
                                />
                            </div>

                            {status === 'searching' && <div className="text-center py-4 text-slate-400 text-sm">Searching...</div>}

                            <div className="max-h-[200px] overflow-y-auto space-y-2 custom-scrollbar">
                                {searchResults.map(user => (
                                    <button
                                        key={user.user_id}
                                        onClick={() => setSelectedUser(user)}
                                        className="w-full p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 flex items-center gap-3 transition-all"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-bold text-white shrink-0">
                                            {user.user_name[0].toUpperCase()}
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-white truncate">{user.user_name}</p>
                                            <p className="text-xs text-slate-400 truncate tracking-tight">{user.user_id}</p>
                                        </div>
                                        <div className="text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                        </div>
                                    </button>
                                ))}
                                {query.length >= 3 && searchResults.length === 0 && status !== 'searching' && (
                                    <div className="text-center py-4 text-slate-500 text-sm italic">No users found</div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl mb-4">
                                    {selectedUser.user_name[0].toUpperCase()}
                                </div>
                                <h3 className="text-xl font-bold text-white">{selectedUser.user_name}</h3>
                                <p className="text-sm text-slate-400 mb-6">{selectedUser.email}</p>

                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="text-xs text-slate-500 hover:text-white transition-colors underline"
                                >
                                    Not who you're looking for? Search again
                                </button>
                            </div>

                            {status === 'success' && (
                                <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-medium flex items-center gap-3">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Friend request sent!
                                </div>
                            )}

                            {status === 'error' && (
                                <div className="p-4 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-xs font-medium">
                                    {errorMsg}
                                </div>
                            )}

                            <div className="flex gap-3 pt-4 border-t border-white/10">
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="flex-1 py-3 text-slate-400 hover:text-white font-medium transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSendRequest}
                                    disabled={status === 'loading' || status === 'success'}
                                    className="flex-[2] py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white rounded-xl font-bold disabled:opacity-50 transition-all shadow-lg"
                                >
                                    {status === 'loading' ? 'Sending...' : 'Send Request'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

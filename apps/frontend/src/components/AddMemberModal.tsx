'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface UserPreview {
    user_id: string;
    user_name: string;
    email: string;
}

interface AddMemberModalProps {
    groupId: string;
    userId: string;
    onClose: () => void;
    onMemberAdded?: () => void;
}

export default function AddMemberModal({ groupId, userId, onClose, onMemberAdded }: AddMemberModalProps) {
    const [query, setQuery] = useState('');
    const [friends, setFriends] = useState<any[]>([]);
    const [selectedFriend, setSelectedFriend] = useState<any | null>(null);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        fetchFriends();
    }, []);

    const fetchFriends = async () => {
        try {
            const data = await api.get(`/friends/${userId}`);
            if (Array.isArray(data)) {
                // Only show accepted friends
                setFriends(data.filter(f => f.status === 'accepted'));
            }
        } catch (e) {
            console.error('Failed to fetch friends', e);
        }
    };

    const handleAddMember = async () => {
        if (!selectedFriend) return;

        setStatus('loading');
        setErrorMsg('');

        try {
            await api.post(`/groups/${groupId}/members`, {
                userId: selectedFriend.friend_details.user_id,
                role: 'member'
            });
            setStatus('success');
            if (onMemberAdded) onMemberAdded();
            setTimeout(onClose, 1500);
        } catch (error: any) {
            setStatus('error');
            setErrorMsg(error.response?.data?.error || 'Failed to add member. They might already be in the group.');
        }
    };

    const filteredFriends = friends.filter(f =>
        f.friend_details.user_name.toLowerCase().includes(query.toLowerCase()) ||
        f.friend_details.email.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
            <div className="glass-panel-glow bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/10 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Add Member</h2>
                            <p className="text-sm text-slate-400">Invite friends to your group</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {!selectedFriend ? (
                    <div className="space-y-4">
                        <div className="relative">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full pl-4 pr-12 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder-slate-500 text-sm"
                                placeholder="Search friends by name or email..."
                                autoFocus
                            />
                        </div>

                        <div className="max-h-[300px] overflow-y-auto space-y-2 custom-scrollbar">
                            {filteredFriends.length > 0 ? (
                                filteredFriends.map(friend => (
                                    <button
                                        key={friend.relationship_id}
                                        onClick={() => setSelectedFriend(friend)}
                                        className="w-full p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 flex items-center gap-3 transition-all text-left"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                                            {friend.friend_details.user_name[0].toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-white truncate">{friend.friend_details.user_name}</p>
                                            <p className="text-xs text-slate-500 truncate">{friend.friend_details.email}</p>
                                        </div>
                                        <div className="text-blue-500">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="text-center py-8 text-slate-500 text-sm italic">
                                    {friends.length === 0 ? "You haven't added any friends yet." : "No matching friends found."}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl mb-4">
                                {selectedFriend.friend_details.user_name[0].toUpperCase()}
                            </div>
                            <h3 className="text-xl font-bold text-white">{selectedFriend.friend_details.user_name}</h3>
                            <p className="text-sm text-slate-400 mb-6">{selectedFriend.friend_details.email}</p>
                        </div>

                        {status === 'success' && (
                            <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-medium flex items-center gap-3">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Member added successfully!
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="p-4 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-xs font-medium">
                                {errorMsg}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4 border-t border-white/10">
                            <button
                                onClick={() => setSelectedFriend(null)}
                                className="flex-1 py-3 text-slate-400 hover:text-white font-medium transition-all"
                                disabled={status === 'loading' || status === 'success'}
                            >
                                Back
                            </button>
                            <button
                                onClick={handleAddMember}
                                disabled={status === 'loading' || status === 'success'}
                                className="flex-[2] py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold disabled:opacity-50 transition-all shadow-lg"
                            >
                                {status === 'loading' ? 'Adding...' : 'Add to Group'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

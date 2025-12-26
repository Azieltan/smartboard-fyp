'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface Friend {
    id: string;
    user_id: string;
    friend_id: string;
    status: 'pending' | 'accepted';
    friend_details: {
        user_id: string;
        user_name: string;
        email: string;
    };
}

export default function FriendList({ userId }: { userId: string }) {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) fetchFriends();
    }, [userId]);

    const fetchFriends = async () => {
        try {
            const data = await api.get(`/friends/${userId}`);
            if (Array.isArray(data)) {
                setFriends(data);
            } else {
                setFriends([]);
            }
        } catch (error) {
            console.error('Failed to fetch friends:', error);
            setFriends([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (id: string) => {
        try {
            await api.put(`/friends/${id}/accept`, {});
            fetchFriends();
        } catch (error) {
            alert('Failed to accept friend request');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this friend?')) return;
        try {
            await api.delete(`/friends/${id}`);
            fetchFriends();
        } catch (error) {
            alert('Failed to remove friend');
        }
    };

    const pendingRequests = friends.filter(f => f.status === 'pending' && (f as any).friend_id === userId);
    const acceptedFriends = friends.filter(f => f.status === 'accepted');

    if (loading) return <div className="animate-pulse h-20 bg-white/5 rounded-xl"></div>;

    return (
        <div className="space-y-6">
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
                <div className="glass-panel p-6 border-l-4 border-l-pink-500">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                        </span>
                        Pending Requests
                    </h3>
                    <div className="space-y-3">
                        {pendingRequests.map((friend) => (
                            <div key={friend.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                                <div>
                                    <p className="text-white font-medium">{friend.friend_details.user_name}</p>
                                    <p className="text-xs text-slate-400">{friend.friend_details.email}</p>
                                </div>
                                <button
                                    onClick={() => handleAccept((friend as any).relationship_id)}
                                    className="px-4 py-1.5 bg-pink-500 hover:bg-pink-600 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-pink-500/20"
                                >
                                    Accept
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Friends List */}
            <div className="glass-panel p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Friends ({acceptedFriends.length})
                </h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {acceptedFriends.length > 0 ? (
                        acceptedFriends.map((friend) => (
                            <div key={friend.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                                    {friend.friend_details.user_name[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium truncate group-hover:text-indigo-300 transition-colors">
                                        {friend.friend_details.user_name}
                                    </p>
                                    <p className="text-xs text-slate-400 truncate">{friend.friend_details.email}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                    <button
                                        onClick={() => handleDelete(friend.id)}
                                        className="text-slate-500 hover:text-red-500 transition-colors p-1"
                                        title="Remove Friend"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                                <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <p className="text-slate-400 text-sm">No friends yet. Add some!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

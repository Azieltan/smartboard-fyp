'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface Group {
    group_id: string;
    name: string;
    user_id: string;
    join_code?: string;
    requires_approval?: boolean;
    role?: string;
}

interface GroupListProps {
    userId: string;
    onSelectGroup: (groupId: string) => void;
}

export default function GroupList({ userId, onSelectGroup }: GroupListProps) {
    const [groups, setGroups] = useState<Group[]>([]);
    const [friends, setFriends] = useState<any[]>([]);
    const [pendingMembers, setPendingMembers] = useState<Record<string, any[]>>({});
    const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

    // Create Group State
    const [newGroupName, setNewGroupName] = useState('');
    const [requiresApproval, setRequiresApproval] = useState(false);
    const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    // Join Group State
    const [isJoining, setIsJoining] = useState(false);
    const [joinCode, setJoinCode] = useState('');

    useEffect(() => {
        if (userId) {
            fetchGroups();
            fetchFriends();
        }
    }, [userId]);

    const fetchGroups = async () => {
        try {
            const data = await api.get(`/groups/${userId}`);
            if (Array.isArray(data)) {
                setGroups(data);
                // Fetch pending members for owned groups
                data.forEach(g => {
                    if (g.user_id === userId) fetchPending(g.group_id);
                });
            }
        } catch (e) {
            console.error("Failed to fetch groups", e);
        }
    };

    const fetchPending = async (groupId: string) => {
        try {
            const data = await api.get(`/groups/${groupId}/pending`);
            setPendingMembers(prev => ({ ...prev, [groupId]: data }));
        } catch (e) {
            console.error("Failed to fetch pending", e);
        }
    };

    const fetchFriends = async () => {
        try {
            const data = await api.get(`/friends/${userId}`);
            if (Array.isArray(data)) {
                setFriends(data.filter(f => f.status === 'accepted'));
            }
        } catch (e) {
            console.error("Failed to fetch friends", e);
        }
    };

    const createGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;

        try {
            await api.post('/groups', {
                name: newGroupName,
                ownerId: userId,
                requiresApproval,
                friendIds: selectedFriendIds
            });
            setNewGroupName('');
            setRequiresApproval(false);
            setSelectedFriendIds([]);
            setIsCreating(false);
            fetchGroups();
        } catch (error) {
            alert('Failed to create group');
        }
    };

    const joinGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim()) return;

        try {
            const result = await api.post('/groups/join', {
                code: joinCode.trim().toUpperCase(),
                userId
            });
            setJoinCode('');
            setIsJoining(false);
            fetchGroups();
            alert(result.message);
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to join group');
        }
    };

    const handleMemberStatus = async (groupId: string, memberId: string, status: 'active' | 'rejected') => {
        try {
            await api.put(`/groups/${groupId}/members/${memberId}`, { status });
            fetchPending(groupId);
            if (status === 'active') fetchGroups();
        } catch (e) {
            alert('Failed to update member status');
        }
    };

    const toggleFriendSelection = (friendId: string) => {
        setSelectedFriendIds(prev =>
            prev.includes(friendId)
                ? prev.filter(id => id !== friendId)
                : [...prev, friendId]
        );
    };

    return (
        <div className="space-y-4">
            <div className="glass-panel p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        My Groups
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setIsJoining(!isJoining); setIsCreating(false); }}
                            className="p-2 bg-white/5 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-all border border-white/10"
                            title="Join by Code"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                        </button>
                        <button
                            onClick={() => { setIsCreating(!isCreating); setIsJoining(false); }}
                            className="p-2 bg-white/5 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-all border border-white/10"
                            title="Create Group"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Forms same as before */}
                {isJoining && (
                    <form onSubmit={joinGroup} className="mb-6 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 animate-in slide-in-from-top-2">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                placeholder="Group Code"
                                className="flex-1 px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:border-indigo-500 outline-none uppercase font-mono"
                                required
                            />
                            <button type="submit" className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-bold">Join</button>
                        </div>
                    </form>
                )}

                {isCreating && (
                    <form onSubmit={createGroup} className="mb-6 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-4 animate-in slide-in-from-top-2">
                        <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="Group Name"
                            className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:border-emerald-500 outline-none"
                            required
                        />
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative">
                                    <input type="checkbox" checked={requiresApproval} onChange={(e) => setRequiresApproval(e.target.checked)} className="sr-only" />
                                    <div className={`w-10 h-5 rounded-full transition-colors ${requiresApproval ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${requiresApproval ? 'translate-x-5' : ''}`}></div>
                                </div>
                                <span className="text-sm text-slate-300 group-hover:text-white">Requires Admin Approval</span>
                            </label>
                            {friends.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {friends.map(f => (
                                        <button key={f.id} type="button" onClick={() => toggleFriendSelection(f.friend_id)}
                                            className={`px-2 py-1 rounded-full text-[10px] border transition-all ${selectedFriendIds.includes(f.friend_id) ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white/5 text-slate-400 border-white/10'}`}>
                                            {f.friend_details.user_name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button type="submit" className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold">Create Group</button>
                    </form>
                )}

                <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {groups.map((group) => {
                        const pending = pendingMembers[group.group_id] || [];
                        const isExpanded = expandedGroupId === group.group_id;

                        return (
                            <div key={group.group_id} className="space-y-2">
                                <div
                                    onClick={() => onSelectGroup(group.group_id)}
                                    className={`p-4 rounded-xl bg-white/5 border transition-all cursor-pointer group ${isExpanded ? 'border-emerald-500/30 bg-white/10' : 'border-white/5 hover:bg-white/10'}`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors">{group.name}</h3>
                                        <div className="flex items-center gap-2">
                                            {pending.length > 0 && (group.role === 'owner' || group.role === 'admin') && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setExpandedGroupId(isExpanded ? null : group.group_id); }}
                                                    className="w-5 h-5 rounded-full bg-pink-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse"
                                                >
                                                    {pending.length}
                                                </button>
                                            )}
                                            {group.role === 'owner' && (
                                                <span className="text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full">OWNER</span>
                                            )}
                                            {group.role === 'admin' && (
                                                <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">ADMIN</span>
                                            )}
                                            {group.role === 'member' && (
                                                <span className="text-[10px] font-bold bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">MEMBER</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] text-slate-500 font-mono italic">#{group.group_id.split('-')[0]}</p>
                                        {group.join_code && (group.role === 'owner' || group.role === 'admin') && (
                                            <span className="text-[10px] text-indigo-400 font-bold font-mono bg-black/30 px-2 py-0.5 rounded border border-white/5 group-hover:border-indigo-500/30 transition-all">
                                                Code: {group.join_code}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Expanded Area for Pending Requests */}
                                {isExpanded && pending.length > 0 && (
                                    <div className="ml-4 p-3 rounded-xl bg-pink-500/5 border border-pink-500/20 animate-in slide-in-from-top-1">
                                        <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-2">Pending Join Requests</p>
                                        <div className="space-y-2">
                                            {pending.map(m => (
                                                <div key={m.user_id} className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-white/5">
                                                    <div>
                                                        <p className="text-xs font-bold text-white">{m.users.user_name}</p>
                                                        <p className="text-[10px] text-slate-500">{m.users.email}</p>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button onClick={() => handleMemberStatus(group.group_id, m.user_id, 'active')} className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded-md transition-all">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                        </button>
                                                        <button onClick={() => handleMemberStatus(group.group_id, m.user_id, 'rejected')} className="p-1 text-pink-400 hover:bg-pink-500/20 rounded-md transition-all">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

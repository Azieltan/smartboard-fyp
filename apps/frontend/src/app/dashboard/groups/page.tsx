'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import AddFriendModal from '../../../components/AddFriendModal';
import AddMemberModal from '../../../components/AddMemberModal';

interface Group {
    group_id: string;
    name: string;
    role: string;
    join_code?: string;
    member_count?: number;
}

interface Friend {
    friend_id: string;
    friend_name: string;
    friend_email: string;
    status?: 'online' | 'offline';
}

export default function GroupsPage() {
    const [activeTab, setActiveTab] = useState<'groups' | 'friends'>('groups');
    const [groups, setGroups] = useState<Group[]>([]);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [showAddFriend, setShowAddFriend] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);
    const [selectedGroupForAdd, setSelectedGroupForAdd] = useState<string | null>(null);
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [isJoiningGroup, setIsJoiningGroup] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [newGroupName, setNewGroupName] = useState('');
    const [userId, setUserId] = useState<string>('');

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setUserId(user.user_id);
            fetchData(user.user_id);
        }
    }, []);

    const fetchData = async (uid: string) => {
        try {
            const [groupsData, friendsData] = await Promise.all([
                api.get(`/groups/${uid}`),
                api.get(`/friends/${uid}`)
            ]);
            if (Array.isArray(groupsData)) setGroups(groupsData);
            if (Array.isArray(friendsData)) setFriends(friendsData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;

        try {
            await api.post('/groups', {
                name: newGroupName,
                ownerId: userId
            });
            setNewGroupName('');
            setIsCreatingGroup(false);
            fetchData(userId);
        } catch (error) {
            console.error('Failed to create group:', error);
            alert('Failed to create group');
        }
    };

    const handleJoinGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim()) return;

        try {
            await api.post('/groups/join', {
                code: joinCode.trim().toUpperCase(),
                userId
            });
            setJoinCode('');
            setIsJoiningGroup(false);
            fetchData(userId);
            alert('Successfully joined group!');
        } catch (error: any) {
            console.error('Failed to join group:', error);
            alert(error.response?.data?.error || 'Failed to join group. Check the code.');
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Social & Groups</h1>
                    <p className="text-slate-400 mt-1">Manage your teams and connections.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsJoiningGroup(true)}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors"
                    >
                        Join via Code
                    </button>
                    <button
                        onClick={() => activeTab === 'groups' ? setIsCreatingGroup(true) : setShowAddFriend(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow-lg shadow-blue-500/20 transition-colors"
                    >
                        {activeTab === 'groups' ? '+ New Group' : '+ Invite Friend'}
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('groups')}
                    className={`pb-3 px-1 text-sm font-medium transition-colors relative ${activeTab === 'groups' ? 'text-blue-400' : 'text-slate-400 hover:text-white'
                        }`}
                >
                    My Groups
                    {activeTab === 'groups' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400 rounded-full"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('friends')}
                    className={`pb-3 px-1 text-sm font-medium transition-colors relative ${activeTab === 'friends' ? 'text-blue-400' : 'text-slate-400 hover:text-white'
                        }`}
                >
                    Friends List
                    {activeTab === 'friends' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400 rounded-full"></div>}
                </button>
            </div>

            {/* Join Group Modal */}
            {isJoiningGroup && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="glass-panel bg-[#1e293b] rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Join a Group</h3>
                            <button onClick={() => setIsJoiningGroup(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>
                        <form onSubmit={handleJoinGroup} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Group Code</label>
                                <input
                                    type="text"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    placeholder="e.g. A1B2C3"
                                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white text-center text-lg tracking-widest font-mono focus:border-blue-500 focus:outline-none placeholder-slate-600 uppercase"
                                    maxLength={8}
                                    autoFocus
                                />
                                <p className="text-xs text-slate-500 mt-2 text-center">Ask your group admin for the code</p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsJoiningGroup(false)}
                                    className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-colors"
                                >
                                    Join Group
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Group Modal */}
            {isCreatingGroup && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="glass-panel bg-[#1e293b] rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl">
                        <h3 className="text-xl font-bold mb-6 text-white">Create New Group</h3>
                        <form onSubmit={handleCreateGroup}>
                            <input
                                type="text"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                placeholder="Group Name"
                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white mb-6 focus:border-blue-500 focus:outline-none"
                                autoFocus
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreatingGroup(false)}
                                    className="px-6 py-2 text-slate-400 hover:bg-white/5 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-500/20"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeTab === 'groups' ? (
                    groups.length > 0 ? (
                        groups.map((group) => (
                            <div key={group.group_id} className="glass-panel p-6 hover:border-blue-500/30 transition-colors group cursor-pointer">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white">
                                        {group.name[0]}
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium border ${group.role === 'admin'
                                        ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                        : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                        }`}>
                                        {group.role}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{group.name}</h3>
                                <p className="text-sm text-slate-400">{group.member_count || 1} members</p>

                                {group.role === 'admin' && group.join_code && (
                                    <div className="mt-3 p-2 bg-black/30 rounded-lg border border-white/5 flex flex-col">
                                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Join Code</span>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-mono text-blue-400 font-bold tracking-widest">{group.join_code}</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigator.clipboard.writeText(group.join_code!);
                                                    alert('Code copied!');
                                                }}
                                                className="p-1 hover:text-white text-slate-500"
                                                title="Copy Code"
                                            >
                                                📋
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6 flex gap-2">
                                    <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-white transition-colors">
                                        View
                                    </button>
                                    {group.role === 'admin' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedGroupForAdd(group.group_id);
                                                setShowAddMember(true);
                                            }}
                                            className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-blue-400 hover:text-blue-300 text-xs font-bold transition-colors border border-blue-500/20"
                                        >
                                            + Member
                                        </button>
                                    )}
                                    {group.role === 'owner' && (
                                        <button className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                                            ⚙️
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-10 text-slate-400">
                            No groups found. Create one to get started!
                        </div>
                    )
                ) : (
                    friends.length > 0 ? (
                        friends.map((friend) => (
                            <div key={friend.friend_id} className="glass-panel p-4 flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
                                        {friend.friend_name[0]}
                                    </div>
                                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0f172a] ${friend.status === 'online' ? 'bg-green-500' : 'bg-slate-500'
                                        }`}></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-bold text-white truncate">{friend.friend_name}</h3>
                                    <p className="text-xs text-slate-400 truncate">{friend.friend_email}</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        try {
                                            const res = await api.post('/chats/dm', { user1Id: userId, user2Id: friend.friend_id });
                                            // Switch to Chat Tab? Or just open chat?
                                            // Ideally we redirect to /dashboard/chat?groupId=...
                                            window.location.href = `/dashboard/chat?groupId=${res.groupId}`;
                                        } catch (e) {
                                            console.error(e);
                                            alert('Failed to open chat');
                                        }
                                    }}
                                    className="p-2 hover:bg-white/10 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
                                    title="Send Message"
                                >
                                    💬
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-10 text-slate-400">
                            No friends added yet. Invite someone!
                        </div>
                    )
                )}
            </div>

            {showAddMember && selectedGroupForAdd && (
                <AddMemberModal
                    groupId={selectedGroupForAdd}
                    userId={userId}
                    onClose={() => {
                        setShowAddMember(false);
                        setSelectedGroupForAdd(null);
                    }}
                    onMemberAdded={() => fetchData(userId)}
                />
            )}

            {showAddFriend && (
                <AddFriendModal
                    userId={userId}
                    onClose={() => setShowAddFriend(false)}
                />
            )}
        </div>
    );
}

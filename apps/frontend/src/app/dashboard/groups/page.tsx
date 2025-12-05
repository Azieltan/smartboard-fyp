'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import AddFriendModal from '../../../components/AddFriendModal';

interface Group {
    group_id: string;
    name: string;
    role: string;
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
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
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

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Social & Groups</h1>
                    <p className="text-slate-400 mt-1">Manage your teams and connections.</p>
                </div>
                <button
                    onClick={() => activeTab === 'groups' ? setIsCreatingGroup(true) : setShowAddFriend(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow-lg shadow-blue-500/20 transition-colors"
                >
                    {activeTab === 'groups' ? '+ New Group' : '+ Invite Friend'}
                </button>
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

            {/* Create Group Modal/Form */}
            {isCreatingGroup && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4 text-gray-900">Create New Group</h3>
                        <form onSubmit={handleCreateGroup}>
                            <input
                                type="text"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                placeholder="Group Name"
                                className="w-full px-3 py-2 border rounded mb-4 text-gray-900"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreatingGroup(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
                                    <span className={`px-2 py-1 rounded text-xs font-medium border ${group.role === 'owner'
                                        ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                        : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                        }`}>
                                        {group.role}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{group.name}</h3>
                                <p className="text-sm text-slate-400">{group.member_count || 1} members</p>

                                <div className="mt-6 flex gap-2">
                                    <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-white transition-colors">
                                        View
                                    </button>
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
                                <button className="p-2 hover:bg-white/10 rounded-lg text-blue-400 hover:text-blue-300 transition-colors">
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

            {showAddFriend && (
                <AddFriendModal
                    userId={userId}
                    onClose={() => setShowAddFriend(false)}
                />
            )}
        </div>
    );
}

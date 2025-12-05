'use client';

import { useState, useEffect } from 'react';
import Chat from '../../../components/Chat';
import { api } from '../../../lib/api';

interface Group {
    group_id: string;
    name: string;
    created_at: string;
}

export default function ChatPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setUserId(user.user_id);
            fetchGroups(user.user_id);
        }
    }, []);

    const fetchGroups = async (uid: string) => {
        console.log('Fetching groups for user:', uid);
        try {
            const data = await api.get(`/groups/${uid}`);
            console.log('Fetched groups:', data);
            if (Array.isArray(data)) {
                setGroups(data);
                if (data.length > 0 && !selectedGroupId) {
                    setSelectedGroupId(data[0].group_id);
                }
            }
        } catch (error) {
            console.error('Failed to fetch groups:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim() || !userId) return;

        try {
            console.log('Creating group:', newGroupName);
            const newGroup = await api.post('/groups', {
                name: newGroupName,
                ownerId: userId
            });
            console.log('Group created:', newGroup);
            setGroups([...groups, newGroup]);
            setSelectedGroupId(newGroup.group_id);
            setNewGroupName('');
            setIsCreatingGroup(false);
        } catch (error) {
            console.error('Failed to create group:', error);
            alert('Failed to create group');
        }
    };

    if (!userId) {
        return <div className="p-8 text-center text-slate-400">Please login to view chats.</div>;
    }

    return (
        <div className="h-[calc(100vh-4rem)] flex gap-6">
            {/* Chat List */}
            <div className="w-80 flex flex-col glass-panel overflow-hidden">
                <div className="p-4 border-b border-white/10">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-lg font-bold text-white">Groups</h2>
                        <button
                            onClick={() => setIsCreatingGroup(!isCreatingGroup)}
                            className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white"
                            title="Create Group"
                        >
                            {isCreatingGroup ? '✕' : '+'}
                        </button>
                    </div>
                    {isCreatingGroup && (
                        <form onSubmit={handleCreateGroup} className="flex gap-2">
                            <input
                                type="text"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                placeholder="Group Name"
                                className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                                autoFocus
                            />
                            <button
                                type="submit"
                                className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500"
                            >
                                Add
                            </button>
                        </form>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {isLoading ? (
                        <div className="text-center text-slate-500 p-4">Loading groups...</div>
                    ) : groups.length === 0 ? (
                        <div className="text-center text-slate-500 p-4">No groups yet. Create one!</div>
                    ) : (
                        groups.map((group) => (
                            <button
                                key={group.group_id}
                                onClick={() => setSelectedGroupId(group.group_id)}
                                className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${selectedGroupId === group.group_id ? 'bg-blue-600/20 border border-blue-500/50' : 'hover:bg-white/5 border border-transparent'
                                    }`}
                            >
                                <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold">
                                    {group.name[0]}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="text-sm font-medium text-white truncate">{group.name}</p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 glass-panel flex flex-col overflow-hidden">
                {selectedGroupId ? (
                    <Chat groupId={selectedGroupId} userId={userId} />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400">
                        Select a group to start chatting
                    </div>
                )}
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface Group {
    group_id: string;
    name: string;
    user_id: string;
    join_code?: string;
    requires_approval?: boolean;
}

interface GroupListProps {
    userId: string;
    onSelectGroup: (groupId: string) => void;
}

export default function GroupList({ userId, onSelectGroup }: GroupListProps) {
    const [groups, setGroups] = useState<Group[]>([]);
    const [friends, setFriends] = useState<any[]>([]);

    // Create Group State
    const [newGroupName, setNewGroupName] = useState('');
    const [requiresApproval, setRequiresApproval] = useState(false);
    const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    // Join Group State
    const [isJoining, setIsJoining] = useState(false);
    const [joinCode, setJoinCode] = useState('');

    useEffect(() => {
        fetchGroups();
        fetchFriends();
    }, [userId]);

    const fetchGroups = async () => {
        try {
            const data = await api.get(`/groups/${userId}`);
            if (Array.isArray(data)) {
                setGroups(data);
            }
        } catch (e) {
            console.error("Failed to fetch groups", e);
        }
    };

    const fetchFriends = async () => {
        try {
            const data = await api.get(`/friends/${userId}`);
            if (Array.isArray(data)) {
                setFriends(data);
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
            alert('Group created successfully!');
        } catch (error) {
            alert('Failed to create group');
        }
    };

    const joinGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim()) return;

        try {
            await api.post('/groups/join', {
                code: joinCode,
                userId
            });
            setJoinCode('');
            setIsJoining(false);
            fetchGroups();
            alert('Joined group successfully! (Or request sent)');
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to join group');
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
        <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">My Groups</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => { setIsJoining(!isJoining); setIsCreating(false); }}
                        className="px-3 py-1 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600"
                    >
                        {isJoining ? 'Cancel' : 'Join Group'}
                    </button>
                    <button
                        onClick={() => { setIsCreating(!isCreating); setIsJoining(false); }}
                        className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                    >
                        {isCreating ? 'Cancel' : 'New Group'}
                    </button>
                </div>
            </div>

            {isJoining && (
                <form onSubmit={joinGroup} className="mb-4 p-4 border rounded bg-gray-50">
                    <h3 className="font-semibold mb-2">Join a Group</h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            placeholder="Enter Group Code"
                            className="flex-1 px-3 py-2 border rounded uppercase"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                        >
                            Join
                        </button>
                    </div>
                </form>
            )}

            {isCreating && (
                <form onSubmit={createGroup} className="mb-4 p-4 border rounded bg-gray-50 space-y-3">
                    <h3 className="font-semibold">Create New Group</h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Group Name</label>
                        <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="My Awesome Group"
                            className="w-full px-3 py-2 border rounded mt-1"
                            required
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={requiresApproval}
                            onChange={(e) => setRequiresApproval(e.target.checked)}
                            id="approvalReq"
                        />
                        <label htmlFor="approvalReq" className="text-sm text-gray-700">Require Admin Approval to Join via Code</label>
                    </div>

                    {friends.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Add Friends</label>
                            <div className="max-h-32 overflow-y-auto border rounded p-2 bg-white">
                                {friends.map(friend => (
                                    <div key={friend.friend_id} className="flex items-center gap-2 py-1">
                                        <input
                                            type="checkbox"
                                            checked={selectedFriendIds.includes(friend.friend_id)}
                                            onChange={() => toggleFriendSelection(friend.friend_id)}
                                            id={`friend-${friend.friend_id}`}
                                        />
                                        <label htmlFor={`friend-${friend.friend_id}`} className="text-sm">
                                            {friend.friend_details?.user_name || friend.friend_details?.email}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Create Group
                    </button>
                </form>
            )}

            <div className="space-y-2">
                {groups.map((group) => (
                    <div
                        key={group.group_id}
                        onClick={() => onSelectGroup(group.group_id)}
                        className="p-3 border rounded hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                        <div className="flex justify-between items-start">
                            <h3 className="font-medium">{group.name}</h3>
                            {group.join_code && group.user_id === userId && (
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500" title="Share this code">
                                    Code: {group.join_code}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
                {groups.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No groups yet</p>
                )}
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface Group {
    group_id: string;
    name: string;
    user_id: string;
}

interface GroupListProps {
    userId: string;
    onSelectGroup: (groupId: string) => void;
}

export default function GroupList({ userId, onSelectGroup }: GroupListProps) {
    const [groups, setGroups] = useState<Group[]>([]);
    const [newGroupName, setNewGroupName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchGroups();
    }, [userId]);

    const fetchGroups = async () => {
        const data = await api.get(`/groups/${userId}`);
        if (Array.isArray(data)) {
            setGroups(data);
        }
    };

    const createGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;

        await api.post('/groups', {
            name: newGroupName,
            ownerId: userId
        });
        setNewGroupName('');
        setIsCreating(false);
        fetchGroups();
    };

    return (
        <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">My Groups</h2>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                >
                    {isCreating ? 'Cancel' : 'New Group'}
                </button>
            </div>

            {isCreating && (
                <form onSubmit={createGroup} className="mb-4 flex gap-2">
                    <input
                        type="text"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="Group Name"
                        className="flex-1 px-3 py-2 border rounded"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Create
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
                        <h3 className="font-medium">{group.name}</h3>
                    </div>
                ))}
                {groups.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No groups yet</p>
                )}
            </div>
        </div>
    );
}

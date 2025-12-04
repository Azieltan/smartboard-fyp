'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface Group {
    group_id: string;
    name: string;
}

interface TaskAssignmentProps {
    userId: string;
    onAssign: (type: 'user' | 'group', id: string) => void;
}

export default function TaskAssignment({ userId, onAssign }: TaskAssignmentProps) {
    const [groups, setGroups] = useState<Group[]>([]);
    const [assignType, setAssignType] = useState<'user' | 'group'>('user');
    const [selectedId, setSelectedId] = useState('');

    useEffect(() => {
        fetchGroups();
    }, [userId]);

    const fetchGroups = async () => {
        const data = await api.get(`/groups/${userId}`);
        if (Array.isArray(data)) {
            setGroups(data);
        }
    };

    const handleAssign = () => {
        if (selectedId) {
            onAssign(assignType, selectedId);
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold mb-3">Assign Task</h3>
            <div className="space-y-3">
                <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            checked={assignType === 'user'}
                            onChange={() => setAssignType('user')}
                        />
                        User
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            checked={assignType === 'group'}
                            onChange={() => setAssignType('group')}
                        />
                        Group
                    </label>
                </div>

                {assignType === 'user' ? (
                    <input
                        type="text"
                        placeholder="Enter User ID"
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                    />
                ) : (
                    <select
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                    >
                        <option value="">Select a Group</option>
                        {groups.map((g) => (
                            <option key={g.group_id} value={g.group_id}>
                                {g.name}
                            </option>
                        ))}
                    </select>
                )}

                <button
                    onClick={handleAssign}
                    className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Assign
                </button>
            </div>
        </div>
    );
}

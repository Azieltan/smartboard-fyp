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
        <div className="glass-panel p-6">
            <h3 className="text-lg font-bold text-white mb-4">Assign Task</h3>
            <div className="space-y-4">
                <div className="flex gap-4 p-1 bg-black/20 rounded-lg">
                    <label className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md cursor-pointer transition-all ${assignType === 'user' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                        <input
                            type="radio"
                            checked={assignType === 'user'}
                            onChange={() => setAssignType('user')}
                            className="hidden"
                        />
                        <span className="text-sm font-medium">User</span>
                    </label>
                    <label className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md cursor-pointer transition-all ${assignType === 'group' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                        <input
                            type="radio"
                            checked={assignType === 'group'}
                            onChange={() => setAssignType('group')}
                            className="hidden"
                        />
                        <span className="text-sm font-medium">Group</span>
                    </label>
                </div>

                {assignType === 'user' ? (
                    <input
                        type="text"
                        placeholder="Enter User ID"
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                ) : (
                    <select
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                    >
                        <option value="" className="bg-slate-800">Select a Group</option>
                        {groups.map((g) => (
                            <option key={g.group_id} value={g.group_id} className="bg-slate-800">
                                {g.name}
                            </option>
                        ))}
                    </select>
                )}

                <button
                    onClick={handleAssign}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 transition-all"
                >
                    Assign Task
                </button>
            </div>
        </div>
    );
}

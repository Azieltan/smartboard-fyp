'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import TimeSelector from './TimeSelector';

interface CreateTaskModalProps {
    userId: string;
    onClose: () => void;
    onTaskCreated: () => void;
}

export default function CreateTaskModal({ userId, onClose, onTaskCreated }: CreateTaskModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('12:00');
    const [priority, setPriority] = useState('medium');
    const [isLoading, setIsLoading] = useState(false);

    const [assignType, setAssignType] = useState<'me' | 'friend' | 'group'>('me');
    const [assigneeId, setAssigneeId] = useState('');
    const [friends, setFriends] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [friendsData, groupsData] = await Promise.all([
                    api.get(`/friends/${userId}`),
                    api.get(`/groups/${userId}`)
                ]);
                if (Array.isArray(friendsData)) setFriends(friendsData);
                if (Array.isArray(groupsData)) setGroups(groupsData);
            } catch (error) {
                console.error('Failed to fetch assignment data:', error);
            }
        };
        fetchData();
    }, [userId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const dateTime = new Date(`${date}T${time}`).toISOString();

            const taskData: any = {
                title,
                description,
                due_date: dateTime,
                priority,
                created_by: userId,
                status: 'todo'
            };

            if (assignType === 'me') {
                taskData.user_id = userId;
            } else if (assignType === 'friend') {
                taskData.user_id = assigneeId;
            } else if (assignType === 'group') {
                taskData.group_id = assigneeId;
            }

            await api.post('/tasks', taskData);
            onTaskCreated();
            onClose();
        } catch (error) {
            console.error('Failed to create task:', error);
            alert('Failed to create task');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1e293b] rounded-2xl shadow-2xl p-6 w-full max-w-md border border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">New Task</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:border-blue-500 outline-none transition-all placeholder-slate-500"
                            placeholder="What needs to be done?"
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:border-blue-500 outline-none transition-all resize-none h-24 placeholder-slate-500"
                            placeholder="Add details..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Due Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:border-blue-500 outline-none transition-all [color-scheme:dark]"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Priority</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:border-blue-500 outline-none transition-all"
                            >
                                <option value="low" className="bg-[#1e293b]">Low</option>
                                <option value="medium" className="bg-[#1e293b]">Medium</option>
                                <option value="high" className="bg-[#1e293b]">High</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Due Time</label>
                        <TimeSelector value={time} onChange={setTime} />
                    </div>

                    {/* Assignment Section */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Assign To</label>
                        <div className="flex gap-2 mb-3">
                            <button
                                type="button"
                                onClick={() => setAssignType('me')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${assignType === 'me' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                            >
                                Me
                            </button>
                            <button
                                type="button"
                                onClick={() => setAssignType('friend')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${assignType === 'friend' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                            >
                                Friend
                            </button>
                            <button
                                type="button"
                                onClick={() => setAssignType('group')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${assignType === 'group' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                            >
                                Group
                            </button>
                        </div>

                        {assignType === 'friend' && (
                            <select
                                value={assigneeId}
                                onChange={(e) => setAssigneeId(e.target.value)}
                                className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:border-blue-500 outline-none transition-all"
                                required
                            >
                                <option value="" className="bg-[#1e293b]">Select a friend...</option>
                                {friends.map(f => (
                                    <option key={f.friend_id} value={f.friend_id} className="bg-[#1e293b]">{f.friend_username || f.friend_email}</option>
                                ))}
                            </select>
                        )}

                        {assignType === 'group' && (
                            <select
                                value={assigneeId}
                                onChange={(e) => setAssigneeId(e.target.value)}
                                className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:border-blue-500 outline-none transition-all"
                                required
                            >
                                <option value="" className="bg-[#1e293b]">Select a group...</option>
                                {groups.map(g => (
                                    <option key={g.group_id} value={g.group_id} className="bg-[#1e293b]">{g.name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50 shadow-lg shadow-blue-500/20"
                        >
                            {isLoading ? 'Creating...' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

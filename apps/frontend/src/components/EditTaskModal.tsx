'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import TimeSelector from './TimeSelector';

interface EditTaskModalProps {
    task: any; // The task object to edit
    userId: string;
    onClose: () => void;
    onTaskUpdated: () => void;
}

export default function EditTaskModal({ task, userId, onClose, onTaskUpdated }: EditTaskModalProps) {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');

    // Parse initial date/time
    const initialDateObj = task.due_date ? new Date(task.due_date) : new Date();
    const [date, setDate] = useState(initialDateObj.toISOString().split('T')[0]);
    const [time, setTime] = useState(
        task.due_date
            ? initialDateObj.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
            : '12:00'
    );

    const [priority, setPriority] = useState(task.priority);
    const [isLoading, setIsLoading] = useState(false);

    // Assignment Logic (Pre-fill logic is tricky if we don't know exact context, relying on what's in task)
    // For simplicity in Edit, we might just allow changing assignee if needed, 
    // but initially we just show current assignee.
    // If identifying assignee type is hard, we default to "friend" or "group" based on if group_id exists.
    const [assignType, setAssignType] = useState<'me' | 'friend' | 'group'>(
        task.user_id === userId ? 'me' : (task.group_id ? 'group' : 'friend')
    );
    const [assigneeId, setAssigneeId] = useState(
        task.user_id === userId ? '' : (task.group_id || task.user_id)
    ); // If group, assigneeId is group_id. If friend, it's user_id.

    const [specificAssigneeId, setSpecificAssigneeId] = useState(
        (task.group_id && task.user_id && task.user_id !== userId) ? task.user_id : ''
    );

    const [friends, setFriends] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [groupMembers, setGroupMembers] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const timestamp = new Date().getTime();
                const [friendsData, groupsData] = await Promise.all([
                    api.get(`/friends/${userId}?t=${timestamp}`),
                    api.get(`/groups/${userId}?t=${timestamp}`)
                ]);
                if (Array.isArray(friendsData)) setFriends(friendsData);
                if (Array.isArray(groupsData)) setGroups(groupsData);
            } catch (error) {
                console.error('Failed to fetch assignment data:', error);
            }
        };
        fetchData();
    }, [userId]);

    useEffect(() => {
        if (assignType === 'group' && assigneeId) {
            const fetchMembers = async () => {
                try {
                    const timestamp = new Date().getTime();
                    const data = await api.get(`/groups/${assigneeId}/members?t=${timestamp}`);
                    if (Array.isArray(data)) setGroupMembers(data);
                } catch (e) { console.error("Failed to fetch members", e); }
            };
            fetchMembers();
        } else {
            setGroupMembers([]);
        }
    }, [assignType, assigneeId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const dateTime = new Date(`${date}T${time}`).toISOString();

            const updates: any = {
                title,
                description,
                due_date: dateTime,
                priority,
            };

            // Handle Assignment Changes
            if (assignType === 'me') {
                updates.user_id = userId;
                updates.group_id = null; // Clear group if moving to self
            } else if (assignType === 'friend') {
                updates.user_id = assigneeId;
                updates.group_id = null;
            } else if (assignType === 'group') {
                updates.group_id = assigneeId;
                updates.user_id = specificAssigneeId || null; // Null means "up for grabs" in group
            }

            await api.put(`/tasks/${task.task_id}`, updates);
            onTaskUpdated();
            onClose();
        } catch (error) {
            console.error('Failed to update task:', error);
            alert('Failed to update task');
        } finally {
            setIsLoading(false);
        }
    };

    const priorityConfig = {
        low: { color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/20', text: 'text-blue-400' },
        medium: { color: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/20', text: 'text-amber-400' },
        high: { color: 'from-red-500 to-pink-500', bg: 'bg-red-500/20', text: 'text-red-400' }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in zoom-in-95 duration-200">
            <div className="glass-panel w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar p-8 shadow-2xl bg-white dark:bg-[#1e293b] border-slate-200 dark:border-white/10">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Task</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Update task details</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Task Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all resize-none h-24"
                        />
                    </div>

                    {/* Date/Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Due Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white outline-none [color-scheme:light] dark:[color-scheme:dark]"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Due Time</label>
                            <TimeSelector value={time} onChange={setTime} />
                        </div>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Priority</label>
                        <div className="grid grid-cols-3 gap-3">
                            {(['low', 'medium', 'high'] as const).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPriority(p)}
                                    className={`py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${priority === p
                                        ? `bg-gradient-to-r ${priorityConfig[p].color} text-white shadow-lg`
                                        : `${priorityConfig[p].bg} ${priorityConfig[p].text} hover:opacity-80`
                                        }`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${priority === p ? 'bg-white' : ''}`}
                                        style={{ background: priority !== p ? `linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to))` : '' }} />
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Assignment (Simplified for Edit) */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Re-Assign</label>
                        <div className="flex gap-2 mb-3">
                            {[
                                { type: 'me' as const, label: 'Myself' },
                                { type: 'friend' as const, label: 'Individual' },
                                { type: 'group' as const, label: 'Group' }
                            ].map((item) => (
                                <button
                                    key={item.type}
                                    type="button"
                                    onClick={() => {
                                        setAssignType(item.type);
                                        setAssigneeId('');
                                    }}
                                    className={`flex-1 py-2 rounded-lg text-sm border ${assignType === item.type
                                        ? 'bg-blue-500 text-white border-blue-500'
                                        : 'bg-slate-100 dark:bg-white/5 border-transparent'
                                        }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                        {assignType === 'friend' && (
                            <select
                                value={assigneeId}
                                onChange={(e) => setAssigneeId(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl"
                            >
                                <option value="">Select friend...</option>
                                {friends.map(f => (
                                    <option key={f.friend_id} value={f.friend_id}>{f.friend_details?.user_name || f.friend_details?.email}</option>
                                ))}
                            </select>
                        )}
                        {assignType === 'group' && (
                            <div className="space-y-3">
                                <select
                                    value={assigneeId}
                                    onChange={(e) => setAssigneeId(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl"
                                >
                                    <option value="">Select group...</option>
                                    {groups.map(g => (
                                        <option key={g.group_id} value={g.group_id}>{g.name}</option>
                                    ))}
                                </select>
                                {assigneeId && (
                                    <select
                                        value={specificAssigneeId}
                                        onChange={(e) => setSpecificAssigneeId(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl"
                                    >
                                        <option value="">Group (Anyone)</option>
                                        {groupMembers.map(m => (
                                            <option key={m.user_id} value={m.user_id}>{m.user_name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
                        <button type="button" onClick={onClose} className="px-6 py-3 text-slate-500 hover:bg-slate-100 rounded-xl">Cancel</button>
                        <button type="submit" disabled={isLoading} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all">
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

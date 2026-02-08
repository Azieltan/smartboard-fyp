'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import TimeSelector from './TimeSelector';

interface CreateTaskModalProps {
    userId: string;
    groupId?: string;  // Optional: pre-select group for task assignment
    onClose: () => void;
    onTaskCreated: () => void;
}

export default function CreateTaskModal({ userId, groupId: presetGroupId, onClose, onTaskCreated }: CreateTaskModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('12:00');
    const [priority, setPriority] = useState('medium');
    const [isLoading, setIsLoading] = useState(false);

    const [assignType, setAssignType] = useState<'me' | 'friend' | 'group'>(presetGroupId ? 'group' : 'me');
    const [assigneeId, setAssigneeId] = useState(presetGroupId || '');
    const [friends, setFriends] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [groupMembers, setGroupMembers] = useState<any[]>([]);
    const [specificAssigneeId, setSpecificAssigneeId] = useState('');

    // Subtasks State
    const [subtasks, setSubtasks] = useState<{ title: string; description: string }[]>([{ title: '', description: '' }]);

    const addSubtaskRow = () => {
        setSubtasks([...subtasks, { title: '', description: '' }]);
    };

    const updateSubtask = (index: number, field: 'title' | 'description', value: string) => {
        const newSubtasks = [...subtasks];
        newSubtasks[index][field] = value;
        setSubtasks(newSubtasks);
    };

    const removeSubtaskRow = (index: number) => {
        if (subtasks.length > 1) {
            setSubtasks(subtasks.filter((_, i) => i !== index));
        }
    };

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
            // Fetch group members when group is selected
            const fetchMembers = async () => {
                try {
                    const timestamp = new Date().getTime();
                    const data = await api.get(`/groups/${assigneeId}/members?t=${timestamp}`);
                    if (Array.isArray(data)) setGroupMembers(data);
                } catch (e) {
                    console.error("Failed to fetch group members", e);
                }
            };
            fetchMembers();
        } else {
            setGroupMembers([]);
        }
        // Reset specific assignee when group changes to prevent "Wrong Assignee" bug
        setSpecificAssigneeId('');
    }, [assignType, assigneeId]);

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
                status: 'todo',
                subtasks: subtasks.filter(s => s.title.trim() !== '')
            };

            if (assignType === 'me') {
                taskData.assignee_id = userId;
            } else if (assignType === 'friend') {
                taskData.assignee_id = assigneeId || null;
            } else if (assignType === 'group') {
                taskData.group_id = assigneeId;
                if (specificAssigneeId) taskData.assignee_id = specificAssigneeId;
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

    const priorityConfig = {
        low: { color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/20', text: 'text-blue-400' },
        medium: { color: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/20', text: 'text-amber-400' },
        high: { color: 'from-red-500 to-pink-500', bg: 'bg-red-500/20', text: 'text-red-400' }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in zoom-in-95 duration-200">
            <div className="glass-panel w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar p-8 shadow-2xl bg-white dark:bg-[#1e293b] border-slate-200 dark:border-white/10">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">New Task</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Create something awesome ✨</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Task Title</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
                                placeholder="What needs to be done?"
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all resize-none h-24 placeholder-slate-400 dark:placeholder-slate-500"
                            placeholder="Add details about your task..."
                        />
                    </div>

                    {/* Date and Priority Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Due Date
                                </span>
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all [color-scheme:light] dark:[color-scheme:dark]"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Due Time
                                </span>
                            </label>
                            <TimeSelector value={time} onChange={setTime} />
                        </div>
                    </div>

                    {/* Priority Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Priority Level</label>
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

                    {/* Assignment Section */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Assign To
                            </span>
                        </label>
                        <div className="flex gap-2 mb-3">
                            {[
                                { type: 'me' as const, label: '🔒 Myself', gradient: 'from-violet-500 to-purple-500' },
                                { type: 'friend' as const, label: '👤 Individual', gradient: 'from-pink-500 to-rose-500' },
                                { type: 'group' as const, label: '👥 Group', gradient: 'from-amber-500 to-orange-500' }
                            ].map((item) => (
                                <button
                                    key={item.type}
                                    type="button"
                                    onClick={() => {
                                        setAssignType(item.type);
                                        setAssigneeId('');
                                        setSpecificAssigneeId('');
                                    }}
                                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-300 border ${assignType === item.type
                                        ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg border-transparent`
                                        : 'bg-slate-100 dark:bg-white/5 border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                                        }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        {assignType === 'friend' && (
                            <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                                {friends.length > 0 ? (
                                    <select
                                        value={assigneeId}
                                        onChange={(e) => setAssigneeId(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:border-pink-500 outline-none transition-all"
                                        required
                                    >
                                        <option value="" className="bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white">Select a friend...</option>
                                        {friends.map(f => (
                                            <option key={f.friend_details?.user_id || f.id} value={f.friend_details?.user_id} className="bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white">
                                                {f.friend_details?.user_name || f.friend_details?.email || 'Unknown User'}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-600 dark:text-pink-200 text-xs text-center">
                                        You don't have any friends to assign tasks to yet.
                                    </div>
                                )}
                            </div>
                        )}

                        {assignType === 'group' && (
                            <div className="animate-in slide-in-from-top-2 fade-in duration-200 space-y-3">
                                {groups.length > 0 ? (
                                    <>
                                        <select
                                            value={assigneeId}
                                            onChange={(e) => setAssigneeId(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:border-amber-500 outline-none transition-all"
                                            required
                                        >
                                            <option value="" className="bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white">Select a group...</option>
                                            {groups.map(g => (
                                                <option key={g.group_id} value={g.group_id} className="bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white">{g.name}</option>
                                            ))}
                                        </select>

                                        {/* Optional Specific Member Assignment */}
                                        {assigneeId && (
                                            <select
                                                value={specificAssigneeId}
                                                onChange={(e) => setSpecificAssigneeId(e.target.value)}
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:border-amber-500 outline-none transition-all text-sm"
                                            >
                                                <option value="" className="bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white">Assign to entire group (Anyone can pick)</option>
                                                {groupMembers.map(m => (
                                                    <option key={m.user_id} value={m.user_id} className="bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white">
                                                        Assign to: {m.user_name || m.email}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </>
                                ) : (
                                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-200 text-xs text-center">
                                        You haven't joined any groups yet.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Subtasks Section */}
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Subtasks</label>
                            <span className="text-xs text-slate-400">Required: Title</span>
                        </div>
                        <div className="space-y-3">
                            {subtasks.map((subtask, index) => (
                                <div key={index} className="flex gap-2 items-start animate-in fade-in slide-in-from-top-1">
                                    <div className="flex-1 space-y-1">
                                        <input
                                            type="text"
                                            value={subtask.title}
                                            onChange={(e) => updateSubtask(index, 'title', e.target.value)}
                                            placeholder="Subtask Title *"
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
                                        />
                                        <input
                                            type="text"
                                            value={subtask.description}
                                            onChange={(e) => updateSubtask(index, 'description', e.target.value)}
                                            placeholder="Description (Optional)"
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white text-xs focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeSubtaskRow(index)}
                                        className="mt-1 p-2 text-slate-400 hover:text-red-500 transition-colors"
                                        title="Remove"
                                        disabled={subtasks.length === 1 && index === 0}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={addSubtaskRow}
                                className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl text-slate-500 dark:text-slate-400 text-sm hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Add Subtask
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/30 flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Creating...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    <span>Create Task</span>
                                </>
                            )}
                        </button>
                    </div>
                </form >
            </div >
        </div >
    );
}

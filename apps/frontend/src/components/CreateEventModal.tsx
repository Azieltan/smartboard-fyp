'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import TimeSelector from './TimeSelector';

interface CreateEventModalProps {
    userId: string;
    onClose: () => void;
    onEventCreated: () => void;
    selectedDate?: string; // YYYY-MM-DD
}

export default function CreateEventModal({ userId, onClose, onEventCreated, selectedDate }: CreateEventModalProps) {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [isLoading, setIsLoading] = useState(false);

    // Sharing State
    const [shareType, setShareType] = useState<'private' | 'group' | 'friend'>('private');
    const [selectedTargetId, setSelectedTargetId] = useState('');
    const [groups, setGroups] = useState<any[]>([]);
    const [friends, setFriends] = useState<any[]>([]);

    useEffect(() => {
        if (!userId) return;
        // Fetch sharing options
        const fetchOptions = async () => {
            try {
                const [groupsRes, friendsRes] = await Promise.all([
                    api.get(`/groups/${userId}`),
                    api.get(`/friends/${userId}`)
                ]);
                const loadedGroups = Array.isArray(groupsRes) ? groupsRes : [];
                setGroups(loadedGroups);
                const loadedFriends = Array.isArray(friendsRes) ? friendsRes.filter((f: any) => f.status === 'accepted') : [];
                setFriends(loadedFriends);

                // Auto-select first item if switching types
                if (shareType === 'group' && loadedGroups.length > 0) setSelectedTargetId(loadedGroups[0].group_id);
                if (shareType === 'friend' && loadedFriends.length > 0) setSelectedTargetId(loadedFriends[0].friend_id);

            } catch (e) {
                console.error("Failed to load sharing options", e);
            }
        };
        fetchOptions();
    }, [userId, shareType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const startDateTime = new Date(`${date}T${startTime}`).toISOString();
            const endDateTime = new Date(`${date}T${endTime}`).toISOString();

            const payload: any = {
                title,
                start_time: startDateTime,
                end_time: endDateTime,
                user_id: userId,
                shared_with_group_id: null,
                shared_with: []
            };

            if (shareType === 'group' && selectedTargetId) {
                payload.shared_with_group_id = selectedTargetId;
            } else if (shareType === 'friend' && selectedTargetId) {
                payload.shared_with = [selectedTargetId];
            }

            await api.post('/calendar', payload);
            onEventCreated();
            onClose();
        } catch (error) {
            console.error('Failed to create event:', error);
            alert('Failed to create event');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in zoom-in-95 duration-200">
            <div className="glass-panel w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar p-6 shadow-2xl bg-white dark:bg-[#1e293b] border-slate-200 dark:border-white/10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Event</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Event Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
                            placeholder="Meeting, Birthday, etc."
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all [color-scheme:light] dark:[color-scheme:dark]"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Start Time</label>
                            <TimeSelector value={startTime} onChange={setStartTime} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">End Time</label>
                            <TimeSelector value={endTime} onChange={setEndTime} />
                        </div>
                    </div>

                    {/* Audience Selector Section */}
                    <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                        <label className="block text-sm font-bold text-blue-500 dark:text-blue-400 mb-3">Who is this for?</label>
                        <div className="flex gap-2 mb-4">
                            <button
                                type="button"
                                onClick={() => { setShareType('private'); setSelectedTargetId(''); }}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${shareType === 'private'
                                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20 transform scale-105'
                                    : 'bg-slate-100 dark:bg-white/5 border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                                    }`}
                            >
                                🔒 Private
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShareType('group');
                                    setSelectedTargetId('');
                                }}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${shareType === 'group'
                                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20 transform scale-105'
                                    : 'bg-slate-100 dark:bg-white/5 border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                                    }`}
                            >
                                👥 Group
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShareType('friend');
                                    setSelectedTargetId('');
                                }}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${shareType === 'friend'
                                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20 transform scale-105'
                                    : 'bg-slate-100 dark:bg-white/5 border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                                    }`}
                            >
                                👤 Friend
                            </button>
                        </div>

                        {shareType === 'group' && (
                            <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                                {groups.length > 0 ? (
                                    <>
                                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 ml-1">Select Group</label>
                                        <select
                                            value={selectedTargetId}
                                            onChange={(e) => setSelectedTargetId(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none transition-all"
                                        >
                                            {groups.map(g => (
                                                <option key={g.group_id} value={g.group_id} className="bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white">{g.name}</option>
                                            ))}
                                        </select>
                                    </>
                                ) : (
                                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-200 text-xs text-center">
                                        You haven't joined any groups yet.
                                    </div>
                                )}
                            </div>
                        )}

                        {shareType === 'friend' && (
                            <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                                {friends.length > 0 ? (
                                    <>
                                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 ml-1">Select Friend</label>
                                        <select
                                            value={selectedTargetId}
                                            onChange={(e) => setSelectedTargetId(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none transition-all"
                                        >
                                            {friends.map(f => (
                                                <option key={f.friend_id} value={f.friend_id} className="bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white">{f.friend_details?.user_name || f.friend_details?.email}</option>
                                            ))}
                                        </select>
                                    </>
                                ) : (
                                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-200 text-xs text-center">
                                        You don't have any friends to share with yet.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || (shareType === 'group' && groups.length === 0) || (shareType === 'friend' && friends.length === 0)}
                            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:shadow-none"
                        >
                            {isLoading ? 'Creating...' : 'Create Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

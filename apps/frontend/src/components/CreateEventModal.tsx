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
        // Fetch sharing options
        const fetchOptions = async () => {
            try {
                const [groupsRes, friendsRes] = await Promise.all([
                    api.get(`/groups/${userId}`),
                    api.get(`/friends/${userId}`)
                ]);
                setGroups(Array.isArray(groupsRes) ? groupsRes : []);
                setFriends(Array.isArray(friendsRes) ? friendsRes : []);
            } catch (e) {
                console.error("Failed to load sharing options", e);
            }
        };
        fetchOptions();
    }, [userId]);

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
            <div className="bg-[#1e293b] rounded-2xl shadow-2xl p-6 w-full max-w-md border border-white/10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Add Event</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Event Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:border-blue-500 outline-none"
                            placeholder="Meeting, Birthday, etc."
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:border-blue-500 outline-none"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Start Time</label>
                            <TimeSelector value={startTime} onChange={setStartTime} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">End Time</label>
                            <TimeSelector value={endTime} onChange={setEndTime} />
                        </div>
                    </div>

                    {/* Audience Selector Section */}
                    <div className="pt-4 border-t border-white/10">
                        <label className="block text-sm font-bold text-blue-400 mb-3">Who is this for?</label>
                        <div className="flex gap-2 mb-4">
                            <button
                                type="button"
                                onClick={() => { setShareType('private'); setSelectedTargetId(''); }}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${shareType === 'private'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 transform scale-105'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                    }`}
                            >
                                🔒 Private
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShareType('group');
                                    if (groups.length > 0) setSelectedTargetId(groups[0].group_id);
                                }}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${shareType === 'group'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 transform scale-105'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                    }`}
                            >
                                👥 Group
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShareType('friend');
                                    if (friends.length > 0) setSelectedTargetId(friends[0].friend_id);
                                }}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${shareType === 'friend'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 transform scale-105'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                    }`}
                            >
                                👤 Friend
                            </button>
                        </div>

                        {shareType === 'group' && (
                            <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                                <label className="block text-xs text-slate-400 mb-1">Select Group</label>
                                <select
                                    value={selectedTargetId}
                                    onChange={(e) => setSelectedTargetId(e.target.value)}
                                    className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:border-blue-500 outline-none"
                                >
                                    {groups.length === 0 && <option value="">No groups joined</option>}
                                    {groups.map(g => (
                                        <option key={g.group_id} value={g.group_id}>{g.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {shareType === 'friend' && (
                            <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                                <label className="block text-xs text-slate-400 mb-1">Select Friend</label>
                                <select
                                    value={selectedTargetId}
                                    onChange={(e) => setSelectedTargetId(e.target.value)}
                                    className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-sm focus:border-blue-500 outline-none"
                                >
                                    {friends.length === 0 && <option value="">No friends added</option>}
                                    {friends.map(f => (
                                        <option key={f.friend_id} value={f.friend_id}>{f.friend_name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
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
                            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold rounded-lg shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                        >
                            {isLoading ? 'Creating...' : 'Create Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

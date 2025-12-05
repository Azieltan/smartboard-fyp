'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface CalendarEvent {
    event_id: string;
    title: string;
    start_time: string;
    end_time: string;
}

interface CalendarWidgetProps {
    userId: string;
}

export default function CalendarWidget({ userId }: CalendarWidgetProps) {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', start_time: '', end_time: '' });

    useEffect(() => {
        fetchEvents();
    }, [userId]);

    const fetchEvents = async () => {
        const data = await api.get(`/calendar/${userId}`);
        if (Array.isArray(data)) {
            setEvents(data);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        await api.post('/calendar', {
            ...newEvent,
            user_id: userId,
            creator: userId
        });
        setIsAdding(false);
        setNewEvent({ title: '', start_time: '', end_time: '' });
        fetchEvents();
    };

    return (
        <div className="glass-panel p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">Calendar</h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="text-xs bg-blue-600/80 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                    {isAdding ? 'Cancel' : '+ Add Event'}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleCreateEvent} className="mb-6 space-y-3 bg-white/5 p-4 rounded-xl border border-white/10">
                    <input
                        type="text"
                        placeholder="Event Title"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                        required
                        autoFocus
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            type="datetime-local"
                            value={newEvent.start_time}
                            onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                            className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
                            required
                        />
                        <input
                            type="datetime-local"
                            value={newEvent.end_time}
                            onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                            className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                        Save Event
                    </button>
                </form>
            )}

            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                {events.length > 0 ? (
                    events.map((event) => (
                        <div key={event.event_id} className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                            <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">{event.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                <p className="text-xs text-slate-400">
                                    {new Date(event.start_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    !isAdding && <p className="text-slate-500 text-center text-sm py-4">No upcoming events</p>
                )}
            </div>
        </div>
    );
}

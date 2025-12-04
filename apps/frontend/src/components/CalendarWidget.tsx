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
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Calendar</h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                    {isAdding ? 'Cancel' : 'Add Event'}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleCreateEvent} className="mb-4 space-y-2 bg-white/10 p-3 rounded">
                    <input
                        type="text"
                        placeholder="Event Title"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        className="w-full px-2 py-1 rounded text-black"
                        required
                    />
                    <input
                        type="datetime-local"
                        value={newEvent.start_time}
                        onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                        className="w-full px-2 py-1 rounded text-black"
                        required
                    />
                    <input
                        type="datetime-local"
                        value={newEvent.end_time}
                        onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                        className="w-full px-2 py-1 rounded text-black"
                        required
                    />
                    <button type="submit" className="w-full bg-green-500 text-white py-1 rounded">
                        Save
                    </button>
                </form>
            )}

            <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {events.map((event) => (
                    <div key={event.event_id} className="p-3 rounded-lg bg-white/5 border border-white/5">
                        <p className="text-sm font-medium text-white">{event.title}</p>
                        <p className="text-xs text-slate-400">
                            {new Date(event.start_time).toLocaleString()}
                        </p>
                    </div>
                ))}
                {events.length === 0 && !isAdding && (
                    <p className="text-slate-500 text-center text-sm">No upcoming events</p>
                )}
            </div>
        </div>
    );
}

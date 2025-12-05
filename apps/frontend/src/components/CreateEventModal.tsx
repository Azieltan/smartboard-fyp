'use client';

import { useState } from 'react';
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const startDateTime = new Date(`${date}T${startTime}`).toISOString();
            const endDateTime = new Date(`${date}T${endTime}`).toISOString();

            await api.post('/calendar', {
                title,
                start_time: startDateTime,
                end_time: endDateTime,
                user_id: userId
            });
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1e293b] rounded-2xl shadow-2xl p-6 w-full max-w-md border border-white/10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Add Event</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
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
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isLoading ? 'Creating...' : 'Create Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

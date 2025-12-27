'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import CreateEventModal from './CreateEventModal';

interface CalendarItem {
    id: string;
    title: string;
    start: string;
    end: string;
    type: 'event' | 'task';
    priority?: string;
    isShared?: boolean;
    group_id?: string;
    owner_id?: string;
}

interface CalendarWidgetProps {
    userId: string;
}

export default function CalendarWidget({ userId }: CalendarWidgetProps) {
    const [items, setItems] = useState<CalendarItem[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (userId) fetchItems();
    }, [userId]);

    const fetchItems = async () => {
        setIsLoading(true);
        try {
            const data = await api.get(`/calendar/${userId}/items`);
            if (Array.isArray(data)) {
                setItems(data);
            }
        } catch (e) {
            console.error("Failed to fetch calendar items", e);
        } finally {
            setIsLoading(false);
        }
    };

    const events = items.filter(i => i.type === 'event');
    const tasks = items.filter(i => i.type === 'task');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">My Schedule</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Your upcoming events and tasks</p>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Events Column */}
                <div className="relative overflow-hidden rounded-2xl p-6 h-[400px] flex flex-col bg-[#1e293b] border border-white/10 shadow-xl group">
                    {/* Background Illustration */}
                    <div className="absolute -right-6 -bottom-6 text-blue-500/5 transform rotate-12 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                        <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5v-5z" />
                        </svg>
                    </div>

                    <h4 className="relative z-10 text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        Upcoming Events
                    </h4>

                    <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                        {isLoading ? (
                            [1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse"></div>)
                        ) : events.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3">
                                <p className="text-sm font-medium">No upcoming events</p>
                            </div>
                        ) : (
                            events.map(event => (
                                <div key={event.id} className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group/item">
                                    <div className="flex items-start gap-3">
                                        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/20 group-hover/item:scale-105 transition-transform">
                                            <span className="text-[10px] uppercase font-bold">{new Date(event.start).toLocaleString('default', { month: 'short' })}</span>
                                            <span className="text-lg font-bold leading-none">{new Date(event.start).getDate()}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-semibold text-white truncate group-hover/item:text-blue-400 transition-colors">
                                                    {event.title}
                                                </h4>
                                                {event.isShared && (
                                                    <span className="shrink-0" title="Shared Event">
                                                        <svg className="w-3.5 h-3.5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                        </svg>
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* My Tasks Column */}
                <div className="relative overflow-hidden rounded-2xl p-6 h-[400px] flex flex-col bg-[#1e293b] border border-white/10 shadow-xl group">
                    {/* Background Illustration */}
                    <div className="absolute -right-6 -bottom-6 text-emerald-500/5 transform -rotate-12 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                        <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                    </div>

                    <h4 className="relative z-10 text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </div>
                        My Pending Tasks
                    </h4>

                    <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                        {isLoading ? (
                            [1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse"></div>)
                        ) : tasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3">
                                <p className="text-sm font-medium">No pending tasks</p>
                            </div>
                        ) : (
                            tasks.map(task => (
                                <div key={task.id} className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group/item">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0 mr-2">
                                            <p className="font-semibold text-white truncate group-hover/item:text-emerald-400 transition-colors">
                                                {task.title.replace('Task: ', '')}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                                    task.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                                                        'bg-blue-500/20 text-blue-400'
                                                    }`}>
                                                    {task.priority || 'NORMAL'}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    Due: {new Date(task.start).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {showCreateModal && (
                <CreateEventModal
                    userId={userId}
                    onClose={() => setShowCreateModal(false)}
                    onEventCreated={() => fetchItems()}
                />
            )}
        </div>
    );
}

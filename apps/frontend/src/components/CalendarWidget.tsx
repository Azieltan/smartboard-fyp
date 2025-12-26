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
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Main Page</h3>
                    <p className="text-[var(--text-secondary)] text-sm">Your events and tasks across all groups</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    New Event
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Small Calendar Review (Events) */}
                <div className="glass-panel p-6 h-[500px] overflow-y-auto custom-scrollbar flex flex-col">
                    <h4 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Calendar Review
                    </h4>

                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse"></div>
                            ))}
                        </div>
                    ) : events.length > 0 ? (
                        <div className="space-y-3">
                            {events.map((event) => (
                                <div key={event.id} className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 transition-all group">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-[var(--text-primary)] group-hover:text-blue-500 transition-colors">{event.title}</p>
                                            <p className="text-xs text-[var(--text-muted)] mt-1">
                                                {new Date(event.start).toLocaleString([], {
                                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        {event.isShared && (
                                            <span className="w-2 h-2 rounded-full bg-indigo-500" title="Shared Event"></span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center flex-1 text-center opacity-40">
                            <svg className="w-12 h-12 text-slate-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm text-slate-400">No upcoming events</p>
                        </div>
                    )}
                </div>

                {/* Task Preview (Tasks) */}
                <div className="glass-panel p-6 h-[500px] overflow-y-auto custom-scrollbar flex flex-col">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        Task Preview
                    </h4>

                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse"></div>
                            ))}
                        </div>
                    ) : tasks.length > 0 ? (
                        <div className="space-y-3">
                            {tasks.map((task) => (
                                <div key={task.id} className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/10 transition-all group">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0 mr-2">
                                            <p className="font-medium text-white truncate group-hover:text-amber-200 transition-colors">
                                                {task.title.replace('Task: ', '')}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                                    task.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                                                        'bg-blue-500/20 text-blue-400'
                                                    }`}>
                                                    {task.priority || 'NORMAL'}
                                                </span>
                                                <span className="text-[10px] text-slate-500">
                                                    Due: {new Date(task.start).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center flex-1 text-center opacity-40">
                            <svg className="w-12 h-12 text-slate-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            <p className="text-sm text-slate-400">No pending tasks</p>
                        </div>
                    )}
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

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

    return (
        <div className="glass-panel p-8 min-h-[500px]">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">Timeline</h3>
                    <p className="text-slate-400 text-sm">Your events and tasks across all groups</p>
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

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {items.length > 0 ? (
                        items.map((item) => (
                            <div key={`${item.type}-${item.id}`} className="relative group">
                                <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${item.type === 'event'
                                        ? 'bg-blue-500/5 border-blue-500/10 hover:bg-blue-500/10 hover:border-blue-500/20'
                                        : 'bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/10 hover:border-amber-500/20'
                                    }`}>
                                    {/* Icon / Type Indicator */}
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${item.type === 'event'
                                            ? 'bg-blue-600/20 text-blue-400 shadow-blue-500/10'
                                            : 'bg-amber-600/20 text-amber-400 shadow-amber-500/10'
                                        }`}>
                                        {item.type === 'event' ? (
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                            </svg>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="text-white font-bold truncate group-hover:text-white/100 transition-colors">
                                                {item.title.replace('Task: ', '')}
                                            </h4>
                                            {item.isShared && (
                                                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-500/30">
                                                    Shared
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <p className="text-xs text-slate-500 font-medium">
                                                {new Date(item.start).toLocaleString([], {
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                            {item.type === 'task' && (
                                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${item.priority === 'high' ? 'bg-red-500/20 text-red-500' :
                                                        item.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-500'
                                                    }`}>
                                                    {item.priority}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Visual */}
                                    <div className="hidden group-hover:flex items-center gap-2 transition-all">
                                        <button className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-white font-medium">Nothing scheduled yet</p>
                            <p className="text-xs text-slate-500">Add an event or task to see it here</p>
                        </div>
                    )}
                </div>
            )}

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

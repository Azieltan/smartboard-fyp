'use client';
import React from 'react';

interface EventDetailModalProps {
    event: any;
    onClose: () => void;
    onEdit?: () => void;
}

export default function EventDetailModal({ event, onClose, onEdit }: EventDetailModalProps) {
    if (!event) return null;

    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);

    // Get current user ID to check ownership
    const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

    React.useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setCurrentUserId(user.user_id || user.id);
            } catch (e) {
                console.error('Failed to parse user', e);
            }
        }
    }, []);

    const isOwner = currentUserId && (event.user_id === currentUserId || event.created_by === currentUserId);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col scale-100 animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-white/10">
                {/* Header */}
                <div className="relative p-6 bg-gradient-to-br from-blue-600 to-indigo-600">
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-white/10 p-2 rounded-full hover:bg-white/20">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <div className="mt-4">
                        <span className="inline-block px-2 py-1 rounded-lg bg-white/20 text-white text-xs font-bold mb-3 border border-white/10">
                            {event.type === 'task' ? 'TASK' : 'EVENT'}
                        </span>
                        <h2 className="text-2xl font-bold text-white leading-tight">{event.title}</h2>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Time Section */}
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-white/5 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Date & Time</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                {startDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-500">
                                {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>

                    {/* Description Section */}
                    {event.description && (
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-white/5 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Description</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                    {event.description}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Shared With Section (Example logic) */}
                    {(event.group_id || event.isShared) && (
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-white/5 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Participants</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {event.group_id ? "Shared with Group" : "Shared Event"}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-white/10 flex justify-between">
                    {isOwner && onEdit ? (
                        <button
                            onClick={onEdit}
                            className="px-4 py-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            Edit
                        </button>
                    ) : <div></div>}
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-xl font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

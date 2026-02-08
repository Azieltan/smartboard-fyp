'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { useRouter } from 'next/navigation';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
    metadata?: any;
}

export function NotificationBell({ userId }: { userId: string }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const fetchNotifications = async () => {
        if (!userId) return;
        try {
            const data = await api.get(`/notifications/${userId}`);
            if (Array.isArray(data)) {
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.read).length);
            }
        } catch (e: any) {
            // Only log if it's not a 404 (which might happen if user has no notifications yet, though API returns [] usually)
            // or if it's a real error.
            // Check if e.response exists in case of network errors
            if (e?.response && e.response.status !== 404) {
                // If 500 and empty data/object, it's likely a stale user ID or unexpected server state.
                const responseData = e.response.data || {};
                const isStaleError = e.response.status === 500 && Object.keys(responseData).length === 0;

                if (!isStaleError) {
                    console.error("Failed to fetch notifications", e);
                    if (responseData && Object.keys(responseData).length > 0) {
                        console.error("Error response data:", responseData);
                    }
                }
            }
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds for simplicity (or use socket if available)
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [userId]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id: string) => {
        try {
            await api.put(`/notifications/${id}/read`, {});
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) {
            console.error("Failed to mark as read", e);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.put(`/notifications/${userId}/read-all`, {});
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (e) {
            console.error("Failed to mark all as read", e);
        }
    };

    useEffect(() => {
        if (isOpen && unreadCount > 0) {
            handleMarkAllRead();
        }
    }, [isOpen]);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id));
            // Unread count handled by effect if open, or fetch
        } catch (e) {
            console.error("Failed to delete notification", e);
        }
    };

    const handleNotificationClick = async (n: Notification) => {
        if (!n.read) await handleMarkAsRead(n.id);

        // Handle navigation based on type/metadata
        if (n.type === 'group_invite' && n.metadata?.groupId) {
            router.push(`/dashboard/chat`);
        } else if (n.type === 'friend_request') {
            router.push('/dashboard/chat');
        } else if (n.type === 'chat_message') {
            router.push('/dashboard/chat');
        } else if (n.type === 'task_assigned' || n.type === 'task_submission' || n.type === 'task_review') {
            router.push('/dashboard/tasks');
        }
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-[#0f172a] animate-pulse"></span>
                )}
            </button>

            {unreadCount > 0 && !isOpen && (
                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-max px-3 py-1.5 bg-red-500 text-white text-[10px] font-bold rounded-lg shadow-lg animate-bounce pointer-events-none z-50">
                    You have unread messages!
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-red-500"></div>
                </div>
            )}

            {isOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-80 bg-[#1e293b] dark:bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-center p-3 border-b border-white/10 bg-white/5">
                        <h3 className="font-bold text-sm text-white">Notifications</h3>
                        {/* Auto-read is now default, so distinct 'Mark all read' button is less critical but can stay if needed, strictly speaking not needed if automatic */}
                    </div>

                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={`relative p-3 border-b border-white/5 cursor-pointer transition-colors group ${n.read ? 'hover:bg-white/5 opacity-60' : 'bg-blue-500/10 hover:bg-blue-500/20'}`}
                                >
                                    <div className="flex gap-3 pr-6">
                                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.read ? 'bg-transparent' : 'bg-blue-500'}`}></div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{n.title}</p>
                                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                                            <p className="text-[10px] text-slate-500 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(e, n.id)}
                                        className="absolute top-2 right-2 p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

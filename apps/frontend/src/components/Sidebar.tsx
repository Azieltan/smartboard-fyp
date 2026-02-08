'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { NotificationBell } from './NotificationBell';
import { socket } from '@/lib/socket';

interface User {
    user_id: string;
    username: string;
    email: string;
    role?: string;
    name?: string;
    user_name?: string;
}

const staticNavigation = [
    {
        name: 'Dashboard',
        href: '/dashboard',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
        ),
        gradient: 'from-blue-500 to-violet-500'
    },
    {
        name: 'Calendar',
        href: '/dashboard/calendar',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
        gradient: 'from-cyan-500 to-blue-500'
    },
    {
        name: 'Tasks',
        href: '/dashboard/tasks',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
        ),
        gradient: 'from-emerald-500 to-teal-500'
    },
    {
        name: 'Chat',
        href: '/dashboard/chat',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
        ),
        gradient: 'from-pink-500 to-rose-500'
    },

    {
        name: 'Settings',
        href: '/dashboard/settings',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
        gradient: 'from-slate-500 to-slate-600'
    },
];

interface SidebarProps {
    onSearchClick?: () => void;
}

export function Sidebar({ onSearchClick }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr && userStr !== 'undefined') {
            try {
                const parsedUser = JSON.parse(userStr);
                setUser(parsedUser);

                // Join user room for notifications and admin actions
                socket.connect();
                socket.emit('join_room', parsedUser.user_id);

                socket.on('force_logout', (message: string) => {
                    alert(message || 'Your account has been deactivated.');
                    handleLogout();
                });
            } catch (e) {
                console.error('Failed to parse user');
            }
        }

        return () => {
            socket.off('force_logout');
            if (userStr) {
                try {
                    const parsedUser = JSON.parse(userStr);
                    socket.emit('leave_room', parsedUser.user_id);
                } catch (e) { }
            }
        };
    }, []);

    const navigation = [...staticNavigation];
    if (user?.role === 'admin' || user?.role === 'systemadmin') {
        navigation.splice(4, 0, { // Insert before Settings
            name: 'Admin Portal',
            href: '/dashboard/admin', // Updated to nest under dashboard
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
            ),
            gradient: 'from-orange-500 to-red-500'
        });
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    const getInitials = (name: string = 'User') => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="w-72 bg-[var(--background)] border-r border-[var(--border-color)] flex flex-col h-screen sticky top-0 transition-colors duration-300 z-50">
            {/* Logo */}
            <div className="p-6 flex items-center gap-3 border-b border-slate-200 dark:border-white/10">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-violet-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/30 animate-bounce-subtle">
                    S
                </div>
                <span className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
                    Smart<span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-violet-500">Board</span>
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                {/* Search Button */}
                {onSearchClick && (
                    <button
                        onClick={onSearchClick}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all duration-300 group mb-4"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="font-medium">Search</span>
                        <kbd className="ml-auto px-2 py-0.5 bg-white/10 rounded text-[10px] text-slate-500">Ctrl+K</kbd>
                    </button>
                )}

                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-4 mb-4">Menu</p>
                {navigation.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${isActive
                                ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg`
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            {/* Hover glow effect */}
                            {!isActive && (
                                <div className={`absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity ${item.gradient}`} />
                            )}
                            <span className={`transition-transform duration-300 ${isActive ? '' : 'group-hover:scale-110'}`}>
                                {item.icon}
                            </span>
                            <span className="font-medium">{item.name}</span>
                            {isActive && (
                                <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors group">
                    <Link href="/dashboard/settings" className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-pink-500/30">
                            {getInitials(user?.name || user?.user_name || user?.username)}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                            {user?.role && (
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mb-0.5 tracking-wider ${user.role === 'admin' || user.role === 'systemadmin'
                                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm'
                                    : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                                    }`}>
                                    {user.role}
                                </span>
                            )}
                            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user?.name || user?.user_name || user?.username || 'User'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email || 'user@example.com'}</p>

                        </div>
                    </Link>
                    <div className="flex items-center gap-1">
                        {user && <NotificationBell userId={user.user_id} />}
                        <button
                            onClick={handleLogout}
                            className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Logout"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

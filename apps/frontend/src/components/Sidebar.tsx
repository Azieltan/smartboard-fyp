'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
    { name: 'Calendar', href: '/dashboard', icon: '📅' },
    { name: 'Tasks', href: '/dashboard/tasks', icon: '✅' },
    { name: 'Chat', href: '/dashboard/chat', icon: '💬' },
    { name: 'Groups', href: '/dashboard/groups', icon: '👥' },
    { name: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 bg-[#0f172a] border-r border-white/10 flex flex-col h-screen sticky top-0">
            <div className="p-6 flex items-center gap-3 border-b border-white/10">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center text-white font-bold">
                    S
                </div>
                <span className="text-xl font-bold text-white tracking-tight">SmartBoard</span>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/10">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-xs font-bold text-white">
                        JD
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">John Doe</p>
                        <p className="text-xs text-slate-400 truncate">john@example.com</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

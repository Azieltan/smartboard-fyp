'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-900">
      {/* Admin Sidebar */}
      <div className="w-64 bg-slate-800 border-r border-white/10 flex flex-col h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold">
            A
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Admin Panel</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === '/admin'
              ? 'bg-red-600 text-white shadow-lg shadow-red-500/20'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
          >
            <span className="text-xl">📊</span>
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all"
          >
            <span className="text-xl">⬅️</span>
            <span className="font-medium">Back to App</span>
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

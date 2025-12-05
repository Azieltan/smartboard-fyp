'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Simple role check (mock for now, replace with real auth check)
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      // In a real app, you'd check user.role === 'admin'
      // For now, we'll allow access if the user exists, but normally we'd redirect
      // if (user.role !== 'admin') {
      //     router.push('/dashboard');
      // } else {
      //     setAuthorized(true);
      // }
      setAuthorized(true); // Allowing all logged-in users for testing purposes as requested
    } else {
      router.push('/login');
    }
  }, [router]);

  if (!authorized) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">System Administration</h1>
        <p className="text-slate-400 mt-1">Manage users, system settings, and logs.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 border-l-4 border-blue-500">
          <h3 className="text-lg font-bold text-white mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-blue-400">1,234</p>
        </div>
        <div className="glass-panel p-6 border-l-4 border-green-500">
          <h3 className="text-lg font-bold text-white mb-2">Active Tasks</h3>
          <p className="text-3xl font-bold text-green-400">856</p>
        </div>
        <div className="glass-panel p-6 border-l-4 border-purple-500">
          <h3 className="text-lg font-bold text-white mb-2">System Status</h3>
          <p className="text-3xl font-bold text-purple-400">Healthy</p>
        </div>
      </div>

      <div className="glass-panel p-6">
        <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <div className="flex-1">
                <p className="text-white font-medium">User registration</p>
                <p className="text-sm text-slate-400">New user joined the platform</p>
              </div>
              <span className="text-xs text-slate-500">2 mins ago</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

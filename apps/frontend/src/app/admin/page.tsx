'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeTasks: 0,
    systemStatus: 'Checking...',
    recentActivity: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Auth Check
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role !== 'admin' && user.user_name !== 'admin') {
        router.push('/dashboard');
      } else {
        setAuthorized(true);
        fetchStats();
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res);
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
      setStats(prev => ({ ...prev, systemStatus: 'Error' }));
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

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
          <p className="text-3xl font-bold text-blue-400">
            {loading ? <span className="animate-pulse">...</span> : stats.totalUsers}
          </p>
        </div>
        <div className="glass-panel p-6 border-l-4 border-green-500">
          <h3 className="text-lg font-bold text-white mb-2">Active Tasks</h3>
          <p className="text-3xl font-bold text-green-400">
            {loading ? <span className="animate-pulse">...</span> : stats.activeTasks}
          </p>
        </div>
        <div className="glass-panel p-6 border-l-4 border-purple-500">
          <h3 className="text-lg font-bold text-white mb-2">System Status</h3>
          <p className="text-3xl font-bold text-purple-400">{stats.systemStatus}</p>
        </div>
      </div>

      <div className="glass-panel p-6">
        <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {loading ? (
            <div className="text-slate-500 italic">Loading activity...</div>
          ) : stats.recentActivity.length > 0 ? (
            stats.recentActivity.map((activity, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg transition-colors hover:bg-white/10">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <div className="flex-1">
                  <p className="text-white font-medium">{activity.type}</p>
                  <p className="text-sm text-slate-400">{activity.description}</p>
                </div>
                <span className="text-xs text-slate-500">{formatTimeAgo(activity.timestamp)}</span>
              </div>
            ))
          ) : (
            <div className="text-slate-500 italic">No recent activity.</div>
          )}
        </div>
      </div>
    </div>
  );
}

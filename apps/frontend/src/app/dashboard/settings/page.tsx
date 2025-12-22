'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
// import FileUpload from '../../../components/FileUpload'; // Unlock this when avatar backend is ready

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Profile State
  const [username, setUsername] = useState('');

  // Security State
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setUser(u);
      setUsername(u.username || u.user_name || '');
    }
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.put(`/users/${user.user_id}`, { user_name: username });
      // Update local storage
      const newUser = { ...user, user_name: username, username };
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      alert('Profile updated successfully!');
      window.location.reload(); // Force refresh to update Sidebar
    } catch (error: any) {
      alert('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alert('New passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/auth/change-password', {
        userId: user.user_id,
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      alert('Password changed successfully');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.error || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  if (!user) return <div className="text-slate-400 p-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-colors text-sm font-medium"
        >
          Log Out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-white/10">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-1 text-sm font-medium transition-colors relative ${activeTab === 'profile' ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}
        >
          Profile Settings
          {activeTab === 'profile' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400 rounded-full"></div>}
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 px-1 text-sm font-medium transition-colors relative ${activeTab === 'security' ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}
        >
          Security & Password
          {activeTab === 'security' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400 rounded-full"></div>}
        </button>
      </div>

      <div className="glass-panel p-8 animate-in fade-in duration-300">
        {activeTab === 'profile' ? (
          <div className="space-y-8">
            {/* Avatar Section (Placeholder for now) */}
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                  {username ? username[0].toUpperCase() : 'U'}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Profile Photo</h3>
                <p className="text-sm text-slate-400 mb-3">Your initials are used as your default avatar.</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Display Name</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-slate-500 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">Email cannot be changed.</p>
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Current Password</label>
              <input
                type="password"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div className="space-y-4 pt-2 border-t border-white/5">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 bg-red-600/80 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all disabled:opacity-50"
              >
                {isLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

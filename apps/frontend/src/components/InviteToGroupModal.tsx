'use client';

import { useState } from 'react';
import { api } from '../lib/api';

interface InviteToGroupModalProps {
  groupId: string;
  userId: string;
  onClose: () => void;
}

interface UserResult {
  user_id: string;
  username: string;
  user_name: string;
  email: string;
  avatar_url?: string;
}

export default function InviteToGroupModal({ groupId, userId, onClose }: InviteToGroupModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      // Using existing search endpoint
      const data = await api.get(`/users/search?query=${encodeURIComponent(query)}`);
      // Filter out self
      const filtered = Array.isArray(data) ? data.filter((u: any) => u.user_id !== userId) : [];
      setResults(filtered);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (targetUserId: string) => {
    try {
      await api.post(`/groups/${groupId}/invite`, {
        requesterId: userId,
        targetUserId
      });
      setInvitedIds(prev => new Set(prev).add(targetUserId));
      // Optional: Show toast success
    } catch (error) {
      console.error('Invite failed:', error);
      alert('Failed to invite user');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="glass-panel-glow bg-[#1e293b] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Invite Members</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-4 py-3 pl-11 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              autoFocus
            />
            <svg className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="absolute right-2 top-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-500 disabled:opacity-0 transition-all"
            >
              Search
            </button>
          </form>

          <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar min-h-[100px]">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : results.length > 0 ? (
              results.map(user => {
                const isInvited = invitedIds.has(user.user_id);
                return (
                  <div key={user.user_id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                        {user.user_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">{user.user_name || user.username}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleInvite(user.user_id)}
                      disabled={isInvited}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isInvited
                          ? 'bg-emerald-500/20 text-emerald-500 cursor-default'
                          : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20'
                        }`}
                    >
                      {isInvited ? 'Sent' : 'Invite'}
                    </button>
                  </div>
                );
              })
            ) : query && !isLoading ? (
              <p className="text-center text-slate-500 py-4 text-sm">No users found</p>
            ) : (
              <p className="text-center text-slate-500 py-4 text-sm opacity-50">Type to search users</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

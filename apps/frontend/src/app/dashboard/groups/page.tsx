'use client';

import { useState } from 'react';

// Mock Data
const MOCK_FRIENDS = [
    { id: '1', name: 'Alice Smith', email: 'alice@example.com', status: 'online' },
    { id: '2', name: 'Bob Jones', email: 'bob@example.com', status: 'offline' },
];

const MOCK_GROUPS = [
    { id: '1', name: 'General Group', members: 12, role: 'Owner' },
    { id: '2', name: 'Project Alpha', members: 4, role: 'Member' },
];

export default function GroupsPage() {
    const [activeTab, setActiveTab] = useState<'groups' | 'friends'>('groups');

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Social & Groups</h1>
                    <p className="text-slate-400 mt-1">Manage your teams and connections.</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow-lg shadow-blue-500/20 transition-colors">
                    {activeTab === 'groups' ? '+ New Group' : '+ Invite Friend'}
                </button>
            </header>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('groups')}
                    className={`pb-3 px-1 text-sm font-medium transition-colors relative ${activeTab === 'groups' ? 'text-blue-400' : 'text-slate-400 hover:text-white'
                        }`}
                >
                    My Groups
                    {activeTab === 'groups' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400 rounded-full"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('friends')}
                    className={`pb-3 px-1 text-sm font-medium transition-colors relative ${activeTab === 'friends' ? 'text-blue-400' : 'text-slate-400 hover:text-white'
                        }`}
                >
                    Friends List
                    {activeTab === 'friends' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400 rounded-full"></div>}
                </button>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeTab === 'groups' ? (
                    MOCK_GROUPS.map((group) => (
                        <div key={group.id} className="glass-panel p-6 hover:border-blue-500/30 transition-colors group cursor-pointer">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white">
                                    {group.name[0]}
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-medium border ${group.role === 'Owner'
                                        ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                        : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                    }`}>
                                    {group.role}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{group.name}</h3>
                            <p className="text-sm text-slate-400">{group.members} members</p>

                            <div className="mt-6 flex gap-2">
                                <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-white transition-colors">
                                    View
                                </button>
                                {group.role === 'Owner' && (
                                    <button className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                                        ⚙️
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    MOCK_FRIENDS.map((friend) => (
                        <div key={friend.id} className="glass-panel p-4 flex items-center gap-4">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
                                    {friend.name[0]}
                                </div>
                                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0f172a] ${friend.status === 'online' ? 'bg-green-500' : 'bg-slate-500'
                                    }`}></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold text-white truncate">{friend.name}</h3>
                                <p className="text-xs text-slate-400 truncate">{friend.email}</p>
                            </div>
                            <button className="p-2 hover:bg-white/10 rounded-lg text-blue-400 hover:text-blue-300 transition-colors">
                                💬
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

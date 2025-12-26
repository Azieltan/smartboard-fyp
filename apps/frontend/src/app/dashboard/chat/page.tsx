'use client';

import { useState, useEffect } from 'react';
import Chat from '../../../components/Chat';
import { api } from '../../../lib/api';
import AddFriendModal from '../../../components/AddFriendModal';
import CreateGroupModal from '../../../components/CreateGroupModal';
import JoinGroupModal from '../../../components/JoinGroupModal';

interface Conversation {
    id: string;
    name: string;
    type: 'group' | 'dm';
    lastMessage?: string;
    time?: string;
    status?: 'online' | 'offline';
    avatar?: string;
    role?: string;
}

interface Group {
    group_id: string;
    name: string;
}

interface Friend {
    relationship_id: string;
    friend_id: string;
    friend_name: string;
    status: 'accepted' | 'pending';
    is_receiver: boolean;
}

export default function ChatPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'groups' | 'friends'>('all');

    // Modal & UI states
    const [showAddFriend, setShowAddFriend] = useState(false);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [showJoinGroup, setShowJoinGroup] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setUserId(user.user_id);
            fetchData(user.user_id);
        }
    }, []);

    const fetchData = async (uid: string) => {
        setIsLoading(true);
        try {
            const [groupRes, friendRes] = await Promise.all([
                api.get(`/groups/${uid}`),
                api.get(`/friends/${uid}`)
            ]);

            const groups = Array.isArray(groupRes) ? groupRes : [];
            const friends = Array.isArray(friendRes) ? friendRes : [];

            const groupConvs: Conversation[] = groups.map((g: any) => ({
                id: g.group_id,
                name: g.name,
                type: 'group',
                role: g.role
            }));

            // Process friends: filter accepted for the chat list, and separate pending for requests
            const acceptedFriends: Conversation[] = friends
                .filter((f: any) => f.status === 'accepted')
                .map((f: any) => ({
                    id: f.friend_details.user_id,
                    name: f.friend_details.user_name || f.friend_details.username || 'User',
                    type: 'dm',
                    status: 'online'
                }));

            const pending = friends
                .filter((f: any) => f.status === 'pending' && f.friend_id === uid)
                .map((f: any) => ({
                    relationship_id: f.relationship_id,
                    friend_id: f.user_id, // The person who sent it
                    friend_name: f.friend_details.user_name || f.friend_details.username || 'User',
                    status: 'pending' as const,
                    is_receiver: true
                }));

            setPendingRequests(pending);

            let combined = [...groupConvs, ...acceptedFriends];
            setConversations(combined);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            setConversations([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAcceptFriend = async (relId: string) => {
        try {
            await api.put(`/friends/${relId}/accept`, {});
            if (userId) fetchData(userId);
        } catch (error) {
            console.error('Failed to accept friend:', error);
            alert('Failed to accept friend request');
        }
    };

    const handleConversationClick = async (conv: Conversation) => {
        setSelectedConversation(conv);
        if (conv.type === 'dm') {
            try {
                const res = await api.post('/chats/dm', { user1Id: userId, user2Id: conv.id });
                setSelectedId(res.groupId);
            } catch (e) {
                console.error(e);
                alert('Failed to open DM');
            }
        } else {
            setSelectedId(conv.id);
        }
    };

    const filteredConversations = conversations.filter((c: Conversation) => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
        if (activeTab === 'all') return matchesSearch;
        if (activeTab === 'groups') return matchesSearch && c.type === 'group';
        if (activeTab === 'friends') return matchesSearch && c.type === 'dm';
        return matchesSearch;
    });

    if (!userId) {
        return <div className="p-8 text-center text-slate-400">Please login to view chats.</div>;
    }

    return (
        <div className="flex h-screen bg-[#0f172a] text-white overflow-hidden">
            {/* Conversation List */}
            <div className="w-[350px] bg-[#0f172a] border-r border-white/5 flex flex-col shrink-0 overflow-hidden">
                <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold tracking-tight text-white">Chats</h1>
                        <div className="relative">
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 ${showDropdown ? 'bg-blue-600 text-white rotate-45 shadow-lg shadow-blue-600/30' : 'hover:bg-white/5 text-slate-400'}`}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>

                            {showDropdown && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                                    <div className="absolute right-0 mt-3 w-52 bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-300 backdrop-blur-xl">
                                        <button onClick={() => { setShowAddFriend(true); setShowDropdown(false); }} className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 flex items-center gap-3 transition-colors text-slate-200 group">
                                            <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">👤</div>
                                            <span>Add Friend</span>
                                        </button>
                                        <button onClick={() => { setShowCreateGroup(true); setShowDropdown(false); }} className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 flex items-center gap-3 transition-colors text-slate-200 group">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">➕</div>
                                            <span>Create Group</span>
                                        </button>
                                        <button onClick={() => { setShowJoinGroup(true); setShowDropdown(false); }} className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 flex items-center gap-3 transition-colors text-slate-200 group">
                                            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">🧩</div>
                                            <span>Join Group</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search chats..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#1e293b] border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all placeholder-slate-500 text-white shadow-inner"
                        />
                        <svg className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    <div className="flex gap-2 pb-1 no-scrollbar overflow-x-auto">
                        <TabButton label="All" active={activeTab === 'all'} onClick={() => setActiveTab('all')} />
                        <TabButton label="Groups" active={activeTab === 'groups'} onClick={() => setActiveTab('groups')} />
                        <TabButton label="Friends" active={activeTab === 'friends'} onClick={() => setActiveTab('friends')} />
                    </div>
                </div>

                {/* Friend Requests */}
                {pendingRequests.length > 0 && (
                    <div className="px-5 mb-4">
                        <div className="flex items-center gap-2 mb-2 px-1">
                            <span className="flex h-2 w-2 rounded-full bg-pink-500 animate-pulse"></span>
                            <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Friend Requests ({pendingRequests.length})</h2>
                        </div>
                        <div className="space-y-2">
                            {pendingRequests.map(req => (
                                <div key={req.relationship_id} className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between group transition-all hover:bg-white/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-500 flex items-center justify-center font-bold text-xs uppercase">
                                            {req.friend_name[0]}
                                        </div>
                                        <span className="text-sm font-medium text-slate-200 truncate max-w-[120px]">{req.friend_name}</span>
                                    </div>
                                    <button
                                        onClick={() => handleAcceptFriend(req.relationship_id)}
                                        className="px-3 py-1.5 bg-pink-600 hover:bg-pink-500 text-white text-[10px] font-bold rounded-lg transition-colors shadow-lg shadow-pink-600/20"
                                    >
                                        Accept
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5 custom-scrollbar">
                    {isLoading ? (
                        <div className="space-y-2 p-2">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="text-center text-slate-500 p-8">
                            <div className="text-4xl mb-3 opacity-20">📭</div>
                            <p className="text-sm">No chats found</p>
                        </div>
                    ) : (
                        filteredConversations.map((conv: Conversation) => (
                            <button
                                key={conv.id}
                                onClick={() => handleConversationClick(conv)}
                                className={`w-full p-3 rounded-2xl flex items-center gap-4 transition-all duration-200 group relative ${selectedId === conv.id ? 'bg-blue-600/20 border-white/5' : 'hover:bg-white/5 border-transparent'} border`}
                            >
                                <div className="relative shrink-0">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shadow-lg transition-transform group-hover:scale-105 ${conv.type === 'group' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-teal-500 to-emerald-600'}`}>
                                        {conv.name[0]}
                                    </div>
                                    {conv.type === 'dm' && (
                                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0f172a] bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]`} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex justify-between items-start mb-0.5">
                                        <h3 className={`font-semibold truncate transition-colors ${selectedId === conv.id ? 'text-blue-400' : 'text-slate-100 group-hover:text-white'}`}>
                                            {conv.name}
                                        </h3>
                                        <span className="text-[9px] text-slate-500">12:45 PM</span>
                                    </div>
                                    <p className="text-xs text-slate-400 truncate leading-tight opacity-70">
                                        {conv.type === 'group' ? 'Tap to view group...' : 'Say hello!'}
                                    </p>
                                </div>
                                {selectedId === conv.id && (
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-l-full shadow-[0_0_12px_rgba(59,130,246,0.5)]" />
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Content */}
            <div className="flex-1 flex flex-col bg-[#0f172a] relative">
                {selectedId && selectedConversation ? (
                    <Chat
                        groupId={selectedId}
                        userId={userId}
                        title={selectedConversation.name}
                        type={selectedConversation.type}
                        role={selectedConversation.role}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-6">
                        <div className="relative">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-600/20 to-violet-600/20 rounded-full flex items-center justify-center text-5xl animate-bounce-subtle shadow-2xl">
                                💬
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs border-4 border-[#0f172a] shadow-lg">
                                ✨
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold text-slate-200">Start a Conversation</h2>
                            <p className="text-sm max-w-xs mx-auto text-slate-400 px-4">
                                Select a chat from the left or create a new group to get started.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showAddFriend && (
                <AddFriendModal userId={userId} onClose={() => setShowAddFriend(false)} />
            )}
            {showCreateGroup && (
                <CreateGroupModal userId={userId} onClose={() => setShowCreateGroup(false)} onGroupCreated={() => fetchData(userId)} />
            )}
            {showJoinGroup && (
                <JoinGroupModal userId={userId} onClose={() => setShowJoinGroup(false)} onGroupJoined={() => fetchData(userId)} />
            )}
        </div>
    );
}

function TabButton({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
        >
            {label}
        </button>
    );
}

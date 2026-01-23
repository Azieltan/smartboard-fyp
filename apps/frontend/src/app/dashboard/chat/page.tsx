'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Chat from '../../../components/Chat';
import { api } from '../../../lib/api';
import { socket } from '../../../lib/socket';
import AddFriendModal from '../../../components/AddFriendModal';
import CreateGroupModal from '../../../components/CreateGroupModal';
import JoinGroupModal from '../../../components/JoinGroupModal';

interface Conversation {
    id: string;
    name: string;
    type: 'group' | 'dm';
    lastMessage?: string;
    time?: string;
    avatar?: string;
    role?: string;
    groupId?: string; // Real backend Group ID (different from 'id' for DMs)
    totalMessages?: number;
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

import { NotificationManager } from '../../../components/NotificationManager';

export default function ChatPage() {
    const [userId, setUserId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [showJoinGroup, setShowJoinGroup] = useState(false);
    const [showAddFriend, setShowAddFriend] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'groups' | 'friends'>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const selectedIdRef = useRef<string | null>(null); // Ref to access current selection in socket callback
    const [selectedType, setSelectedType] = useState<'group' | 'dm' | null>(null);
    const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

    // Keep ref in sync
    useEffect(() => {
        selectedIdRef.current = selectedId;
    }, [selectedId]);

    // Load user
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setUserId(user.user_id);
            } catch (e) {
                console.error("Failed to parse user", e);
            }
        }
    }, []);

    const fetchData = useCallback(async (uid: string, background: boolean = false) => {
        if (!background) setIsLoading(true);
        try {
            const groups = await api.get(`/groups/${uid}`);
            const friends = await api.get(`/friends/${uid}`);

            const groupConvs: Conversation[] = groups.map((g: any) => ({
                id: g.group_id,
                name: g.name,
                type: 'group',
                role: g.role,
                lastMessage: g.last_message?.content,
                time: g.last_message?.send_time,
                totalMessages: Number(g.total_messages || 0),
                groupId: g.group_id
            }));

            const friendConvs: Conversation[] = friends
                .filter((f: any) => f.status === 'accepted')
                .map((f: any) => ({
                    id: f.friend_details?.user_id || f.friend_id,
                    name: f.friend_details?.user_name || 'Unknown User',
                    type: 'dm',
                    lastMessage: f.last_message?.content,
                    time: f.last_message?.send_time,
                    totalMessages: Number(f.total_messages || 0),
                    groupId: f.dm_group_id
                }));

            // Calc unread
            const readCounts = JSON.parse(localStorage.getItem('chat_read_counts') || '{}');
            const newUnread: Record<string, number> = {};

            groupConvs.forEach(c => {
                const lastRead = readCounts[c.id] || 0;
                if ((c.totalMessages || 0) > lastRead) {
                    newUnread[c.id] = (c.totalMessages || 0) - lastRead;
                }
            });
            friendConvs.forEach(c => {
                const lastRead = readCounts[c.id] || 0;
                if ((c.totalMessages || 0) > lastRead) {
                    newUnread[c.id] = (c.totalMessages || 0) - lastRead;
                }
            });
            setUnreadCounts(newUnread);

            // Pending requests
            const pending = friends
                .filter((f: any) => f.status === 'pending' && f.friend_id === uid)
                .map((f: any) => ({
                    ...f,
                    friend_name: f.friend_details?.user_name || 'Unknown User'
                }));
            setPendingRequests(pending);

            // Sort all by time
            const all = [...groupConvs, ...friendConvs].sort((a, b) => {
                const tA = new Date(a.time || 0).getTime();
                const tB = new Date(b.time || 0).getTime();
                return tB - tA;
            });

            setConversations(all);
        } catch (error) {
            console.error('Failed to fetch chats:', error);
        } finally {
            if (!background) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (userId) {
            fetchData(userId);
        }
    }, [userId, fetchData]);

    const handleAcceptFriend = async (relationshipId: string) => {
        try {
            await api.put(`/friends/${relationshipId}/accept`, {});
            if (userId) fetchData(userId);
        } catch (error) {
            console.error('Failed to accept friend:', error);
        }
    };

    const handleRejectFriend = async (relationshipId: string) => {
        try {
            await api.put(`/friends/${relationshipId}/reject`, {});
            setPendingRequests(prev => prev.filter(req => req.relationship_id !== relationshipId));
        } catch (error) {
            console.error('Failed to reject friend:', error);
        }
    };

    // Socket: Join Rooms (Reactive to list changes)
    useEffect(() => {
        if (!userId) return;

        conversations.forEach(c => {
            const roomId = c.groupId || c.id;
            if (roomId) socket.emit('join_room', roomId);
        });
    }, [conversations, userId]);

    // Socket: Main Listener (Stable)
    useEffect(() => {
        if (!userId) return;

        console.log('[Sidebar] Initializing socket listener');
        socket.connect();
        socket.emit('join_room', userId);

        const handleNewMessageSidebar = (msg: any) => {
            if (!msg || !msg.group_id) return;

            setConversations(prev => {
                // Find conversation by matching groupId
                let convIndex = prev.findIndex(c => (c.groupId || c.id) === msg.group_id);

                // Fallback for DMs: match by sender ID logic if Group ID is not yet linked
                // This covers the case where User A sends to User B, and User B receives it via user_room
                // but hasn't "discovered" the dm_group_id yet.
                if (convIndex === -1 && msg.user_id !== userId) {
                    convIndex = prev.findIndex(c => c.type === 'dm' && c.id === msg.user_id);
                }

                // If still not found, it might be a new DM or Group we were just added to.
                // We should re-fetch to get the new list.
                if (convIndex === -1) {
                    fetchData(userId, true); // Pass true to suppress loading state
                    return prev;
                }

                const updatedConv = { ...prev[convIndex] };
                updatedConv.lastMessage = msg.content;
                updatedConv.time = msg.send_time;
                updatedConv.totalMessages = (updatedConv.totalMessages || 0) + 1;

                // Cache the group_id if it was missing (e.g. first DM)
                if (!updatedConv.groupId) {
                    updatedConv.groupId = msg.group_id;
                }

                // Move to top
                const newConvs = [...prev];
                newConvs.splice(convIndex, 1);
                newConvs.unshift(updatedConv);

                // Update Unread Count state derived from this
                // Only if WE are NOT the sender
                if (msg.user_id !== userId) {
                    // Check if we are currently viewing this chat
                    const isViewing = selectedIdRef.current === updatedConv.id; // updatedConv.id is friendId for DMs, groupId for Groups

                    if (isViewing) {
                        // We are viewing it, so update read count immediately
                        const readCounts = JSON.parse(localStorage.getItem('chat_read_counts') || '{}');
                        readCounts[updatedConv.id] = updatedConv.totalMessages;
                        localStorage.setItem('chat_read_counts', JSON.stringify(readCounts));

                        // Ensure badge is 0
                        setUnreadCounts(current => ({ ...current, [updatedConv.id]: 0 }));
                    } else {
                        // We are NOT viewing it, show badge
                        setUnreadCounts(current => {
                            const lastRead = JSON.parse(localStorage.getItem('chat_read_counts') || '{}')[updatedConv.id] || 0;
                            const count = (updatedConv.totalMessages || 0) > lastRead ? (updatedConv.totalMessages || 0) - lastRead : 0;
                            console.log(`[Badge] ID: ${updatedConv.id}, Total: ${updatedConv.totalMessages}, LastRead: ${lastRead}, NewCount: ${count}`);
                            return { ...current, [updatedConv.id]: count };
                        });
                    }
                } else {
                    // If we SENT it, implicitly we read everything up to now (or at least this msg)
                    // Update local storage to match current total
                    const readCounts = JSON.parse(localStorage.getItem('chat_read_counts') || '{}');
                    readCounts[updatedConv.id] = updatedConv.totalMessages;
                    localStorage.setItem('chat_read_counts', JSON.stringify(readCounts));

                    // Clear badge if any existed (shouldn't really, but good safety)
                    setUnreadCounts(current => ({ ...current, [updatedConv.id]: 0 }));
                }

                return newConvs;
            });
        };

        socket.on('new_message', handleNewMessageSidebar);

        return () => {
            socket.off('new_message', handleNewMessageSidebar);
        }
    }, [userId, fetchData]);

    const handleConversationClick = (conv: Conversation) => {
        setSelectedId(conv.id);
        setSelectedType(conv.type);

        // Mark as read
        if (conv.type === 'group' || conv.type === 'dm') {
            const currentTotal = (conv as any).totalMessages || 0;
            const readCounts = JSON.parse(localStorage.getItem('chat_read_counts') || '{}');
            readCounts[conv.id] = currentTotal;
            localStorage.setItem('chat_read_counts', JSON.stringify(readCounts));

            // Clear badge
            setUnreadCounts(prev => ({ ...prev, [conv.id]: 0 }));
        }
    };

    const filteredConversations = conversations.filter(conv => {
        const matchesSearch = (conv.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'all' ||
            (activeTab === 'groups' && conv.type === 'group') ||
            (activeTab === 'friends' && conv.type === 'dm');
        return matchesSearch && matchesTab;
    });

    const selectedConversation = conversations.find(c => c.id === selectedId);

    if (!userId) {
        return <div className="p-8 text-center text-slate-400">Please login to view chats.</div>;
    }

    return (
        <div className="flex h-screen bg-[#0f172a] text-white overflow-hidden">
            <NotificationManager userId={userId as string} />
            {/* Conversation List */}
            <div className="w-[350px] bg-[#0f172a] border-r border-white/5 flex flex-col shrink-0 overflow-hidden">
                <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold tracking-tight text-white">Chats</h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
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

                        {/* Quick Actions Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 ${showDropdown ? 'bg-blue-600 text-white rotate-45 shadow-lg shadow-blue-600/30' : 'bg-[#1e293b] hover:bg-white/10 text-slate-400'}`}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>

                            {showDropdown && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl z-20 py-1 animate-in fade-in zoom-in-95 duration-200">
                                        <button onClick={() => { setShowCreateGroup(true); setShowDropdown(false); }} className="w-full px-4 py-2.5 text-left text-xs font-medium hover:bg-white/5 flex items-center gap-2 transition-colors text-slate-300 hover:text-white group">
                                            <span className="w-6 h-6 rounded bg-blue-500/20 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">➕</span>
                                            Create Group
                                        </button>
                                        <button onClick={() => { setShowJoinGroup(true); setShowDropdown(false); }} className="w-full px-4 py-2.5 text-left text-xs font-medium hover:bg-white/5 flex items-center gap-2 transition-colors text-slate-300 hover:text-white group">
                                            <span className="w-6 h-6 rounded bg-amber-500/20 text-amber-500 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all">🔗</span>
                                            Join Group
                                        </button>
                                        <div className="h-px bg-white/5 mx-2 my-1"></div>
                                        <button onClick={() => { setShowAddFriend(true); setShowDropdown(false); }} className="w-full px-4 py-2.5 text-left text-xs font-medium hover:bg-white/5 flex items-center gap-2 transition-colors text-slate-300 hover:text-white group">
                                            <span className="w-6 h-6 rounded bg-pink-500/20 text-pink-500 flex items-center justify-center group-hover:bg-pink-500 group-hover:text-white transition-all">👤</span>
                                            Add Friend
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
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
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleRejectFriend(req.relationship_id)}
                                            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold rounded-lg transition-colors"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleAcceptFriend(req.relationship_id)}
                                            className="px-3 py-1.5 bg-pink-600 hover:bg-pink-500 text-white text-[10px] font-bold rounded-lg transition-colors shadow-lg shadow-pink-600/20"
                                        >
                                            Accept
                                        </button>
                                    </div>
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
                        <>
                            {activeTab === 'all' ? (
                                <>
                                    {/* Groups Section */}
                                    {filteredConversations.some(c => c.type === 'group') && (
                                        <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                            <span>Groups</span>
                                            <div className="h-px bg-white/5 flex-1" />
                                        </div>
                                    )}
                                    {filteredConversations.filter(c => c.type === 'group').map((conv) => (
                                        <ConversationItem
                                            key={conv.id}
                                            conv={conv}
                                            selectedId={selectedId}
                                            unreadCount={unreadCounts[conv.id] || 0}
                                            onClick={() => handleConversationClick(conv)}
                                        />
                                    ))}

                                    {/* Friends Section */}
                                    {filteredConversations.some(c => c.type === 'dm') && (
                                        <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mt-2">
                                            <span>Friends</span>
                                            <div className="h-px bg-white/5 flex-1" />
                                        </div>
                                    )}
                                    {filteredConversations.filter(c => c.type === 'dm').map((conv) => (
                                        <ConversationItem
                                            key={conv.id}
                                            conv={conv}
                                            selectedId={selectedId}
                                            unreadCount={unreadCounts[conv.id] || 0}
                                            onClick={() => handleConversationClick(conv)}
                                        />
                                    ))}
                                </>
                            ) : (
                                filteredConversations.map((conv: Conversation) => (
                                    <ConversationItem
                                        key={conv.id}
                                        conv={conv}
                                        selectedId={selectedId}
                                        unreadCount={unreadCounts[conv.id] || 0}
                                        onClick={() => handleConversationClick(conv)}
                                    />
                                ))
                            )}
                        </>
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
                <AddFriendModal userId={userId as string} onClose={() => setShowAddFriend(false)} />
            )}
            {showCreateGroup && (
                <CreateGroupModal userId={userId as string} onClose={() => setShowCreateGroup(false)} onGroupCreated={() => fetchData(userId as string)} />
            )}
            {showJoinGroup && (
                <JoinGroupModal userId={userId as string} onClose={() => setShowJoinGroup(false)} onGroupJoined={() => fetchData(userId as string)} />
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

function ConversationItem({ conv, selectedId, unreadCount, onClick }: { conv: Conversation, selectedId: string | null, unreadCount?: number, onClick: () => void }) {
    // Format timestamp
    const formatTime = (isoString?: string) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <button
            onClick={onClick}
            className={`w-full p-3 rounded-2xl flex items-center gap-4 transition-all duration-200 group relative ${selectedId === conv.id ? 'bg-blue-600/20 border-white/5' : 'hover:bg-white/5 border-transparent'} border`}
        >
            <div className="relative shrink-0">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shadow-lg transition-transform group-hover:scale-105 ${conv.type === 'group' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-teal-500 to-emerald-600'}`}>
                    {conv.name[0]}
                </div>
            </div>
            <div className="flex-1 min-w-0 text-left">
                <div className="flex justify-between items-start mb-0.5">
                    <h3 className={`font-semibold truncate transition-colors ${selectedId === conv.id ? 'text-blue-400' : 'text-slate-100 group-hover:text-white'}`}>
                        {conv.name}
                    </h3>
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] text-slate-500">{formatTime(conv.time)}</span>
                        {unreadCount && unreadCount > 0 ? (
                            <span className="mt-1 min-w-[16px] h-4 px-1 rounded-full bg-blue-500 text-[9px] font-bold text-white flex items-center justify-center">
                                {unreadCount}
                            </span>
                        ) : null}
                    </div>
                </div>
                <p className="text-xs text-slate-400 truncate leading-tight opacity-70">
                    {conv.lastMessage || (conv.type === 'group' ? 'Tap to view group...' : 'Say hello!')}
                </p>
            </div>
            {selectedId === conv.id && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-l-full shadow-[0_0_12px_rgba(59,130,246,0.5)]" />
            )}
        </button>
    );
}

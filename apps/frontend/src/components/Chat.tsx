'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../lib/api';
import AddMemberModal from './AddMemberModal';
import CreateGroupModal from './CreateGroupModal';
import JoinGroupModal from './JoinGroupModal';
import AddFriendModal from './AddFriendModal';
import GroupInfoModal from './GroupInfoModal';
import { socket } from '../lib/socket';
import Image from 'next/image';

interface Message {
    message_id: string;
    chat_id: string;
    content: string;
    user_id: string;
    send_time: string;
    user_name?: string;
    email?: string;
}

interface ChatProps {
    groupId: string;
    userId: string;
    title?: string;
    type?: 'group' | 'dm';
    role?: string;
}

export default function Chat({ groupId, userId, title = 'Conversation', type = 'group' }: ChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [chatId, setChatId] = useState<string | null>(null);
    const [effectiveGroupId, setEffectiveGroupId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastSentRef = useRef<{ content: string, time: number }>({ content: '', time: 0 });
    const [showMenu, setShowMenu] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);

    // New State for Info Modal
    const [showGroupInfo, setShowGroupInfo] = useState(false);

    // Header Menu & Modals
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [showJoinGroup, setShowJoinGroup] = useState(false);
    const [showAddFriend, setShowAddFriend] = useState(false);

    // 1. Resolve the effective groupId for this conversation.
    // - For group chats: groupId is already a real group_id.
    // - For DMs: groupId is the friend user_id; we must call /chats/dm to get/create the underlying direct-chat group.
    useEffect(() => {
        let cancelled = false;

        const initConversation = async () => {
            if (!groupId || !userId) return;

            // Reset state when switching conversations
            setMessages([]);
            setChatId(null);
            setEffectiveGroupId(null);

            if (type === 'dm') {
                try {
                    const dm = await api.post('/chats/dm', { user1Id: userId, user2Id: groupId });
                    if (cancelled) return;
                    if (dm?.groupId) setEffectiveGroupId(dm.groupId);
                    if (dm?.chatId) setChatId(dm.chatId);
                } catch (error: unknown) {
                    console.error('Failed to init DM chat', error);
                    // Optionally set an error state here to show UI
                }
                return;
            }

            // Group chat
            setEffectiveGroupId(groupId);

            try {
                const chat = await api.get(`/chats/group/${groupId}`);
                if (cancelled) return;
                if (chat && chat.chat_id) {
                    setChatId(chat.chat_id);
                }
            } catch (error: unknown) {
                // Ignore 404s as it just means the chat hasn't been created yet (will be created on first message)
                const err = error as { response?: { status?: number } };
                if (err?.response?.status !== 404) {
                    console.error('Failed to get chat details', error);
                }
            }
        };

        initConversation();
        return () => {
            cancelled = true;
        };
    }, [groupId, userId, type]);

    // 2. Socket Connection Logic
    useEffect(() => {
        if (!effectiveGroupId) return;

        console.log('Connecting socket for chat group:', effectiveGroupId);
        socket.connect();

        // Ensure we are in the correct room
        socket.emit('join_room', effectiveGroupId);

        const handleNewMessage = (msg: Message) => {
            console.log('Received socket message:', msg);
            setMessages(prev => {
                // Deduplicate based on ID - very important to prevent doubling
                if (prev.some(m => m.message_id === msg.message_id)) {
                    console.log('Skipping duplicate message:', msg.message_id);
                    return prev;
                }
                return [...prev, msg];
            });
        };

        socket.on('new_message', handleNewMessage);

        return () => {
            console.log('Cleaning up socket for group:', effectiveGroupId);
            socket.emit('leave_room', effectiveGroupId);
            socket.off('new_message', handleNewMessage);
        };
    }, [effectiveGroupId]);

    const fetchMessages = useCallback(async (targetGroupId?: string | null) => {
        const gid = targetGroupId ?? effectiveGroupId;
        if (!gid) return;
        try {
            const data = await api.get(`/chats/${gid}/messages`);
            if (Array.isArray(data)) {
                setMessages(data);
            }
        } catch (error: unknown) {
            console.error('Failed to fetch messages:', error);
        }
    }, [effectiveGroupId]);

    useEffect(() => {
        if (effectiveGroupId) {
            fetchMessages(effectiveGroupId);
        }
    }, [effectiveGroupId, fetchMessages]);

    const sendMessage = async (e?: React.FormEvent, contentOverride?: string) => {
        if (e) e.preventDefault();
        const content = contentOverride || newMessage;
        if (!content.trim() || isLoading) return;
        if (!effectiveGroupId) return;

        // Rate limiting: Prevent sending the exact same message twice within 1 second
        const now = Date.now();
        if (content === lastSentRef.current.content && now - lastSentRef.current.time < 1000) {
            console.log('Preventing double send of same message');
            return;
        }
        lastSentRef.current = { content, time: now };

        const tempMessage: Message = {
            message_id: `temp-${Date.now()}`,
            chat_id: chatId || effectiveGroupId, // Fallback
            user_id: userId,
            content,
            send_time: new Date().toISOString()
        };

        // Optimistic update
        setMessages(prev => [...prev, tempMessage]);
        setNewMessage('');
        setIsLoading(true);

        try {
            const savedMessage = await api.post(`/chats/${effectiveGroupId}/messages`, {
                userId,
                content
            });

            // Replace temp message with real one, but ensure we don't duplicate if socket already added it
            setMessages(prev => {
                const withoutTemp = prev.filter(msg => msg.message_id !== tempMessage.message_id);
                if (withoutTemp.some(msg => msg.message_id === savedMessage.message_id)) {
                    return withoutTemp;
                }
                return [...withoutTemp, savedMessage];
            });
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } }, message?: string };
            const errorMessage = err?.response?.data?.error || err?.message || 'Failed to send message';
            console.error('Failed to send message:', errorMessage);
            alert(`Failed to send message: ${errorMessage}`);
            setMessages(prev => prev.filter(msg => msg.message_id !== tempMessage.message_id));
        } finally {
            setIsLoading(false);
        }
    };

    const handleAttach = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const data = await response.json();

            // Determine format based on file type
            const isImage = file.type.startsWith('image/');
            const messageContent = isImage
                ? `![Image](${data.url})`
                : `[${file.name}](${data.url})`;

            await sendMessage(undefined, messageContent);
        } catch (error: unknown) {
            const err = error as { message?: string };
            console.error('Upload error:', error);
            alert(`Failed to upload file: ${err?.message || 'Upload failed'}`);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const renderMessageContent = (content: string) => {
        // 1. Check for Image: ![Image](url)
        // strict check for message that IS an image
        const imageMatch = content.match(/^!\[Image\]\((.*?)\)$/);
        if (imageMatch) {
            return (
                <div className="space-y-2">
                    <Image
                        src={imageMatch[1]}
                        alt="Attachment"
                        width={800}
                        height={600}
                        className="max-w-full rounded-lg border border-white/10 max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        loading="lazy"
                        onClick={() => window.open(imageMatch[1], '_blank')}
                    />
                </div>
            );
        }

        // 2. Check for File: [filename](url)
        // strict check for message that IS a file link
        const fileMatch = content.match(/^\[(.*?)\]\((.*?)\)$/);
        if (fileMatch) {
            const fileName = fileMatch[1];
            const url = fileMatch[2];
            return (
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors group"
                >
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{fileName}</p>
                        <p className="text-xs text-slate-500 text-left">Click to download</p>
                    </div>
                </a>
            );
        }

        return <p className="text-sm whitespace-pre-wrap">{content}</p>;
    };

    if (!groupId) {
        return (
            <div className="h-[500px] glass-panel flex items-center justify-center text-slate-400">
                Select a group to start chatting
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden bg-[#0f172a]">
            {/* WhatsApp Style Header */}
            <div className="h-16 border-b border-white/5 bg-[#1e293b]/50 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg ${type === 'group' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-teal-500 to-emerald-600'}`}>
                        {title.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white leading-tight">{title}</h3>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>

                    {/* 3-Dot Menu - Visible for all group chats */}
                    {type === 'group' && (
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                            </button>
                            {showMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                setShowGroupInfo(true);
                                            }}
                                            className="w-full px-4 py-3 text-left text-sm text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10 transition-colors flex items-center gap-3"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Group Info
                                        </button>

                                        {/* Quick Add Member - Shortcut Removed per user request */}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar chat-bg-pattern">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 space-y-2 opacity-50">
                        <span className="text-4xl">✨</span>
                        <p className="text-sm">Start of a new conversation</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.message_id}
                            className={`flex flex-col ${msg.user_id === userId ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                        >
                            {msg.user_id !== userId && (
                                <span className="text-[10px] text-slate-500 font-medium ml-2 mb-1">
                                    {msg.user_name || 'Anonymous'}
                                </span>
                            )}
                            <div
                                className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm dark:shadow-xl transition-transform hover:scale-[1.01] ${msg.user_id === userId
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-white/5'
                                    }`}
                            >
                                {renderMessageContent(msg.content)}
                                <div className={`flex items-center gap-1 mt-1 justify-end opacity-60`}>
                                    <span className="text-[9px]">
                                        {msg.send_time ? new Date(msg.send_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                                    </span>
                                    {msg.user_id === userId && (
                                        <svg className="w-3 h-3 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[#1e293b]/80 backdrop-blur-md border-t border-white/5">
                <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex gap-3 items-center">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={handleAttach}
                        disabled={isUploading}
                        className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50"
                        title="Attach file"
                    >
                        {isUploading ? (
                            <div className="w-5 h-5 border-2 border-slate-400 dark:border-white/20 border-t-slate-600 dark:border-t-white rounded-full animate-spin" />
                        ) : (
                            <svg className="w-6 h-6 rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                        )}
                    </button>

                    <div className="flex-1 relative flex items-center">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all text-sm shadow-inner"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !newMessage.trim()}
                        className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all shadow-lg ${!newMessage.trim() ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500' : 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-105 active:scale-95 shadow-blue-600/20'}`}
                    >
                        <svg className="w-5 h-5 ml-1 fill-current" viewBox="0 0 24 24">
                            <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" />
                        </svg>
                    </button>
                </form>
            </div>

            {showGroupInfo && (
                <GroupInfoModal
                    groupId={groupId}
                    userId={userId}
                    onClose={() => setShowGroupInfo(false)}
                />
            )}

            {showCreateGroup && (
                <CreateGroupModal
                    userId={userId}
                    onClose={() => setShowCreateGroup(false)}
                    onGroupCreated={() => {
                        setShowCreateGroup(false);
                        window.location.reload();
                    }}
                />
            )}

            {showJoinGroup && (
                <JoinGroupModal
                    userId={userId}
                    onClose={() => setShowJoinGroup(false)}
                    onGroupJoined={() => {
                        setShowJoinGroup(false);
                        window.location.reload();
                    }}
                />
            )}

            {showAddMember && (
                <AddMemberModal
                    groupId={groupId}
                    userId={userId}
                    onClose={() => setShowAddMember(false)}
                />
            )}

            {showAddFriend && (
                <AddFriendModal
                    userId={userId}
                    onClose={() => setShowAddFriend(false)}
                />
            )}
        </div >
    );
}

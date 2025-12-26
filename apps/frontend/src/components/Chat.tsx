'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import AddMemberModal from './AddMemberModal';
import { socket } from '../lib/socket';

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

export default function Chat({ groupId, userId, title = 'Conversation', type = 'group', role }: ChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [chatId, setChatId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastSentRef = useRef<{ content: string, time: number }>({ content: '', time: 0 });
    const [showMenu, setShowMenu] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);

    // 1. Get Chat Details (ID) for Socket Room
    useEffect(() => {
        if (groupId) {
            fetchChatDetails();
            fetchMessages(); // Initial fetch
        }
    }, [groupId]);

    const fetchChatDetails = async () => {
        try {
            const chat = await api.get(`/chats/group/${groupId}`);
            if (chat && chat.chat_id) {
                setChatId(chat.chat_id);
            }
        } catch (error) {
            console.error('Failed to get chat details', error);
        }
    };

    // 2. Socket Connection Logic
    useEffect(() => {
        if (!groupId) return;

        console.log('Connecting socket for chat group:', groupId);
        socket.connect();

        // Ensure we are in the correct room
        socket.emit('join_room', groupId);

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
            console.log('Cleaning up socket for group:', groupId);
            socket.emit('leave_room', groupId);
            socket.off('new_message', handleNewMessage);
        };
    }, [groupId]); // Depend directly on groupId for stability

    const fetchMessages = async () => {
        try {
            const data = await api.get(`/chats/${groupId}/messages`);
            if (Array.isArray(data)) {
                setMessages(data);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    const sendMessage = async (e?: React.FormEvent, contentOverride?: string) => {
        if (e) e.preventDefault();
        const content = contentOverride || newMessage;
        if (!content.trim() || isLoading) return;

        // Rate limiting: Prevent sending the exact same message twice within 1 second
        const now = Date.now();
        if (content === lastSentRef.current.content && now - lastSentRef.current.time < 1000) {
            console.log('Preventing double send of same message');
            return;
        }
        lastSentRef.current = { content, time: now };

        const tempMessage: Message = {
            message_id: `temp-${Date.now()}`,
            chat_id: chatId || groupId, // Fallback
            user_id: userId,
            content,
            send_time: new Date().toISOString()
        };

        // Optimistic update
        setMessages(prev => [...prev, tempMessage]);
        setNewMessage('');
        setIsLoading(true);

        try {
            const savedMessage = await api.post(`/chats/${groupId}/messages`, {
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
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Failed to send message');
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

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            await sendMessage(undefined, `![Image](${data.url})`);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload file');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const renderMessageContent = (content: string) => {
        const imageRegex = /!\[Image\]\((.*?)\)/;
        const match = content.match(imageRegex);

        if (match) {
            return (
                <div className="space-y-2">
                    <img
                        src={match[1]}
                        alt="Attachment"
                        className="max-w-full rounded-lg border border-white/10 max-h-60 object-cover"
                        loading="lazy"
                    />
                </div>
            );
        }
        return <p className="text-sm">{content}</p>;
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
                        <h3 className="font-bold text-white leading-tight">{title}</h3>
                        <p className="text-[10px] text-emerald-400 font-medium">Online</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                    {type === 'group' && role === 'admin' && (
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                            </button>
                            {showMenu && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <button
                                        onClick={() => {
                                            setShowMenu(false);
                                            setShowAddMember(true);
                                        }}
                                        className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                        </svg>
                                        Add Member
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-[length:400px] bg-opacity-[0.03] bg-blend-soft-light">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2 opacity-50">
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
                                className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-xl transition-transform hover:scale-[1.01] ${msg.user_id === userId
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-[#1e293b] text-slate-100 rounded-tl-none border border-white/5'
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
                        accept="image/*"
                    />
                    <button
                        type="button"
                        onClick={handleAttach}
                        disabled={isUploading}
                        className="p-2.5 text-slate-400 hover:text-white transition-all rounded-xl hover:bg-white/5 disabled:opacity-50"
                        title="Attach file"
                    >
                        {isUploading ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
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
                            className="w-full pl-4 pr-12 py-3 bg-[#0f172a] border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-slate-500 transition-all text-sm shadow-inner"
                        />
                        <button className="absolute right-3 text-2xl hover:scale-110 transition-transform">
                            😊
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !newMessage.trim()}
                        className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all shadow-lg ${!newMessage.trim() ? 'bg-slate-700 text-slate-500' : 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-105 active:scale-95 shadow-blue-600/20'}`}
                    >
                        <svg className="w-6 h-6 rotate-90 fill-current" viewBox="0 0 24 24">
                            <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" />
                        </svg>
                    </button>
                </form>
            </div>

            {showAddMember && (
                <AddMemberModal
                    groupId={groupId}
                    userId={userId}
                    onClose={() => setShowAddMember(false)}
                />
            )}
        </div>
    );
}

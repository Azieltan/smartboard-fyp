'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { socket } from '../lib/socket';

interface Message {
    message_id: string;
    chat_id: string;
    content: string;
    user_id: string;
    send_time: string;
}

interface ChatProps {
    groupId: string;
    userId: string;
}

export default function Chat({ groupId, userId }: ChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [chatId, setChatId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        if (!chatId) return;

        console.log('Connecting socket for chat:', chatId);
        socket.connect();
        socket.emit('join_room', chatId);

        const handleNewMessage = (msg: Message) => {
            console.log('Received socket message:', msg);
            setMessages(prev => {
                // Deduplicate based on ID
                if (prev.some(m => m.message_id === msg.message_id)) {
                    return prev;
                }
                return [...prev, msg];
            });
        };

        socket.on('new_message', handleNewMessage);

        return () => {
            console.log('Leaving chat:', chatId);
            socket.emit('leave_room', chatId);
            socket.off('new_message', handleNewMessage);
            // We don't necessarily disconnect socket if we might use it elsewhere, 
            // but for now let's keep it simple.
            // socket.disconnect(); 
        };
    }, [chatId]);

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

            // Replace temp message with real one
            setMessages(prev => prev.map(msg =>
                msg.message_id === tempMessage.message_id ? savedMessage : msg
            ));
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
        <div className="flex flex-col h-[500px] glass-panel overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-white/5">
                <h3 className="font-bold text-white">Group Chat</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.length === 0 ? (
                    <div className="text-center text-slate-500 mt-10">No messages yet. Say hello!</div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.message_id}
                            className={`flex ${msg.user_id === userId ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[70%] rounded-2xl px-4 py-2 ${msg.user_id === userId
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-white/10 text-white rounded-bl-none'
                                    }`}
                            >
                                {renderMessageContent(msg.content)}
                                <span className="text-[10px] opacity-60 mt-1 block text-right">
                                    {new Date(msg.send_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t border-white/10 bg-white/5">
                <div className="flex gap-2 items-center">
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
                        className="p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/10 disabled:opacity-50"
                        title="Attach file"
                    >
                        {isUploading ? '⏳' : '📎'}
                    </button>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 bg-black/20 border border-white/10 rounded-full focus:outline-none focus:border-blue-500 text-white placeholder-slate-500 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !newMessage.trim()}
                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ➤
                    </button>
                </div>
            </form>
        </div>
    );
}

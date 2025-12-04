'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface Message {
    message_id: string;
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

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000); // Poll every 3s
        return () => clearInterval(interval);
    }, [groupId]);

    const fetchMessages = async () => {
        const data = await api.get(`/chats/${groupId}/messages`);
        if (Array.isArray(data)) {
            setMessages(data);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        await api.post(`/chats/${groupId}/messages`, {
            userId,
            content: newMessage
        });
        setNewMessage('');
        fetchMessages();
    };

    return (
        <div className="flex flex-col h-[500px] border rounded-lg bg-white shadow-sm">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.message_id}
                        className={`flex ${msg.user_id === userId ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[70%] rounded-lg p-3 ${msg.user_id === userId
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                        >
                            <p>{msg.content}</p>
                            <span className="text-xs opacity-70 mt-1 block">
                                {new Date(msg.send_time).toLocaleTimeString()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            <form onSubmit={sendMessage} className="p-4 border-t">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
}

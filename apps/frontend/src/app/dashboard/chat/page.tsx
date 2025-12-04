'use client';

import { useState } from 'react';

// Mock Data (In real app, this comes from Backend/Home)
const MOCK_CHATS = [
    { id: '1', name: 'General Group', lastMessage: 'Hey everyone!', time: '10:30 AM', unread: 2, type: 'group' },
    { id: '2', name: 'Project Alpha', lastMessage: 'File uploaded.', time: 'Yesterday', unread: 0, type: 'group' },
    { id: '3', name: 'Alice Smith', lastMessage: 'Can we meet?', time: 'Mon', unread: 0, type: 'direct' },
];

const MOCK_MESSAGES = [
    { id: '1', sender: 'Alice', content: 'Hi there!', time: '10:00 AM', isMe: false },
    { id: '2', sender: 'Me', content: 'Hello! How is the project going?', time: '10:05 AM', isMe: true },
    { id: '3', sender: 'Alice', content: 'Going well, just finished the design.', time: '10:10 AM', isMe: false },
];

export default function ChatPage() {
    const [selectedChat, setSelectedChat] = useState(MOCK_CHATS[0]);
    const [messageInput, setMessageInput] = useState('');

    return (
        <div className="h-[calc(100vh-4rem)] flex gap-6">
            {/* Chat List */}
            <div className="w-80 flex flex-col glass-panel overflow-hidden">
                <div className="p-4 border-b border-white/10">
                    <h2 className="text-lg font-bold text-white">Messages</h2>
                    <div className="mt-2 relative">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {MOCK_CHATS.map((chat) => (
                        <button
                            key={chat.id}
                            onClick={() => setSelectedChat(chat)}
                            className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${selectedChat.id === chat.id ? 'bg-blue-600/20 border border-blue-500/50' : 'hover:bg-white/5 border border-transparent'
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${chat.type === 'group' ? 'bg-violet-500' : 'bg-pink-500'}`}>
                                {chat.name[0]}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                                <div className="flex justify-between items-baseline">
                                    <p className="text-sm font-medium text-white truncate">{chat.name}</p>
                                    <span className="text-xs text-slate-500">{chat.time}</span>
                                </div>
                                <p className="text-xs text-slate-400 truncate">{chat.lastMessage}</p>
                            </div>
                            {chat.unread > 0 && (
                                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
                                    {chat.unread}
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 glass-panel flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${selectedChat.type === 'group' ? 'bg-violet-500' : 'bg-pink-500'}`}>
                            {selectedChat.name[0]}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">{selectedChat.name}</h3>
                            <p className="text-xs text-slate-400">{selectedChat.type === 'group' ? '3 members' : 'Online'}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {/* Invite / Settings Buttons would go here */}
                        <button className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white">
                            ⚙️
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {MOCK_MESSAGES.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${msg.isMe
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white/10 text-slate-200 rounded-tl-none'
                                }`}>
                                {!msg.isMe && <p className="text-xs text-blue-300 mb-1 font-medium">{msg.sender}</p>}
                                <p className="text-sm">{msg.content}</p>
                                <p className={`text-[10px] mt-1 text-right ${msg.isMe ? 'text-blue-200' : 'text-slate-400'}`}>{msg.time}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/10 bg-black/20">
                    <div className="flex gap-3">
                        <button className="p-3 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                            📎
                        </button>
                        <input
                            type="text"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                        <button className="p-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20">
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

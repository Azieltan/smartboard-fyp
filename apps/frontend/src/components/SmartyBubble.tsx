"use client";
import { useState, useRef, useEffect } from 'react';
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import axios from 'axios';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function SmartyBubble() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Hi, I'm Smarty! Ask me anything about using SmartBoard." }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const chatInputRef = useRef<HTMLInputElement | null>(null);
    const bubbleRef = useRef<HTMLDivElement>(null);
    const [user, setUser] = useState<{ uid: string }>({ uid: '' });

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr && userStr !== 'undefined') {
            try {
                const u = JSON.parse(userStr);
                setUser({ uid: u.user_id });
            } catch (e) {
                console.error("Failed to parse user from localStorage", e);
            }
        }
    }, []);

    useEffect(() => {
        const handler = () => setIsOpen(true);
        window.addEventListener('open-smarty-bubble', handler);
        return () => window.removeEventListener('open-smarty-bubble', handler);
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (bubbleRef.current && !bubbleRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAsk = async () => {
        if (!chatInput.trim()) return;

        const userMessage = chatInput.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setChatInput('');
        setChatLoading(true);

        try {
            const res = await axios.post('https://n8n.h5preact.app/webhook/f66a2f4e-b415-4844-a6ef-e37c9eb072b9/chat', {
                action: 'sendMessage',
                sessionId: user.uid,
                chatInput: userMessage
            });

            let answer = "I didn't get a response.";
            if (typeof res.data === 'string') {
                answer = res.data;
            } else if (Array.isArray(res.data)) {
                answer = res.data.map((msg: any) => msg.text || JSON.stringify(msg)).join('\n');
            } else if (res.data.output) {
                answer = res.data.output;
            } else {
                answer = res.data.text || res.data.answer || JSON.stringify(res.data);
            }

            setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting to Smarty right now." }]);
        } finally {
            setChatLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100]" ref={bubbleRef}>
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-80 sm:w-96 h-[500px] bg-[#1e293b] rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-300">
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white flex justify-between items-center shrink-0 shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">🤖</div>
                            <div>
                                <h3 className="font-bold text-sm">Smarty AI</h3>
                                <p className="text-[10px] text-blue-100 opacity-80">Online & Ready to help</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full p-2 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0f172a]/50">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-md ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-[#1e293b] text-slate-100 rounded-tl-none border border-white/5'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {chatLoading && (
                            <div className="flex justify-start">
                                <div className="bg-[#1e293b] border border-white/5 p-3 rounded-2xl rounded-tl-none flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-150" />
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-300" />
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-[#1e293b] border-t border-white/5 shrink-0">
                        <div className="relative flex items-center gap-2">
                            <input
                                ref={chatInputRef}
                                type="text"
                                className="flex-1 px-4 py-2.5 bg-[#0f172a] border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-slate-500 transition-all"
                                placeholder="Ask Smarty..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                                disabled={chatLoading}
                            />
                            <button
                                onClick={handleAsk}
                                disabled={!chatInput.trim() || chatLoading}
                                className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20"
                            >
                                <svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-500 transform hover:scale-110 active:scale-95 ${isOpen ? 'bg-[#1e293b] rotate-90 text-white' : 'bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-600 text-white shadow-blue-600/30'}`}
            >
                {isOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                    <span className="text-2xl animate-pulse">🤖</span>
                )}
            </button>
        </div>
    );
}

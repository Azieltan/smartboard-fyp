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
    const [showMenu, setShowMenu] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Draggable states
    const [position, setPosition] = useState({ x: 20, y: 20 }); // Bottom-right offset
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const dx = dragStart.x - e.clientX;
            const dy = dragStart.y - e.clientY;

            setPosition(prev => ({
                x: prev.x + dx,
                y: prev.y + dy
            }));

            setDragStart({ x: e.clientX, y: e.clientY });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart]);

    const handleMouseDown = (e: ReactMouseEvent) => {
        // Prevent drag when clicking the chat window or close button
        if ((e.target as HTMLElement).closest('.no-drag')) return;

        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        e.preventDefault(); // Prevent text selection
    };

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

    const handleClearChat = () => {
        setMessages([{ role: 'assistant', content: "Chat cleared. How can I help you now?" }]);
        setShowMenu(false);
    };

    return (
        <div
            ref={bubbleRef}
            className={`fixed z-[100] transition-shadow ${isDragging ? 'cursor-grabbing' : 'cursor-default'}`}
            style={{ bottom: `${position.y}px`, right: `${position.x}px` }}
            onMouseDown={handleMouseDown}
        >
            {isOpen && (
                <div className={`absolute bottom-20 right-0 w-80 ${isExpanded ? 'sm:w-[500px] h-[700px]' : 'sm:w-96 h-[500px]'} bg-[#1e293b] dark:bg-slate-900 light:bg-white rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-300 no-drag cursor-default`}>
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white flex justify-between items-center shrink-0 shadow-lg cursor-grab active:cursor-grabbing" onMouseDown={handleMouseDown}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">🤖</div>
                            <div>
                                <h3 className="font-bold text-sm">Smarty AI</h3>
                                <p className="text-[10px] text-blue-100 opacity-80">Ready to help</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="relative">
                                <button onClick={() => setShowMenu(!showMenu)} className="hover:bg-white/20 rounded-full p-2 transition-colors no-drag">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                                </button>
                                {showMenu && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#1e293b] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 no-drag">
                                        <button onClick={() => { setIsExpanded(!isExpanded); setShowMenu(false); }} className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2">
                                            <span>{isExpanded ? 'Minimize' : 'Expand'}</span>
                                        </button>
                                        <button onClick={handleClearChat} className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                                            <span>Clear Chat</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full p-2 transition-colors no-drag">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0f172a]/50 dark:bg-slate-900/50 light:bg-slate-50 relative">
                        {/* Light Mode Warning for transparency */}
                        <div className="absolute inset-0 bg-[var(--background)] -z-10 opacity-90" />

                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300 relative`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-md ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-[#1e293b] light:bg-white dark:bg-slate-800 text-slate-100 light:text-slate-900 light:border-slate-200 rounded-tl-none border border-white/5'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {chatLoading && (
                            <div className="flex justify-start">
                                <div className="bg-[#1e293b] light:bg-white border border-white/5 light:border-slate-200 p-3 rounded-2xl rounded-tl-none flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-150" />
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-300" />
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-[#1e293b] dark:bg-slate-800 light:bg-white border-t border-white/5 light:border-slate-200 shrink-0">
                        <div className="relative flex items-center gap-2">
                            <input
                                ref={chatInputRef}
                                type="text"
                                className="flex-1 px-4 py-2.5 bg-[#0f172a] dark:bg-slate-900 light:bg-slate-100 border border-white/10 light:border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white light:text-slate-900 placeholder-slate-500 transition-all"
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
                onClick={() => !isDragging && setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer ${isOpen ? 'bg-[#1e293b] rotate-90 text-white' : 'bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-600 text-white shadow-blue-600/30'}`}
                title="Click to open Chat, Drag to move"
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

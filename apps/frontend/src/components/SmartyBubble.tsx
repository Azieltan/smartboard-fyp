"use client";
import { useState, useRef, useEffect, useCallback } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import axios from 'axios';
import { api } from '../lib/api';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function SmartyBubble() {
    // UI States
    const [showOptions, setShowOptions] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Chat state
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Hi, I'm Smarty! Ask me anything about using SmartBoard." }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);

    // Draggable states
    const [position, setPosition] = useState({ x: 20, y: 20 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Automation state
    const [isAutomateMode, setIsAutomateMode] = useState(false);
    const [pendingAutomation, setPendingAutomation] = useState<{
        automation_id: string;
        summary: string;
        payload: any;
    } | null>(null);

    // Refs
    const chatEndRef = useRef<HTMLDivElement>(null);
    const bubbleRef = useRef<HTMLDivElement>(null);
    const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastInteractionRef = useRef<number>(Date.now());
    const [user, setUser] = useState<{ uid: string }>({ uid: '' });

    // User setup
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

    // Auto-hide after 10 seconds of inactivity
    const resetHideTimer = useCallback(() => {
        lastInteractionRef.current = Date.now();
        setIsHidden(false);

        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
        }

        if (!showOptions && !showChat) {
            hideTimerRef.current = setTimeout(() => {
                const timeSinceInteraction = Date.now() - lastInteractionRef.current;
                if (timeSinceInteraction >= 10000) {
                    setIsHidden(true);
                }
            }, 10000);
        }
    }, [showOptions, showChat]);

    useEffect(() => {
        resetHideTimer();
        return () => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, [resetHideTimer]);

    // Event listener for opening bubble
    useEffect(() => {
        const handler = () => {
            setShowOptions(true);
            resetHideTimer();
        };
        window.addEventListener('open-smarty-bubble', handler);
        return () => window.removeEventListener('open-smarty-bubble', handler);
    }, [resetHideTimer]);

    // Chat scroll
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, showChat]);

    // Dragging handlers
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const dx = dragStart.x - e.clientX;
            const dy = dragStart.y - e.clientY;

            setPosition(prev => ({
                x: Math.max(0, prev.x + dx),
                y: Math.max(0, prev.y + dy)
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
        if ((e.target as HTMLElement).closest('.no-drag')) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        resetHideTimer();
        e.preventDefault();
    };

    const handleBubbleClick = () => {
        if (!isDragging) {
            resetHideTimer();
            setShowOptions(!showOptions);
            setShowChat(false);
        }
    };

    const handleAskSmarty = () => {
        setShowOptions(false);
        setShowChat(true);
        resetHideTimer();
    };

    const handleLetSmartyDo = () => {
        setIsAutomateMode(true);
        setShowOptions(false);
        setShowChat(true);
        setMessages([
            { role: 'assistant', content: "I'm ready to help you automate tasks! Just tell me what you want to do, like 'Create a task called Review Report' or 'Add Sarah to the Marketing group'." }
        ]);
        resetHideTimer();
    };

    const handleConfirm = async () => {
        if (!pendingAutomation) return;
        setChatLoading(true);
        try {
            const res = await api.post('/smarty/automate/confirm', {
                automation_id: pendingAutomation.automation_id
            });
            setMessages(prev => [...prev, { role: 'assistant', content: `✅ ${res.message || 'Done!'}` }]);
            setPendingAutomation(null);
        } catch (error: any) {
            console.error('Confirm error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${error.response?.data?.error || error.message || 'Failed to execute action'}` }]);
        } finally {
            setChatLoading(false);
        }
    };

    const handleAsk = async (manualQuestion?: string) => {
        const question = typeof manualQuestion === 'string' ? manualQuestion : chatInput;
        if (!question.trim()) return;

        const userMessage = question.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setChatInput('');
        setChatLoading(true);

        try {
            if (isAutomateMode) {
                const res = await api.post('/smarty/automate', {
                    rawText: userMessage,
                    context: { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }
                });

                if (res.needs_confirmation) {
                    setPendingAutomation({
                        automation_id: res.automation_id,
                        summary: res.summary,
                        payload: res.payload
                    });
                    setMessages(prev => [...prev, { role: 'assistant', content: res.summary }]);
                } else {
                    setMessages(prev => [...prev, { role: 'assistant', content: res.summary || "Action triggered successfully." }]);
                }
            } else {
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
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.message || "I'm having trouble connecting right now.";
            setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, ${errorMsg}` }]);
        } finally {
            setChatLoading(false);
        }
    };

    const handleClearChat = () => {
        setMessages([{ role: 'assistant', content: "Chat cleared. How can I help you now?" }]);
        setShowMenu(false);
    };

    const QUICK_QUESTIONS = [
        "What is SmartBoard?",
        "How do I upload files?",
        "How do I log out?"
    ];

    // Quick Question Scroll Logic
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isScrollDragging, setIsScrollDragging] = useState(false);
    const [scrollStartX, setScrollStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handleScrollMouseDown = (e: React.MouseEvent) => {
        if (!scrollContainerRef.current) return;
        setIsScrollDragging(true);
        setScrollStartX(e.pageX - scrollContainerRef.current.offsetLeft);
        setScrollLeft(scrollContainerRef.current.scrollLeft);
    };

    const handleScrollMouseUp = () => {
        setIsScrollDragging(false);
    };

    const handleScrollMouseLeave = () => {
        setIsScrollDragging(false);
    };

    const handleScrollMouseMove = (e: React.MouseEvent) => {
        if (!isScrollDragging || !scrollContainerRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - scrollStartX) * 2; // Scroll speed multiplier
        scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    };

    return (
        <div
            ref={bubbleRef}
            className={`fixed z-[100] transition-all duration-300 ${isDragging ? 'cursor-grabbing' : 'cursor-default'}`}
            style={{
                bottom: `${position.y}px`,
                right: `${position.x}px`,
                opacity: isHidden ? 0.3 : 1,
                transform: isHidden ? 'scale(0.8)' : 'scale(1)'
            }}
            onMouseDown={handleMouseDown}
            onMouseEnter={() => isHidden && setIsHidden(false)}
        >
            {/* Options Menu */}
            {showOptions && !showChat && (
                <div className="absolute bottom-16 right-0 w-56 bg-[#1e293b] rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-300 no-drag">
                    <button
                        onClick={handleAskSmarty}
                        className="w-full px-4 py-4 text-left text-sm hover:bg-white/10 flex items-center gap-3 transition-colors text-white group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            💬
                        </div>
                        <div>
                            <p className="font-semibold">Ask Smarty AI</p>
                            <p className="text-xs text-slate-400">Get help with SmartBoard</p>
                        </div>
                    </button>
                    <div className="h-px bg-white/10" />
                    <button
                        onClick={handleLetSmartyDo}
                        className="w-full px-4 py-4 text-left text-sm hover:bg-white/10 flex items-center gap-3 transition-colors text-white group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            🤖
                        </div>
                        <div>
                            <p className="font-semibold">Let Smarty Do</p>
                            <p className="text-xs text-slate-400">Automate tasks with AI</p>
                        </div>
                    </button>
                </div>
            )}

            {/* Chat Window */}
            {showChat && (
                <div className={`absolute bottom-16 right-0 w-80 ${isExpanded ? 'sm:w-[500px] h-[700px]' : 'sm:w-96 h-[500px]'} bg-[#1e293b] rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-300 no-drag cursor-default`}>
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white flex justify-between items-center shrink-0 shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">🤖</div>
                            <div>
                                <h3 className="font-bold text-sm">Smarty {isAutomateMode ? 'Orchestrator' : 'AI'}</h3>
                                <p className="text-[10px] text-blue-100 opacity-80">{isAutomateMode ? 'Ready to automate' : 'Ready to help'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="relative">
                                <button onClick={() => setShowMenu(!showMenu)} className="hover:bg-white/20 rounded-full p-2 transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                                </button>
                                {showMenu && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#1e293b] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1">
                                        <button onClick={() => { setIsExpanded(!isExpanded); setShowMenu(false); }} className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2">
                                            <span>{isExpanded ? 'Minimize' : 'Expand'}</span>
                                        </button>
                                        <button onClick={handleClearChat} className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                                            <span>Clear Chat</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button onClick={() => { setShowChat(false); setIsAutomateMode(false); }} className="hover:bg-white/20 rounded-full p-2 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0f172a]/50 relative">
                        <div className="absolute inset-0 bg-[var(--background)] -z-10 opacity-90" />
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300 relative`}>
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

                        {/* Confirmation Card */}
                        {pendingAutomation && (
                            <div className="mt-4 p-4 bg-white/5 border border-blue-500/30 rounded-2xl animate-in zoom-in-95 duration-200 shadow-xl">
                                <p className="text-xs text-blue-400 font-semibold mb-2 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                    Confirm Action
                                </p>
                                <p className="text-sm text-slate-200 mb-4 leading-relaxed italic">
                                    "{pendingAutomation.summary}"
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleConfirm}
                                        disabled={chatLoading}
                                        className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                                    >
                                        {chatLoading ? 'Executing...' : 'Confirm'}
                                    </button>
                                    <button
                                        onClick={() => setPendingAutomation(null)}
                                        disabled={chatLoading}
                                        className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-xl transition-all border border-white/5 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Questions */}
                    <div
                        ref={scrollContainerRef}
                        className="px-4 pb-2 bg-[#1e293b] shrink-0 overflow-x-auto no-scrollbar flex gap-2 border-t border-white/5 pt-2 cursor-grab active:cursor-grabbing no-drag"
                        onMouseDown={handleScrollMouseDown}
                        onMouseLeave={handleScrollMouseLeave}
                        onMouseUp={handleScrollMouseUp}
                        onMouseMove={handleScrollMouseMove}
                    >
                        {QUICK_QUESTIONS.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => setChatInput(q)}
                                className="whitespace-nowrap px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-slate-300 hover:text-white transition-colors flex-shrink-0"
                            >
                                {q}
                            </button>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="px-4 pb-4 pt-2 bg-[#1e293b] shrink-0">
                        <div className="relative flex items-center gap-2">
                            <input
                                type="text"
                                className="flex-1 px-4 py-2.5 bg-[#0f172a] border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-slate-500 transition-all"
                                placeholder={isAutomateMode ? "Tell Smarty what to do..." : "Ask Smarty..."}
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                                disabled={chatLoading}
                            />
                            <button
                                onClick={() => handleAsk()}
                                disabled={!chatInput.trim() || chatLoading}
                                className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20"
                            >
                                <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Bubble Button */}
            <button
                onClick={handleBubbleClick}
                className={`w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer ${showOptions || showChat ? 'bg-[#1e293b] rotate-90 text-white' : 'bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-600 text-white shadow-blue-600/30'}`}
                title="Click to open Smarty, Drag to move"
            >
                {showOptions || showChat ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                    <span className="text-2xl animate-pulse">🤖</span>
                )}
            </button>
        </div>
    );
}


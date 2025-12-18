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
    const [mode, setMode] = useState<'menu' | 'automate' | 'ask'>('menu');
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<string | null>(null); // For automate mode

    // Chat state
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Hi, I'm Smarty! Ask me anything about using SmartBoard." }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const [showTooltip, setShowTooltip] = useState(false);
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const bubbleRef = useRef<HTMLDivElement>(null);
    const dragOffset = useRef({ x: 0, y: 0 });
    const dragMovedRef = useRef(false);

    const [user, setUser] = useState<{ uid: string }>({ uid: '' });
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (mode === 'ask') {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, mode]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (bubbleRef.current && !bubbleRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // Optional: reset mode or keep state? Let's keep state for now so chat persists while open
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [bubbleRef]);

    useEffect(() => {
        if (!isDragging) return;

        function handlePointerMove(event: MouseEvent | TouchEvent) {
            if (!bubbleRef.current) return;
            const point = 'touches' in event ? event.touches[0] : event;
            const bubble = bubbleRef.current;
            const bubbleWidth = bubble.offsetWidth;
            const bubbleHeight = bubble.offsetHeight;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const minOffset = 16;
            const maxX = Math.max(minOffset, viewportWidth - bubbleWidth - minOffset);
            const maxY = Math.max(minOffset, viewportHeight - bubbleHeight - minOffset);
            const nextX = Math.min(
                Math.max(point.clientX - dragOffset.current.x, minOffset),
                maxX
            );
            const nextY = Math.min(
                Math.max(point.clientY - dragOffset.current.y, minOffset),
                maxY
            );
            event.preventDefault();
            dragMovedRef.current = true;
            setPosition({ x: nextX, y: nextY });
        }

        function handlePointerUp() {
            setIsDragging(false);
        }

        window.addEventListener('mousemove', handlePointerMove);
        const touchMoveOptions: AddEventListenerOptions = { passive: false };
        window.addEventListener('touchmove', handlePointerMove, touchMoveOptions);
        window.addEventListener('mouseup', handlePointerUp);
        window.addEventListener('touchend', handlePointerUp);

        return () => {
            window.removeEventListener('mousemove', handlePointerMove);
            window.removeEventListener('touchmove', handlePointerMove, touchMoveOptions);
            window.removeEventListener('mouseup', handlePointerUp);
            window.removeEventListener('touchend', handlePointerUp);
        };
    }, [isDragging]);

    const startDrag = (event: ReactMouseEvent<HTMLButtonElement> | ReactTouchEvent<HTMLButtonElement>) => {
        if (!bubbleRef.current) return;
        const point = 'touches' in event ? event.touches[0] : event;
        const rect = bubbleRef.current.getBoundingClientRect();
        dragOffset.current = { x: point.clientX - rect.left, y: point.clientY - rect.top };
        setPosition({ x: rect.left, y: rect.top });
        dragMovedRef.current = false;
        setIsDragging(true);
        event.preventDefault();
    };

    const handleToggle = () => {
        if (dragMovedRef.current) {
            dragMovedRef.current = false;
            return;
        }
        setIsOpen((prev) => !prev);
    };

    const handleAutomate = async () => {
        if (!input.trim()) return;
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/smarty/automate`, {
                userId: user.uid,
                prompt: input
            });
            setResponse(JSON.stringify(res.data, null, 2));
        } catch (error) {
            setResponse('Error: Failed to process request.');
        } finally {
            setLoading(false);
        }
    };

    const handleAsk = async () => {
        if (!chatInput.trim()) return;

        const userMessage = chatInput.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setChatInput('');
        setChatLoading(true);

        try {
            const res = await axios.post('https://n8n.trisilco.com/webhook/f66a2f4e-b415-4844-a6ef-e37c9eb072b9/chat', {
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
            } else if (res.data.text) {
                answer = res.data.text;
            } else if (res.data.answer) {
                answer = res.data.answer;
            } else {
                answer = JSON.stringify(res.data);
            }

            setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting to Smarty right now." }]);
        } finally {
            setChatLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAsk();
        }
    };

    // Audio Recording Logic
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await sendAudioToWebhook(audioBlob);

                // Stop all tracks to release microphone
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Please ensure you have granted permission.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const sendAudioToWebhook = async (audioBlob: Blob) => {
        setChatLoading(true); // Show loading while processing audio
        try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'recording.webm');
            // You can add other fields if needed, e.g., sessionId
            // formData.append('sessionId', user.uid);

            const res = await axios.post('https://n8n.trisilco.com/webhook/400bc043-ef5b-46a6-9edb-330d34df9502', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Assuming the webhook returns text in a field like 'text' or 'output'
            let transcribedText = '';
            if (res.data && res.data.text) {
                transcribedText = res.data.text;
            } else if (res.data && res.data.output) {
                transcribedText = res.data.output;
            } else if (typeof res.data === 'string') {
                transcribedText = res.data;
            } else {
                transcribedText = JSON.stringify(res.data);
            }

            if (transcribedText) {
                setChatInput(prev => prev ? `${prev} ${transcribedText}` : transcribedText);
            }
        } catch (error) {
            console.error('Error uploading audio:', error);
            // Optional: Show error in chat or toast
        } finally {
            setChatLoading(false);
        }
    };

    const bubbleStyle = position
        ? { left: position.x, top: position.y }
        : { right: '1.5rem', bottom: '1.5rem' };

    return (
        <div className="fixed z-50" ref={bubbleRef} style={bubbleStyle}>
            <div className="relative flex items-end justify-end">
                {/* Tooltip */}
                <div
                    className={`absolute right-0 bottom-[calc(100%+0.5rem)] bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg shadow-lg transition-opacity duration-200 ${showTooltip && !isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                >
                    Hi, I'm Smarty, your AI assistant.
                </div>

                {/* Popover Window */}
                {isOpen && (
                    <div className="absolute right-0 bottom-[calc(100%+1rem)] w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-200 font-sans">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="bg-white/20 p-1.5 rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" /><path d="m4.93 10.93 1.41 1.41" /><path d="M2 18h2" /><path d="M20 18h2" /><path d="m19.07 10.93-1.41 1.41" /><path d="M22 22H2" /><path d="m8 22 4-10 4 10" /></svg>
                                </div>
                                <h3 className="font-semibold">Smarty AI</h3>
                            </div>
                            <button onClick={() => { setIsOpen(false); setMode('menu'); }} className="hover:bg-white/20 rounded-full p-1 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <div className="h-96 flex flex-col bg-gray-50">
                            {mode === 'menu' && (
                                <div className="p-4 space-y-2 overflow-y-auto">
                                    <button
                                        onClick={() => setMode('automate')}
                                        className="w-full text-left p-3 bg-white hover:bg-indigo-50 border border-gray-100 hover:border-indigo-100 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-3 group"
                                    >
                                        <div className="bg-indigo-100 text-indigo-600 p-2.5 rounded-lg group-hover:scale-110 transition-transform">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4" /><path d="m16.2 7.8 2.9-2.9" /><path d="M18 12h4" /><path d="m16.2 16.2 2.9 2.9" /><path d="M12 18v4" /><path d="m7.8 16.2-2.9 2.9" /><path d="M6 12H2" /><path d="m7.8 7.8-2.9-2.9" /><circle cx="12" cy="12" r="3" /></svg>
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">Let Smarty Do</div>
                                            <div className="text-xs text-gray-500">Automate tasks & workflows</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setMode('ask')}
                                        className="w-full text-left p-3 bg-white hover:bg-purple-50 border border-gray-100 hover:border-purple-100 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-3 group"
                                    >
                                        <div className="bg-purple-100 text-purple-600 p-2.5 rounded-lg group-hover:scale-110 transition-transform">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">Ask Smarty</div>
                                            <div className="text-xs text-gray-500">Get answers & help</div>
                                        </div>
                                    </button>
                                </div>
                            )}

                            {mode === 'automate' && (
                                <div className="flex flex-col h-full p-4">
                                    <button onClick={() => { setMode('menu'); setResponse(null); }} className="text-xs text-gray-500 hover:text-gray-900 mb-3 flex items-center gap-1 self-start">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                        Back to Menu
                                    </button>
                                    <div className="flex-1 overflow-y-auto">
                                        <p className="text-sm text-gray-600 mb-3">Describe what you want to automate (e.g., "Add John to the Marketing group").</p>
                                        <textarea
                                            className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none text-gray-900 shadow-sm"
                                            rows={4}
                                            placeholder="Type your request here..."
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                        />
                                        {response && (
                                            <div className="mt-4 p-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 shadow-sm animate-in fade-in duration-300">
                                                <div className="flex items-center gap-2 mb-1 text-indigo-600 font-medium text-xs uppercase tracking-wide">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                                                    Result
                                                </div>
                                                <pre className="whitespace-pre-wrap font-sans text-gray-600">{response}</pre>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleAutomate}
                                        disabled={loading || !input.trim()}
                                        className="mt-3 w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                Run Automation
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7" /><path d="M12 19V5" /></svg>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {mode === 'ask' && (
                                <div className="flex flex-col h-full">
                                    <div className="p-3 border-b border-gray-100 bg-white flex items-center gap-2 shrink-0">
                                        <button onClick={() => setMode('menu')} className="text-gray-500 hover:text-gray-900 p-1 rounded-full hover:bg-gray-100 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                        </button>
                                        <span className="text-sm font-medium text-gray-700">Chat with Smarty</span>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                                        {messages.map((msg, idx) => (
                                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                                <div
                                                    className={`max-w-[85%] p-3.5 rounded-2xl text-sm shadow-sm leading-relaxed ${msg.role === 'user'
                                                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-none'
                                                        : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
                                                        }`}
                                                >
                                                    {msg.content}
                                                </div>
                                            </div>
                                        ))}
                                        {chatLoading && (
                                            <div className="flex justify-start animate-in fade-in duration-300">
                                                <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1.5">
                                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                                                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-150"></span>
                                                    <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce delay-300"></span>
                                                </div>
                                            </div>
                                        )}
                                        <div ref={chatEndRef} />
                                    </div>

                                    <div className="p-3 bg-white border-t border-gray-100 shrink-0">
                                        <div className="relative flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <input
                                                    type="text"
                                                    className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 placeholder-gray-400 transition-all"
                                                    placeholder="Ask a question..."
                                                    value={chatInput}
                                                    onChange={(e) => setChatInput(e.target.value)}
                                                    onKeyDown={handleKeyDown}
                                                    disabled={chatLoading}
                                                />
                                                <button
                                                    onClick={handleAsk}
                                                    disabled={!chatInput.trim() || chatLoading}
                                                    className="absolute right-1.5 top-1.5 p-1.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                                </button>
                                            </div>
                                            <button
                                                onMouseDown={startRecording}
                                                onMouseUp={stopRecording}
                                                onMouseLeave={stopRecording}
                                                onTouchStart={startRecording}
                                                onTouchEnd={stopRecording}
                                                className={`p-2.5 rounded-full transition-all ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                                title="Hold to record"
                                            >
                                                {isRecording ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Main Button */}
                <button
                    onMouseDown={startDrag}
                    onTouchStart={startDrag}
                    onClick={handleToggle}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${isOpen ? 'bg-gray-900 rotate-90' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:rotate-12'}`}
                >
                    {isOpen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" /><path d="m4.93 10.93 1.41 1.41" /><path d="M2 18h2" /><path d="M20 18h2" /><path d="m19.07 10.93-1.41 1.41" /><path d="M22 22H2" /><path d="m8 22 4-10 4 10" /></svg>
                    )}
                </button>
            </div>
        </div>
    );
}

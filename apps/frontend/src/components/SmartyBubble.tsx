"use client";
import { useState, useRef, useEffect } from 'react';
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
// import { useAuth } from '@/lib/auth'; // Assuming we have an auth hook
import axios from 'axios';

export function SmartyBubble() {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<'menu' | 'automate' | 'ask'>('menu');
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<string | null>(null);
    const [showTooltip, setShowTooltip] = useState(false);
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const bubbleRef = useRef<HTMLDivElement>(null);
    const dragOffset = useRef({ x: 0, y: 0 });
    const dragMovedRef = useRef(false);
    // const { user } = useAuth(); // Commented out until we confirm auth hook usage
    const user = { uid: 'test-user' }; // Mock user for now

    const API_URL = 'http://localhost:3001';

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (bubbleRef.current && !bubbleRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setMode('menu');
                setResponse(null);
                setInput('');
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
        if (!input.trim()) return;
        setLoading(true);
        try {
            const res = await axios.post('https://n8n.trisilco.com/webhook/f66a2f4e-b415-4844-a6ef-e37c9eb072b9/chat', {
                action: 'sendMessage',
                chatInput: input,
                sessionId: user.uid
            });
            setResponse(res.data.output || res.data.response || res.data.answer || JSON.stringify(res.data));
        } catch (error) {
            setResponse('Error: Failed to get answer.');
        } finally {
            setLoading(false);
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
                    <div className="absolute right-0 bottom-[calc(100%+1rem)] w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-200">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white flex justify-between items-center">
                        <h3 className="font-semibold">Smarty AI</h3>
                        <button onClick={() => { setIsOpen(false); setMode('menu'); }} className="hover:bg-white/20 rounded-full p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>

                    <div className="p-4 max-h-96 overflow-y-auto">
                        {mode === 'menu' && (
                            <div className="space-y-2">
                                <button
                                    onClick={() => setMode('automate')}
                                    className="w-full text-left p-3 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-3 group"
                                >
                                    <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg group-hover:bg-indigo-200 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4" /><path d="m16.2 7.8 2.9-2.9" /><path d="M18 12h4" /><path d="m16.2 16.2 2.9 2.9" /><path d="M12 18v4" /><path d="m7.8 16.2-2.9 2.9" /><path d="M6 12H2" /><path d="m7.8 7.8-2.9-2.9" /><circle cx="12" cy="12" r="3" /></svg>
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">Let Smarty Do</div>
                                        <div className="text-xs text-gray-500">Automate tasks with workflows</div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setMode('ask')}
                                    className="w-full text-left p-3 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-3 group"
                                >
                                    <div className="bg-purple-100 text-purple-600 p-2 rounded-lg group-hover:bg-purple-200 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">Ask Smarty</div>
                                        <div className="text-xs text-gray-500">Get answers from FAQs</div>
                                    </div>
                                </button>
                            </div>
                        )}

                        {mode === 'automate' && (
                            <div>
                                <button onClick={() => { setMode('menu'); setResponse(null); }} className="text-xs text-gray-500 hover:text-gray-900 mb-3 flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                    Back
                                </button>
                                <p className="text-sm text-gray-600 mb-3">Describe what you want to automate (e.g., "Add John to the Marketing group").</p>
                                <textarea
                                    className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none text-black"
                                    rows={3}
                                    placeholder="Type your request..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                />
                                <button
                                    onClick={handleAutomate}
                                    disabled={loading || !input.trim()}
                                    className="mt-3 w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? 'Processing...' : 'Run Automation'}
                                </button>
                            </div>
                        )}

                        {mode === 'ask' && (
                            <div>
                                <button onClick={() => { setMode('menu'); setResponse(null); }} className="text-xs text-gray-500 hover:text-gray-900 mb-3 flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                    Back
                                </button>
                                <p className="text-sm text-gray-600 mb-3">Ask a question about using the platform.</p>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {['How to add member?', 'How to create task?'].map(q => (
                                        <button
                                            key={q}
                                            onClick={() => setInput(q)}
                                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full transition-colors"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none text-black"
                                    rows={4}
                                    placeholder="Type your question..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                />
                                <button
                                    onClick={handleAsk}
                                    disabled={loading || !input.trim()}
                                    className="mt-3 w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? 'Thinking...' : 'Ask Question'}
                                </button>
                            </div>
                        )}

                        {response && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-800 animate-in fade-in duration-300">
                                <strong>Smarty:</strong>
                                <pre className="whitespace-pre-wrap mt-1 font-sans">{response}</pre>
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
                    className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${isOpen ? 'bg-red-500 rotate-45' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:rotate-12'}`}
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

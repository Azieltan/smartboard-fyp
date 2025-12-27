'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import CreateEventModal from '../../../components/CreateEventModal';

interface CalendarItem {
    id: string;
    title: string;
    start: string;
    end: string;
    type: 'event' | 'task';
    priority?: string;
}

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [items, setItems] = useState<CalendarItem[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>('');

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setUserId(user.user_id);
            fetchItems(user.user_id);
        }
    }, []);

    const fetchItems = async (uid: string) => {
        try {
            const data = await api.get(`/calendar/all/${uid}`);
            if (Array.isArray(data)) {
                setItems(data);
            }
        } catch (error) {
            console.error('Failed to fetch calendar items:', error);
        }
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentDate);
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleDateClick = (day: number) => {
        const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        setSelectedDate(dateStr);
        setShowEventModal(true);
    };

    const getItemsForDay = (day: number) => {
        const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        return items.filter(item => item.start.startsWith(dateStr));
    };

    if (!userId) return <div className="p-8 text-center text-slate-400">Please login to view calendar.</div>;

    return (
        <div className="h-full flex flex-col max-w-7xl mx-auto w-full p-6">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">Calendar</h1>
                    <p className="text-slate-400 mt-1">View your schedule and tasks.</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedDate(new Date().toISOString().split('T')[0]);
                        setShowEventModal(true);
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg shadow-lg shadow-purple-500/20 transition-colors"
                >
                    + Add Event
                </button>
            </header>

            <div className="flex-1 glass-panel flex flex-col overflow-hidden">
                {/* Calendar Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h2 className="text-xl font-bold text-white">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded text-white">←</button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 hover:bg-white/10 rounded text-sm text-slate-300">Today</button>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded text-white">→</button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 grid grid-cols-7 grid-rows-[auto_1fr] overflow-hidden">
                    {/* Weekday Headers */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="p-2 text-center text-sm font-semibold text-slate-400 border-b border-r border-white/5 last:border-r-0 bg-black/20">
                            {day}
                        </div>
                    ))}

                    {/* Days */}
                    <div className="col-span-7 grid grid-cols-7 auto-rows-fr overflow-y-auto">
                        {/* Empty cells for previous month */}
                        {Array.from({ length: firstDay }).map((_, i) => (
                            <div key={`empty-${i}`} className="p-2 border-b border-r border-white/5 bg-black/10"></div>
                        ))}

                        {/* Days of current month */}
                        {Array.from({ length: days }).map((_, i) => {
                            const day = i + 1;
                            const dayItems = getItemsForDay(day);
                            const isToday =
                                day === new Date().getDate() &&
                                currentDate.getMonth() === new Date().getMonth() &&
                                currentDate.getFullYear() === new Date().getFullYear();

                            return (
                                <div
                                    key={day}
                                    onClick={() => handleDateClick(day)}
                                    className={`min-h-[100px] p-2 border-b border-r border-white/5 hover:bg-white/5 transition-colors cursor-pointer relative group ${isToday ? 'bg-blue-900/10' : ''}`}
                                >
                                    <span className={`text-sm font-medium block mb-1 ${isToday ? 'text-blue-400' : 'text-slate-400'}`}>
                                        {day}
                                    </span>

                                    <div className="space-y-1">
                                        {dayItems.map(item => (
                                            <div
                                                key={item.id}
                                                className={`text-[10px] px-1.5 py-0.5 rounded truncate border ${item.type === 'task'
                                                        ? 'bg-blue-500/20 border-blue-500/30 text-blue-200'
                                                        : 'bg-purple-500/20 border-purple-500/30 text-purple-200'
                                                    }`}
                                                title={item.title}
                                            >
                                                {item.type === 'task' ? '✓ ' : '📅 '}{item.title}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add button on hover */}
                                    <button className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white text-xs p-1">
                                        +
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {showEventModal && (
                <CreateEventModal
                    userId={userId}
                    onClose={() => setShowEventModal(false)}
                    onEventCreated={() => fetchItems(userId)}
                    selectedDate={selectedDate}
                />
            )}
        </div>
    );
}

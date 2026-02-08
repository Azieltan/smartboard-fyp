'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import CreateEventModal from '../../../components/CreateEventModal';
import EventDetailModal from '../../../components/EventDetailModal';
import EditEventModal from '../../../components/EditEventModal';
import TaskDetailModal from '../../../components/TaskDetailModal';
import EditTaskModal from '../../../components/EditTaskModal';

interface CalendarItem {
    id: string;
    title: string;
    start: string;
    end: string;
    type: 'event' | 'task';
    priority?: string;
    description?: string;
    // ... other props from CalendarService
    [key: string]: any;
}

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [items, setItems] = useState<CalendarItem[]>([]);
    const [userId, setUserId] = useState<string | null>(null);

    // Modal States
    const [showCreateEventModal, setShowCreateEventModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>('');

    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [isEditingTask, setIsEditingTask] = useState(false);
    const [isEditingEvent, setIsEditingEvent] = useState(false);


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

    const handleItemClick = async (e: React.MouseEvent, item: CalendarItem) => {
        e.stopPropagation(); // Prevent date cell click
        if (item.type === 'task') {
            try {
                // Fetch full task details including subtasks
                const taskData = await api.get(`/tasks/${item.id}`);
                setSelectedTask(taskData);
            } catch (err) {
                console.error("Failed to fetch task details", err);
            }
        } else {
            // Events usually have enough info, but if we need more we could fetch.
            // For now, assuming item has description etc mapped from service.
            setSelectedEvent(item);
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
        setShowCreateEventModal(true);
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
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Calendar</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">View your schedule and tasks.</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedDate(new Date().toISOString().split('T')[0]);
                        setShowCreateEventModal(true);
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2"
                >
                    <span>+</span> Add Event
                </button>
            </header>

            <div className="flex-1 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col overflow-hidden shadow-xl">
                {/* Calendar Header */}
                <div className="p-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-600 dark:text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300">Today</button>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-600 dark:text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 grid grid-cols-7 grid-rows-[auto_1fr] overflow-hidden">
                    {/* Weekday Headers */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="p-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-r border-slate-200 dark:border-white/5 last:border-r-0 bg-slate-50/50 dark:bg-black/20">
                            {day}
                        </div>
                    ))}

                    {/* Days */}
                    <div className="col-span-7 grid grid-cols-7 auto-rows-fr overflow-y-auto custom-scrollbar bg-slate-50/30 dark:bg-transparent">
                        {/* Empty cells for previous month */}
                        {Array.from({ length: firstDay }).map((_, i) => (
                            <div key={`empty-${i}`} className="p-2 border-b border-r border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-black/10"></div>
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
                                    className={`min-h-[120px] p-2 border-b border-r border-slate-200 dark:border-white/5 hover:bg-blue-50 dark:hover:bg-white/5 transition-colors cursor-pointer relative group overflow-hidden ${isToday ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                >
                                    <span className={`text-sm font-medium block mb-2 w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {day}
                                    </span>

                                    {/* Scrollable container for multiple items */}
                                    <div className="space-y-1 max-h-[150px] overflow-y-auto overflow-x-hidden custom-scrollbar scrollbar-thin pr-0.5">
                                        {dayItems.map(item => (
                                            <div
                                                key={item.id}
                                                onClick={(e) => handleItemClick(e, item)}
                                                className={`text-[11px] px-2 py-1 rounded-md truncate border shadow-sm transition-all cursor-pointer flex items-center gap-1 font-medium ${item.type === 'task'
                                                    ? 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-blue-500/30 text-slate-700 dark:text-blue-200 hover:border-blue-400'
                                                    : 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-100 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-200 hover:border-indigo-400 hover:scale-105'
                                                    }`}
                                                title={item.title}
                                            >
                                                {item.type === 'task' ? (
                                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.priority === 'high' ? 'bg-red-500' : item.priority === 'low' ? 'bg-emerald-500' : 'bg-amber-500'
                                                        }`}></span>
                                                ) : <span className="flex-shrink-0">📅</span>}
                                                <span className="truncate">{item.type === 'task' ? item.title.replace('Task: ', '') : item.title}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add button on hover */}
                                    <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-slate-200 dark:bg-white/10 hover:bg-blue-500 hover:text-white rounded-md p-1 transition-all">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Create Event Modal */}
            {showCreateEventModal && (
                <CreateEventModal
                    userId={userId}
                    onClose={() => setShowCreateEventModal(false)}
                    onEventCreated={() => {
                        fetchItems(userId); // Refresh items
                        // We also need to close the modal, handled by state
                    }}
                    selectedDate={selectedDate}
                />
            )}



            {/* Event Detail Modal */}
            {selectedEvent && !isEditingEvent && (
                <EventDetailModal
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    onEdit={() => setIsEditingEvent(true)}
                />
            )}

            {/* Edit Event Modal */}
            {selectedEvent && isEditingEvent && (
                <EditEventModal
                    event={selectedEvent}
                    onClose={() => setIsEditingEvent(false)}
                    onEventUpdated={(updatedEvent) => {
                        setIsEditingEvent(false);
                        if (updatedEvent === null) {
                            setSelectedEvent(null);
                        } else if (updatedEvent) {
                            setSelectedEvent(updatedEvent);
                        }
                        fetchItems(userId!);
                    }}
                />
            )}

            {/* Task Detail Modal */}
            {selectedTask && !isEditingTask && (
                <TaskDetailModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={() => fetchItems(userId!)}
                    onEdit={selectedTask.created_by === userId || selectedTask.user_id === userId ? () => setIsEditingTask(true) : undefined}
                />
            )}

            {/* Edit Task Modal */}
            {selectedTask && isEditingTask && (
                <EditTaskModal
                    task={selectedTask}
                    userId={userId!}
                    onClose={() => setIsEditingTask(false)}
                    onTaskUpdated={(updatedTask) => {
                        setIsEditingTask(false);
                        if (updatedTask) setSelectedTask(updatedTask);
                        fetchItems(userId!);
                    }}
                />
            )}
        </div>
    );
}

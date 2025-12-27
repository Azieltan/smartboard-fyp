'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import CreateEventModal from './CreateEventModal';

interface CalendarItem {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'event' | 'task';
  priority?: string;
  isShared?: boolean;
  group_id?: string;
  owner_id?: string;
}

interface WeeklyCalendarWidgetProps {
  userId: string;
}

export default function WeeklyCalendarWidget({ userId }: WeeklyCalendarWidgetProps) {
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) fetchItems();
  }, [userId]);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const data = await api.get(`/calendar/${userId}/items`);
      if (Array.isArray(data)) {
        setItems(data);
      }
    } catch (e) {
      console.error("Failed to fetch calendar items", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate next 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();
  };

  const selectedItems = items.filter(item => {
    const itemDate = new Date(item.start);
    return isSameDay(itemDate, selectedDate);
  }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return (
    <div className="bg-[#1e293b] border border-white/10 rounded-2xl p-6 shadow-xl w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
            Weekly Schedule
          </h3>
          <p className="text-slate-400 text-sm ml-9">Select a day to view details</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Event
        </button>
      </div>

      {/* Days Strip */}
      <div className="grid grid-cols-7 gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
        {days.map((day, idx) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const hasItems = items.some(i => isSameDay(new Date(i.start), day));

          return (
            <button
              key={idx}
              onClick={() => setSelectedDate(day)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all relative group ${isSelected
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 scale-105'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:scale-105'
                }`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isSelected ? 'text-blue-100' : 'text-slate-500 group-hover:text-slate-300'}`}>
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className={`text-xl font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                {day.getDate()}
              </span>
              {isToday && (
                <span className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`} />
              )}
              {hasItems && !isSelected && (
                <div className="mt-1 flex gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                </div>
              )}
              {isSelected && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-white/20 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Items */}
      <div className="space-y-3 min-h-[200px]">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
          </div>
        ) : selectedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 border-2 border-dashed border-white/5 rounded-2xl bg-black/10">
            <div className="text-4xl mb-2 opacity-50">📅</div>
            <p className="text-sm font-medium">No events for {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}</p>
            <button onClick={() => setShowCreateModal(true)} className="text-blue-400 text-xs mt-2 hover:underline">Create one?</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {selectedItems.map(item => (
              <div key={item.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group flex items-start gap-4 hover:border-white/10 hover:shadow-lg">
                <div className={`w-1 h-12 rounded-full shrink-0 ${item.type === 'event' ? 'bg-blue-500' :
                  item.priority === 'high' ? 'bg-red-500' : 'bg-emerald-500'
                  }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                      {item.title.replace('Task: ', '')}
                    </h4>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${item.type === 'event' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {item.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-sm text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {new Date(item.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateEventModal
          userId={userId}
          onClose={() => setShowCreateModal(false)}
          onEventCreated={() => fetchItems()}
        />
      )}
    </div>
  );
}

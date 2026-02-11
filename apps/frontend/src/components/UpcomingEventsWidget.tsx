'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import CreateEventModal from './CreateEventModal';
import EventDetailModal from './EventDetailModal';
import EditEventModal from './EditEventModal';

interface CalendarEvent {
  event_id: string;
  title: string;
  start_time: string;
  end_time?: string;
  description?: string;
  type?: string;
}

interface UpcomingEventsWidgetProps {
  userId: string;
}

export function UpcomingEventsWidget({ userId }: UpcomingEventsWidgetProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEditingEvent, setIsEditingEvent] = useState(false); // Added isEditingEvent state

  const fetchEvents = async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    try {

      const data = await api.get(`/calendar/${userId}`);
      if (Array.isArray(data)) {
        const now = new Date();
        const upcoming = data
          .filter((e: CalendarEvent) => new Date(e.start_time) >= now)
          .sort((a: CalendarEvent, b: CalendarEvent) =>
            new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
          )
          .slice(0, 5);
        setEvents(upcoming);
      } else {
        console.warn("Calendar API returned non-array:", data);
        setEvents([]);
      }
    } catch (error: any) {
      if (error?.response?.status !== 500) {
        console.error('Failed to fetch events:', error);
      }
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [userId]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: date.getDate(),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (isLoading) {
    return (
      <div className="glass-panel p-6 animate-pulse">
        <div className="h-6 w-40 bg-white/10 rounded mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-white/5 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl p-6 bg-[#1e293b] border border-white/10 shadow-xl group h-[400px] flex flex-col">
      {/* Background Illustration */}
      <div className="absolute -right-6 -bottom-6 text-blue-500/5 transform rotate-12 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
        <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5v-5z" />
        </svg>
      </div>

      <div className="relative z-10 flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl">
            📅
          </div>
          <h2 className="text-lg font-bold text-white">Upcoming Events</h2>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <p className="text-4xl mb-2 opacity-30">📭</p>
          <p className="text-sm">No upcoming events</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const { month, day, time } = formatDate(event.start_time);
            return (
              <div
                key={event.event_id}
                onClick={() => setSelectedEvent(event)}
                className="flex items-center gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group cursor-pointer"
              >
                {/* Date Box */}
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex flex-col items-center justify-center text-white shadow-lg shrink-0">
                  <span className="text-[10px] font-bold opacity-80">{month}</span>
                  <span className="text-lg font-bold leading-tight">{day}</span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                    {event.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {time}
                  </p>
                </div>

                {/* Icon */}
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <CreateEventModal
          userId={userId}
          onClose={() => setShowCreateModal(false)}
          onEventCreated={() => {
            setShowCreateModal(false);
            fetchEvents();
          }}
        />
      )}

      {selectedEvent && !isEditingEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={() => setIsEditingEvent(true)} // Added onEdit prop to EventDetailModal
        />
      )}

      {selectedEvent && isEditingEvent && ( // Conditionally render EditEventModal
        <EditEventModal
          event={selectedEvent}
          onClose={() => setIsEditingEvent(false)}
          onEventUpdated={(updatedEvent) => {
            setIsEditingEvent(false);
            if (updatedEvent === null) {
              setSelectedEvent(null); // Event deleted
            } else if (updatedEvent) {
              setSelectedEvent(updatedEvent); // Event updated
            }
            fetchEvents();
          }}
        />
      )}
    </div>
  );
}

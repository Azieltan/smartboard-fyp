'use client';

import { useState, useEffect } from 'react';
import { UpcomingEventsWidget } from '../../components/UpcomingEventsWidget';
import { PendingTasksWidget } from '../../components/PendingTasksWidget';
import CalendarWidget from '../../components/CalendarWidget'; // Keeping import to avoid breaking if file exists but unused, actually I should remove it.
import WeeklyCalendarWidget from '../../components/WeeklyCalendarWidget';

export default function DashboardPage() {
    const [userId, setUserId] = useState<string>('');

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setUserId(user.user_id);
            } catch (e) {
                console.error("Failed to parse user", e);
            }
        }
    }, []);

    return (
        <div className="max-w-7xl mx-auto w-full p-8">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">Dashboard</h1>
                    <p className="text-[var(--text-secondary)] mt-1">Manage your schedule, events, and tasks.</p>
                </div>
            </header>

            {/* 2-Column Widget Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <UpcomingEventsWidget userId={userId} />
                <PendingTasksWidget userId={userId} />
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                <WeeklyCalendarWidget userId={userId} />
            </div>
        </div>
    );
}

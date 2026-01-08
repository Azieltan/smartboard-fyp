'use client';

import { useState, useEffect } from 'react';
import { UpcomingEventsWidget } from '../../components/UpcomingEventsWidget';
import { PendingTasksWidget } from '../../components/PendingTasksWidget';
import CalendarWidget from '../../components/CalendarWidget'; // Keeping import to avoid breaking if file exists but unused, actually I should remove it.
import WeeklyCalendarWidget from '../../components/WeeklyCalendarWidget';

export default function DashboardPage() {
    const [greeting, setGreeting] = useState('Welcome back');
    const [userName, setUserName] = useState('');
    const [userId, setUserId] = useState<string>('');

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setUserId(user.user_id);
                setUserName(user.user_name || 'Friend');

                // Set dynamic greeting
                const hour = new Date().getHours();
                if (hour < 12) setGreeting('Good Morning');
                else if (hour < 18) setGreeting('Good Afternoon');
                else setGreeting('Good Evening');

            } catch (e) {
                console.error("Failed to parse user", e);
            }
        }
    }, []);

    return (
        <div className="max-w-7xl mx-auto w-full p-8">
            <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-[#111827] dark:text-white tracking-tight">
                        {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{userName}</span>! 👋
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
                        Here's what's happening in your workspace today.
                    </p>
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

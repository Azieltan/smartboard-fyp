'use client';

import { useState, useEffect } from 'react';
import CalendarWidget from '../../components/CalendarWidget';

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
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">My Calendar</h1>
                    <p className="text-[var(--text-secondary)] mt-1">Manage your schedule and upcoming deadlines.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {/* Main Calendar Area - Full Width */}
                <div className="w-full space-y-6">
                    <CalendarWidget userId={userId} />
                </div>
            </div>
        </div>
    );
}

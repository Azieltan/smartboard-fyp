'use client';

import { useState, useEffect } from 'react';
import GroupList from '../../components/GroupList';
import GroupDetailView from '../../components/GroupDetailView';
import CalendarWidget from '../../components/CalendarWidget';
import FriendList from '../../components/FriendList';
import FAQWidget from '../../components/FAQWidget';

export default function DashboardPage() {
    const [selectedGroupId, setSelectedGroupId] = useState<string>('');
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Calendar Area */}
                <div className="lg:col-span-2 space-y-6">
                    <CalendarWidget userId={userId} />
                </div>

                {/* Side Widgets */}
                <div className="space-y-6">
                    {/* Groups First */}
                    <GroupList userId={userId} onSelectGroup={setSelectedGroupId} />

                    {/* Friends Second */}
                    <FriendList userId={userId} />

                    {/* FAQ Third (Replacing Upcoming Tasks) */}
                    <FAQWidget />
                </div>

                {/* Group Detail View - Full Width when selected */}
                {selectedGroupId && (
                    <div className="lg:col-span-3">
                        <GroupDetailView
                            groupId={selectedGroupId}
                            userId={userId}
                            onBack={() => setSelectedGroupId('')}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

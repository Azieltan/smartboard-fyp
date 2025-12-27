"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import GroupDetailView from '../../../components/GroupDetailView';
import GroupList from '../../../components/GroupList';

export default function GroupsPage() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr || userStr === 'undefined') {
            router.push('/login');
            return;
        }
        try {
            const user = JSON.parse(userStr);
            setUserId(user.user_id);
        } catch {
            router.push('/login');
        }
    }, [router]);

    if (!userId) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-white">Groups</h1>
                <p className="text-slate-400">Loading…</p>
            </div>
        );
    }

    if (selectedGroupId) {
        return (
            <GroupDetailView
                groupId={selectedGroupId}
                userId={userId}
                onBack={() => setSelectedGroupId(null)}
            />
        );
    }

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-white">Groups</h1>
                <p className="text-slate-400 mt-1">Create, join, and manage your groups.</p>
            </header>

            <GroupList userId={userId} onSelectGroup={setSelectedGroupId} />
        </div>
    );
}

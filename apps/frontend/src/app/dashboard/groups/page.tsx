"use client";

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import GroupDetailView from '../../../components/GroupDetailView';
import GroupList from '../../../components/GroupList';

function GroupsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [userId, setUserId] = useState<string | null>(null);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [initialTab, setInitialTab] = useState<'chat' | 'members' | 'tasks'>('chat');
    const [userRole, setUserRole] = useState<string>('member');

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr || userStr === 'undefined') {
            router.push('/login');
            return;
        }
        try {
            const user = JSON.parse(userStr);
            setUserId(user.user_id);
            setUserRole(user.role || 'member');
        } catch {
            router.push('/login');
        }
    }, [router]);

    // Handle URL params
    useEffect(() => {
        // Guard against null searchParams
        if (!searchParams) return;
        const groupId = searchParams.get('groupId');
        const tab = searchParams.get('tab');
        if (groupId) {
            setSelectedGroupId(groupId);
            if (tab && ['chat', 'members', 'tasks'].includes(tab)) {
                setInitialTab(tab as any);
            } else {
                setInitialTab('chat');
            }
        }
    }, [searchParams]);

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
                key={`${selectedGroupId}-${initialTab}`}
                groupId={selectedGroupId}
                userId={userId}
                userRole={userRole}
                initialTab={initialTab}
                onBack={() => {
                    setSelectedGroupId(null);
                    setInitialTab('chat');
                    router.push('/dashboard/groups');
                }}
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

export default function GroupsPage() {
    return (
        <Suspense fallback={<div>Loading Groups...</div>}>
            <GroupsContent />
        </Suspense>
    );
}

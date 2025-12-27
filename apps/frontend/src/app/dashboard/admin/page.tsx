'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function AdminPage() {
    const router = useRouter();

    useEffect(() => {
        const run = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                // Owner-only endpoint; if it works, send them to the canonical admin page.
                await api.get('/admin/overview');
                router.push('/admin');
            } catch {
                router.push('/dashboard');
            }
        };

        run();
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="space-y-6 text-center">
                <h1 className="text-3xl font-bold text-white">Redirecting…</h1>
                <p className="text-slate-400">Opening the admin page.</p>
            </div>
        </div>
    );
}

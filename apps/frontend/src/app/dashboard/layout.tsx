'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sidebar } from '../../components/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-[#0f172a] relative overflow-hidden">
            {/* Background mesh gradient */}
            <div className="fixed inset-0 bg-mesh-gradient opacity-20 pointer-events-none" />

            {/* Decorative blobs */}
            <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-0 left-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

            <Sidebar />

            <main className="flex-1 relative flex flex-col h-screen overflow-y-auto custom-scrollbar">
                {children}
            </main>
        </div>
    );
}

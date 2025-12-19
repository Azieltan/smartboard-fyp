import { Sidebar } from '@/components/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-[#0f172a] relative">
            {/* Background mesh gradient */}
            <div className="fixed inset-0 bg-mesh-gradient opacity-50 pointer-events-none" />

            {/* Decorative blobs */}
            <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-0 left-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

            <Sidebar />
            <main className="flex-1 overflow-auto relative">
                <div className="max-w-7xl mx-auto p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

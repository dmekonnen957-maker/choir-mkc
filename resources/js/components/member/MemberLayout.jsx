import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import MemberSidebar from './MemberSidebar';
import MemberHeader from './MemberHeader';

export default function MemberLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen overflow-x-hidden bg-surface text-ink-800">
            <MemberSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex min-w-0 flex-1 flex-col">
                <MemberHeader onMenu={() => setSidebarOpen(true)} />
                <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
                    <div className="mx-auto w-full max-w-6xl animate-fade-in">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

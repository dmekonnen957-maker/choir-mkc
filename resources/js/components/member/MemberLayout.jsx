import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import MemberSidebar from './MemberSidebar';
import MemberHeader from './MemberHeader';
import { useTheme } from '../../context/ThemeContext';

export default function MemberLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { isDarkMode } = useTheme();

    useEffect(() => {
        document.body.classList.toggle('member-dark-mode', isDarkMode);
        return () => document.body.classList.remove('member-dark-mode');
    }, [isDarkMode]);

    return (
        <div className={`member-shell flex h-screen overflow-hidden bg-[#f5f8fc] text-slate-800 font-sans antialiased transition-colors duration-300 ${isDarkMode ? 'member-dark' : ''}`}>
            <MemberSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <MemberHeader onMenu={() => setSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">
                    <div className="mx-auto w-full max-w-7xl">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

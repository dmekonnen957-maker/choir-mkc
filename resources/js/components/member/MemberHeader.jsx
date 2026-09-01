import { NavLink } from 'react-router-dom';
import { Menu, Bell, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChoir } from '../../context/ChoirContext';

const ROLE_LABELS = {
    member: 'Member',
    team_leader: 'Team Leader',
    admin: 'Admin',
};

const BASE_PATHS = {
    member: '/member',
    team_leader: '/team-leader',
    admin: '/admin',
    'super-admin': '/admin',
};

export default function MemberHeader({ title, onMenu }) {
    const { user, role } = useAuth();
    const { currentChoir, isAllChoirs } = useChoir();

    const basePath = BASE_PATHS[role] ?? '/member';
    const settingsPath = `${basePath}/settings`;

    const initials = (user?.name ?? '?')
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const choirDisplayName = isAllChoirs
        ? 'All Choirs'
        : currentChoir?.name ?? 'No Choir';

    const choirSubtitle = isAllChoirs
        ? 'Global Overview'
        : currentChoir?.choir_type ?? ROLE_LABELS[role] ?? 'Member';

    return (
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-3.5 backdrop-blur-md lg:px-8 shadow-xs">
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenu}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-colors lg:hidden active:scale-95"
                    aria-label="Open navigation"
                >
                    <Menu size={20} />
                </button>
                {title && (
                    <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
                )}
            </div>

            <div className="flex items-center gap-3">
                <button
                    className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-xs hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    aria-label="Notifications"
                    title="Notifications"
                >
                    <Bell size={18} />
                </button>

                <NavLink
                    to={settingsPath}
                    className={({ isActive }) =>
                        `relative rounded-xl border p-2 text-slate-600 shadow-xs transition-colors ${
                            isActive
                                ? 'border-blue-200 bg-blue-50 text-blue-700 font-bold'
                                : 'border-slate-200 bg-white hover:bg-slate-50 hover:text-blue-600'
                        }`
                    }
                    aria-label="Settings"
                    title="Settings"
                >
                    <Settings size={18} />
                </NavLink>

                {/* Choir identity pill badge in header */}
                <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-xs">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black bg-blue-50 text-blue-700 border border-blue-100">
                        {initials}
                    </span>
                    <div className="hidden leading-tight sm:block min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{choirDisplayName}</p>
                        <p className="text-[10px] text-slate-500 truncate">{choirSubtitle}</p>
                    </div>
                </div>
            </div>
        </header>
    );
}

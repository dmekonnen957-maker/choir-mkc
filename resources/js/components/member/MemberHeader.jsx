import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ROLE_LABELS = {
    member: 'Member',
    team_leader: 'Team Leader',
    admin: 'Admin',
};

export default function MemberHeader({ title, onMenu }) {
    const { user, role, primaryChoir } = useAuth();
    const initials = (user?.name ?? '?')
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-blue-100 bg-canvas/90 px-4 py-3 backdrop-blur lg:px-8">
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenu}
                    className="rounded-lg p-1.5 text-ink-600 hover:bg-blue-50 lg:hidden"
                    aria-label="Open menu"
                >
                    <Menu size={22} />
                </button>
                {title && (
                    <h1 className="text-lg font-semibold text-ink-900">{title}</h1>
                )}
            </div>

            <div className="flex items-center gap-3">
                <button
                    className="relative rounded-full p-2 text-ink-500 hover:bg-blue-50 hover:text-blue-700"
                    aria-label="Notifications"
                >
                    <Bell size={20} />
                </button>
                <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-surface px-3 py-1.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                        {initials}
                    </span>
                    <div className="hidden leading-tight sm:block">
                        <p className="text-sm font-semibold text-ink-900">{user?.name}</p>
                        <p className="text-xs text-ink-500">
                            {ROLE_LABELS[role] ?? 'Member'}
                            {primaryChoir ? ` · ${primaryChoir.name}` : ''}
                        </p>
                    </div>
                </div>
            </div>
        </header>
    );
}

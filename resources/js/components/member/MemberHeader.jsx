import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChoir } from '../../context/ChoirContext';
import { useTheme } from '../../context/ThemeContext';

const ROLE_LABELS = {
    member: 'Member',
    team_leader: 'Team Leader',
    admin: 'Admin',
};

export default function MemberHeader({ title, onMenu }) {
    const { user, role } = useAuth();
    const { currentChoir, isAllChoirs } = useChoir();
    const { theme } = useTheme();

    const initials = (user?.name ?? '?')
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const avatarStyle = {
        backgroundColor: `${theme.primary}20`,
        color: theme.primary,
        borderColor: `${theme.primary}4D`,
    };

    const choirDisplayName = isAllChoirs
        ? 'All Choirs'
        : currentChoir?.name ?? 'No Choir';

    const choirSubtitle = isAllChoirs
        ? 'Global Overview'
        : currentChoir?.choir_type ?? ROLE_LABELS[role] ?? 'Member';

    return (
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--theme-border)] bg-canvas/90 px-4 py-3 backdrop-blur lg:px-8">
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenu}
                    className="rounded-lg p-1.5 text-ink-600 hover:bg-[var(--theme-primary)]/10 lg:hidden"
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
                    className="relative rounded-full p-2 text-ink-500 hover:bg-[var(--theme-primary)]/10 hover:text-[var(--theme-primary)]"
                    aria-label="Notifications"
                >
                    <Bell size={20} />
                </button>

                {/* Choir identity in header */}
                <div className="flex items-center gap-3 rounded-xl border border-[var(--theme-border)] bg-surface px-3 py-1.5">
                    <span
                        className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold"
                        style={avatarStyle}
                    >
                        {initials}
                    </span>
                    <div className="hidden leading-tight sm:block">
                        <p className="text-sm font-semibold text-ink-900">{choirDisplayName}</p>
                        <p className="text-xs text-ink-500">{choirSubtitle}</p>
                    </div>
                </div>
            </div>
        </header>
    );
}

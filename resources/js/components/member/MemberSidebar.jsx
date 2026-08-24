import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Music,
    Mic2,
    CalendarClock,
    CalendarDays,
    Calendar,
    CheckCircle2,
    ListMusic,
    Bell,
    User,
    Settings,
    LogOut,
    X,
    Church,
    UserCheck,
    Shield,
    Key,
    BarChart3,
    History,
    ScrollText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ROLE_LABELS = {
    member: 'Member',
    team_leader: 'Team Leader',
    admin: 'Admin',
};

const BASE_PATHS = {
    member: '/member',
    team_leader: '/team-leader',
    admin: '/admin',
};

// Full admin navigation (matches the Admin design spec).
function getAdminNav(can) {
    const items = [
        { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
    ];

    const orgItems = [{ label: 'Choirs', to: '/admin/choirs', icon: Church }];
    if (can('members.view')) {
        orgItems.push({ label: 'Members', to: '/admin/members', icon: Users });
    }
    items.push({ title: 'Organization', items: orgItems });

    items.push({
        title: 'Content',
        items: [
            { label: 'Songs', to: '/admin/songs', icon: Music },
            { label: 'Lyrics', to: '/admin/lyrics', icon: Mic2 },
        ],
    });

    items.push({
        title: 'Schedule',
        items: [
            { label: 'Performances', to: '/admin/performances', icon: CalendarDays },
            { label: 'Rehearsals', to: '/admin/rehearsals', icon: CalendarClock },
            { label: 'Calendar', to: '/admin/calendar', icon: Calendar },
        ],
    });

    items.push({
        title: 'Attendance',
        items: [
            { label: 'Attendance', to: '/admin/attendance', icon: CheckCircle2 },
            { label: 'Performance Attendance', to: '/admin/performance-attendance', icon: ListMusic },
        ],
    });

    const userMgmt = [];
    if (can('users.view')) {
        userMgmt.push({ label: 'Users', to: '/admin/users', icon: UserCheck });
    }
    if (can('roles.view')) {
        userMgmt.push({ label: 'Roles', to: '/admin/roles', icon: Shield });
    }
    if (can('permissions.view')) {
        userMgmt.push({ label: 'Permissions', to: '/admin/permissions', icon: Key });
    }
    items.push({ title: 'User Management', items: userMgmt });

    items.push({
        title: 'Communication',
        items: [{ label: 'Notifications', to: '/admin/notifications', icon: Bell }],
    });

    items.push({
        title: 'Reports',
        items: [
            { label: 'Reports', to: '/admin/reports', icon: BarChart3 },
            { label: 'Choir History', to: '/admin/choir-history', icon: History },
        ],
    });

    items.push({
        title: 'System',
        items: [
            { label: 'Settings', to: '/admin/settings', icon: Settings },
            { label: 'Activity Logs', to: '/admin/activity-logs', icon: ScrollText },
        ],
    });

    return items;
}

// Member / Team Leader navigation (own area only — never gets admin pages).
function getMemberNav(basePath) {
    return [
        { label: 'Dashboard', to: `${basePath}/dashboard`, icon: LayoutDashboard },
        {
            title: 'My Choir',
            items: [{ label: 'My Choir', to: `${basePath}/choir`, icon: Users }],
        },
        {
            title: 'Music',
            items: [
                { label: 'Songs', to: `${basePath}/songs`, icon: Music },
                { label: 'Lyrics', to: `${basePath}/lyrics`, icon: Mic2 },
            ],
        },
        {
            title: 'Schedule',
            items: [
                { label: 'Rehearsals', to: `${basePath}/rehearsals`, icon: CalendarClock },
                { label: 'Performances', to: `${basePath}/performances`, icon: CalendarDays },
                { label: 'Calendar', to: `${basePath}/calendar`, icon: Calendar },
            ],
        },
        {
            title: 'My Participation',
            items: [
                { label: 'My Attendance', to: `${basePath}/attendance`, icon: CheckCircle2 },
                { label: 'My Performances', to: `${basePath}/my-performances`, icon: ListMusic },
            ],
        },
        { label: 'Notifications', to: `${basePath}/notifications`, icon: Bell },
        {
            title: 'Account',
            items: [
                { label: 'My Profile', to: `${basePath}/profile`, icon: User },
                { label: 'Settings', to: `${basePath}/settings`, icon: Settings },
            ],
        },
    ];
}

function getNav(basePath, role, can) {
    if (role === 'admin' || role === 'super-admin') {
        return getAdminNav(can);
    }
    return getMemberNav(basePath);
}

function NavItem({ item, onNavigate }) {
    return (
        <NavLink
            to={item.to}
            end={item.label === 'Dashboard'}
            onClick={onNavigate}
            className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                    isActive
                        ? 'border-white/25 bg-white/15 text-white shadow-sm'
                        : 'border-transparent text-white/80 hover:bg-white/10 hover:text-white'
                }`
            }
        >
            {item.icon && <item.icon size={18} className="shrink-0" />}
            <span className="truncate">{item.label}</span>
        </NavLink>
    );
}

export default function MemberSidebar({ open, onClose }) {
    const { user, role, primaryChoir, logout, can } = useAuth();

    const basePath = BASE_PATHS[role] ?? '/member';
    const NAV = getNav(basePath, role, can);
    const isAdmin = role === 'admin' || role === 'super-admin';
    const subtitle = isAdmin ? 'Administration' : (primaryChoir?.name ?? 'No choir assigned');

    const initials = (user?.name ?? '?')
        .split(' ')
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const roleLabel = ROLE_LABELS[role] ?? 'Member';

    return (
        <>
            {/* Mobile backdrop */}
            {open && (
                <div
                    className="fixed inset-0 z-30 bg-black/25 lg:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[80vw] flex-col border-r border-white/20 shadow-2xl backdrop-blur-2xl transition-transform duration-300 ease-out lg:static lg:max-w-none lg:translate-x-0 lg:rounded-none lg:shadow-2xl ${
                    open ? 'translate-x-0' : '-translate-x-full'
                } bg-[rgba(20,40,80,0.55)] lg:bg-gradient-to-b lg:from-blue-600/50 lg:to-blue-900/65`}
            >
                {/* Brand + close */}
                <div className="flex items-center justify-between gap-2 px-5 py-5">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/25">
                            <Church size={20} />
                        </span>
                        <div className="min-w-0 leading-tight">
                            <p className="text-sm font-bold tracking-wide text-white">CHOIR MKC</p>
                            <p className="truncate text-xs text-white/70">
                                {subtitle}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white lg:hidden"
                        aria-label="Close menu"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* User info */}
                <div className="mx-3 mb-2 flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-semibold text-white ring-1 ring-white/25">
                        {initials}
                    </span>
                    <div className="min-w-0 leading-tight">
                        <p className="truncate text-sm font-semibold text-white">
                            {user?.name ?? 'Member'}
                        </p>
                        <p className="truncate text-xs text-white/60">{roleLabel}</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-2">
                    {NAV.map((section) =>
                        section.title ? (
                            <div key={section.title}>
                                <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">
                                    {section.title}
                                </p>
                                <div className="space-y-1">
                                    {section.items.map((item) => (
                                        <NavItem key={item.label} item={item} onNavigate={onClose} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <NavItem key={section.label} item={section} onNavigate={onClose} />
                        )
                    )}
                </nav>

                {/* Logout */}
                <div className="border-t border-white/15 p-3">
                    <button
                        onClick={logout}
                        className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                    >
                        <LogOut size={18} className="shrink-0" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

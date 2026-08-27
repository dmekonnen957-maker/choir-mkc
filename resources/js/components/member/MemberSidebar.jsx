import { NavLink } from 'react-router-dom';
import Logo from '../Logo';
import {
    LayoutDashboard,
    Users,
    Music,
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
    ScrollText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ROLE_LABELS = {
    member: 'Member',
    team_leader: 'Team Leader',
    admin: 'Administrator',
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
            ...(can('songs.view') ? [{ label: 'Songs', to: '/admin/songs', icon: Music }] : []),
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
    if (can('roles.view') || can('permissions.view')) {
        userMgmt.push({ label: 'Roles & Permissions', to: '/admin/roles', icon: Shield });
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

// Member / Team Leader navigation
function getMemberNav(basePath, role, can) {
    const isLeader = role === 'team_leader';

    return [
        { label: 'Dashboard', to: `${basePath}/dashboard`, icon: LayoutDashboard },
        {
            title: 'My Choir',
            items: [
                { label: 'My Choir', to: `${basePath}/choir`, icon: Users },
                ...(isLeader ? [{ label: 'Attendance', to: `${basePath}/attendance`, icon: CheckCircle2 }] : []),
            ],
        },
        {
            title: 'Music',
            items: [
                { label: 'Songs', to: `${basePath}/songs`, icon: Music },
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
            title: isLeader ? 'Ministry' : 'My Participation',
            items: [
                ...(isLeader
                    ? []
                    : [{ label: 'My Attendance', to: `${basePath}/attendance`, icon: CheckCircle2 }]),
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
    return getMemberNav(basePath, role, can);
}

function NavItem({ item, onNavigate }) {
    return (
        <NavLink
            to={item.to}
            end={item.label === 'Dashboard'}
            onClick={onNavigate}
            className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${isActive
                    ? 'border-blue-500/30 bg-gradient-to-r from-blue-600/30 to-indigo-600/20 text-white shadow-lg shadow-blue-500/10 backdrop-blur-md'
                    : 'border-transparent text-slate-300 hover:border-slate-800 hover:bg-slate-800/50 hover:text-white'
                }`
            }
        >
            {({ isActive }) => (
                <>
                    {item.icon && (
                        <item.icon
                            size={18}
                            className={`shrink-0 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-300'
                                }`}
                        />
                    )}
                    <span className="truncate">{item.label}</span>
                </>
            )}
        </NavLink>
    );
}

export default function MemberSidebar({ open, onClose }) {
    const { user, role, primaryChoir, logout, can } = useAuth();

    const basePath = BASE_PATHS[role] ?? '/member';
    const NAV = getNav(basePath, role, can);
    const isAdmin = role === 'admin' || role === 'super-admin';
    const subtitle = isAdmin ? 'Administration Portal' : (primaryChoir?.name ?? 'Worship Ministry');

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
                    className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-slate-800/80 bg-slate-950 shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:h-full lg:max-w-none lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Brand Logo & Title */}
                <div className="flex items-center justify-between gap-3 px-6 py-6 border-b border-slate-800/60">
                    <div className="flex min-w-0 items-center gap-3">
                        <Logo size="sm" className="shrink-0" />
                        <div className="min-w-0 leading-tight hidden lg:block">
                            <p className="text-sm font-black tracking-wide text-white">CHOIR MKC</p>
                            <p className="truncate text-xs font-medium text-slate-400">
                                {isAdmin ? 'EKA MKC Choirs and Worship Teams' : subtitle}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white lg:hidden"
                        aria-label="Close menu"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* User Profile Summary */}
                <div className="mx-4 my-4 flex items-center gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3 shadow-inner">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/20 text-sm font-bold text-blue-400 ring-1 ring-blue-500/30">
                        {initials}
                    </span>
                    <div className="min-w-0 leading-tight">
                        <p className="truncate text-sm font-bold text-slate-100">
                            {user?.name ?? 'Member'}
                        </p>
                        <span className="inline-block truncate text-xs font-medium text-slate-400">
                            {roleLabel}
                        </span>
                    </div>
                </div>

                {/* Navigation Sections */}
                <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-2 scrollbar-thin scrollbar-thumb-slate-800">
                    {NAV.map((section) =>
                        section.title ? (
                            <div key={section.title} className="space-y-1">
                                <p className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
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

                {/* Footer Action / Logout */}
                <div className="border-t border-slate-800/80 p-4">
                    <button
                        onClick={logout}
                        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm font-bold text-slate-300 transition-all duration-200 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                    >
                        <LogOut size={18} className="shrink-0" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
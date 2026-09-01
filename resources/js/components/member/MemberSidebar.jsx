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
    BarChart3,
    History,
    ScrollText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChoir } from '../../context/ChoirContext';
import ChoirSelector from './ChoirSelector';

const BASE_PATHS = {
    member: '/member',
    team_leader: '/team-leader',
    admin: '/admin',
};

// Full admin navigation
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
                    ? 'border-[var(--theme-primary)]/30 bg-gradient-to-r from-[var(--theme-primary)]/30 to-[var(--theme-primary-dark)]/20 text-white shadow-lg shadow-[var(--theme-primary)]/10 backdrop-blur-md'
                    : 'border-transparent text-slate-300 hover:border-slate-800 hover:bg-slate-800/50 hover:text-white'
                }`
            }
        >
            {({ isActive }) => (
                <>
                    {item.icon && (
                        <item.icon
                            size={18}
                            className={`shrink-0 transition-colors ${isActive ? 'text-[var(--theme-primary-light)]' : 'text-slate-400 group-hover:text-[var(--theme-primary-light)]'
                                }`}
                        />
                    )}
                    <span className="truncate">{item.label}</span>
                </>
            )}
        </NavLink>
    );
}

/**
 * Choir Identity Block shown at top of sidebar for all roles.
 * Admin sees it BELOW the ChoirSelector.
 * Members/TL see it as the primary identity element.
 */
function ChoirIdentityBlock({ choir, isAllChoirs }) {
    if (isAllChoirs) {
        return (
            <div className="mx-4 mb-4 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3 shadow-inner">
                <div className="flex items-center gap-2.5">
                    <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: '#2563eb22', border: '1px solid #2563eb44' }}
                    >
                        <Church size={16} style={{ color: '#3b82f6' }} />
                    </div>
                    <div className="min-w-0 leading-tight">
                        <p className="truncate text-sm font-bold text-slate-100">All Choirs</p>
                        <p className="truncate text-xs text-slate-400">Global Overview</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!choir) {
        return (
            <div className="mx-4 mb-4 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3 shadow-inner">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800">
                        <Church size={16} className="text-slate-500" />
                    </div>
                    <div className="min-w-0 leading-tight">
                        <p className="truncate text-sm font-bold text-slate-400">No Choir</p>
                        <p className="truncate text-xs text-slate-500">Not assigned</p>
                    </div>
                </div>
            </div>
        );
    }

    const primaryColor = choir.uniform_primary_color || 'var(--theme-primary)';
    const secondaryColor = choir.uniform_secondary_color;

    return (
        <div className="mx-4 mb-4 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3 shadow-inner">
            <div className="flex items-center gap-2.5">
                {/* Color swatch / logo */}
                {choir.logo_path ? (
                    <img
                        src={choir.logo_path}
                        alt={choir.name}
                        className="h-9 w-9 shrink-0 rounded-lg object-cover"
                    />
                ) : (
                    <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        style={{
                            backgroundColor: `${primaryColor}22`,
                            border: `1px solid ${primaryColor}44`,
                        }}
                    >
                        <Church size={16} style={{ color: primaryColor }} />
                    </div>
                )}
                <div className="min-w-0 leading-tight">
                    <p className="truncate text-sm font-bold text-slate-100">{choir.name}</p>
                    {choir.choir_type && (
                        <p className="truncate text-xs text-slate-400">{choir.choir_type}</p>
                    )}
                </div>
            </div>
            {/* Color swatches */}
            {(primaryColor || secondaryColor) && (
                <div className="mt-2 flex items-center gap-1.5 pl-0.5">
                    {primaryColor && (
                        <span
                            className="inline-block h-3 w-3 rounded-full border border-slate-600"
                            style={{ backgroundColor: primaryColor }}
                            title={`Primary: ${primaryColor}`}
                        />
                    )}
                    {secondaryColor && (
                        <span
                            className="inline-block h-3 w-3 rounded-full border border-slate-600"
                            style={{ backgroundColor: secondaryColor }}
                            title={`Secondary: ${secondaryColor}`}
                        />
                    )}
                    {choir.uniform_pattern && (
                        <span className="ml-1 truncate text-xs text-slate-500">{choir.uniform_pattern}</span>
                    )}
                </div>
            )}
        </div>
    );
}

export default function MemberSidebar({ open, onClose }) {
    const { user, role, logout, can } = useAuth();
    const { currentChoir, isAllChoirs } = useChoir();

    const isAdmin = role === 'admin' || role === 'super-admin';
    const basePath = BASE_PATHS[role] ?? '/member';
    const NAV = getNav(basePath, role, can);

    // User initials for the bottom user card
    const initials = (user?.name ?? '?')
        .split(' ')
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();

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
                                EKA MKC Choirs &amp; Worship Teams
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

                {/* Admin: Choir Selector then identity block */}
                {isAdmin ? (
                    <div className="pt-4">
                        <ChoirSelector />
                        <ChoirIdentityBlock choir={currentChoir} isAllChoirs={isAllChoirs} />
                    </div>
                ) : (
                    /* Member / Team Leader: Choir Identity block as primary */
                    <div className="pt-4">
                        <ChoirIdentityBlock choir={currentChoir} isAllChoirs={false} />
                    </div>
                )}

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

                {/* Bottom: user identity + logout */}
                <div className="border-t border-slate-800/80 p-4 space-y-3">
                    {/* User mini-card */}
                    <div className="flex items-center gap-2.5 px-1">
                        <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                            style={{
                                backgroundColor: 'var(--theme-primary)22',
                                color: 'var(--theme-primary)',
                                border: '1px solid var(--theme-primary)44',
                            }}
                        >
                            {initials}
                        </span>
                        <div className="min-w-0 leading-tight">
                            <p className="truncate text-xs font-semibold text-slate-200">{user?.name ?? 'Member'}</p>
                            <p className="truncate text-[10px] text-slate-500">{user?.email ?? ''}</p>
                        </div>
                    </div>

                    {/* Logout */}
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
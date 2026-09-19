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
    LogOut,
    X,
    Church,
    UserCheck,
    Shield,
    BarChart3,
    ScrollText,
    BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChoir } from '../../context/ChoirContext';
import { useLanguage } from '../../context/LanguageContext';
import ChoirSelector from './ChoirSelector';

const BASE_PATHS = {
    member: '/member',
    team_leader: '/team-leader',
    admin: '/admin',
    musician: '/musician',
};

// Full admin navigation
function getAdminNav(can, t) {
    const items = [
        { label: t('nav.dashboard', 'Dashboard'), to: '/admin/dashboard', icon: LayoutDashboard },
    ];

    const orgItems = [{ label: t('nav.choirs', 'Choirs'), to: '/admin/choirs', icon: Church }];
    if (can('members.view')) {
        orgItems.push({ label: t('nav.members', 'Members'), to: '/admin/members', icon: Users });
    }
    items.push({ title: t('nav.section.organization', 'Organization'), items: orgItems });

    items.push({
        title: t('nav.section.content', 'Content'),
        items: [
            ...(can('songs.view') ? [{ label: t('nav.songs', 'Songs'), to: '/admin/songs', icon: Music }] : []),
        ],
    });

    items.push({
        title: t('nav.section.schedule', 'Schedule'),
        items: [
            { label: t('nav.performances', 'Performances'), to: '/admin/performances', icon: CalendarDays },
            { label: t('nav.rehearsals', 'Rehearsals'), to: '/admin/rehearsals', icon: CalendarClock },
            { label: t('nav.calendar', 'Calendar'), to: '/admin/calendar', icon: Calendar },
        ],
    });

    items.push({
        title: t('nav.attendance', 'Attendance'),
        items: [
            { label: t('nav.attendance', 'Attendance'), to: '/admin/attendance', icon: CheckCircle2 },
        ],
    });

    const userMgmt = [];
    if (can('users.view')) {
        userMgmt.push({ label: t('nav.users', 'Users'), to: '/admin/users', icon: UserCheck });
    }
    if (can('roles.view') || can('permissions.view')) {
        userMgmt.push({ label: t('nav.roles_permissions', 'Roles & Permissions'), to: '/admin/roles', icon: Shield });
    }
    items.push({ title: t('nav.section.user_management', 'User Management'), items: userMgmt });

    items.push({
        title: t('nav.section.reports', 'Reports'),
        items: [
            { label: t('nav.reports', 'Reports'), to: '/admin/reports', icon: BarChart3 },
            { label: t('nav.choir_history', 'Choir History'), to: '/admin/choir-history', icon: BookOpen },
        ],
    });

    items.push({
        title: t('nav.section.system', 'System'),
        items: [
            { label: t('nav.activity_logs', 'Activity Logs'), to: '/admin/activity-logs', icon: ScrollText },
        ],
    });

    return items;
}

// Member / Team Leader navigation
function getMemberNav(basePath, area, can, t) {
    const isLeader = area === 'team_leader';

    return [
        { label: t('nav.dashboard', 'Dashboard'), to: `${basePath}/dashboard`, icon: LayoutDashboard },
        {
            title: t('nav.section.my_choir', 'My Choir'),
            items: [
                { label: t('nav.my_choir', 'My Choir'), to: `${basePath}/choir`, icon: Users },
                ...(isLeader ? [{ label: t('nav.attendance', 'Attendance'), to: `${basePath}/attendance`, icon: CheckCircle2 }] : []),
            ],
        },
        {
            title: t('nav.section.music', 'Music'),
            items: [
                { label: t('nav.songs', 'Songs'), to: `${basePath}/songs`, icon: Music },
            ],
        },
        {
            title: t('nav.section.schedule', 'Schedule'),
            items: [
                { label: t('nav.rehearsals', 'Rehearsals'), to: `${basePath}/rehearsals`, icon: CalendarClock },
                { label: t('nav.performances', 'Performances'), to: `${basePath}/performances`, icon: CalendarDays },
                { label: t('nav.calendar', 'Calendar'), to: `${basePath}/calendar`, icon: Calendar },
            ],
        },
        {
            title: isLeader ? t('nav.section.ministry', 'Ministry') : t('nav.section.my_participation', 'My Participation'),
            items: [
                ...(isLeader
                    ? []
                    : [{ label: t('nav.my_attendance', 'My Attendance'), to: `${basePath}/attendance`, icon: CheckCircle2 }]),
                { label: t('nav.my_performances', 'My Performances'), to: `${basePath}/my-performances`, icon: ListMusic },
                { label: t('nav.choir_history', 'Choir History'), to: `${basePath}/choir-history`, icon: BookOpen },
            ],
        },
        {
            title: t('nav.section.account', 'Account'),
            items: [
                { label: t('nav.my_profile', 'My Profile'), to: `${basePath}/profile`, icon: User },
            ],
        },
    ];
}

function getNav(basePath, area, can, t) {
    if (area === 'admin') {
        return getAdminNav(can, t);
    }
    return getMemberNav(basePath, area, can, t);
}

function NavItem({ item, onNavigate }) {
    return (
        <NavLink
            to={item.to}
            end={item.to.endsWith('/dashboard')}
            onClick={onNavigate}
            className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    isActive
                        ? 'border-blue-500/40 bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'border-transparent text-slate-300 hover:bg-slate-800/70 hover:text-white hover:translate-x-0.5'
                }`
            }
        >
            {({ isActive }) => (
                <>
                    {item.icon && (
                        <item.icon
                            size={18}
                            className={`shrink-0 transition-all duration-200 ${
                                isActive
                                    ? 'text-white scale-105'
                                    : 'text-slate-400 group-hover:text-blue-400'
                            }`}
                        />
                    )}
                    <span className="truncate">{item.label}</span>
                </>
            )}
        </NavLink>
    );
}

function ChoirIdentityBlock({ choir, isAllChoirs, t }) {
    if (isAllChoirs) {
        return (
            <div className="mx-4 mb-3 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3 shadow-inner">
                <div className="flex items-center gap-2.5">
                    <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: '#2563eb22', border: '1px solid #2563eb44' }}
                    >
                        <Church size={16} style={{ color: '#3b82f6' }} />
                    </div>
                    <div className="min-w-0 leading-tight">
                        <p className="truncate text-sm font-bold text-slate-100">
                            {t ? t('header.all_choirs', 'All Choirs') : 'All Choirs'}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                            {t ? t('header.global_overview', 'Global Overview') : 'Global Overview'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!choir) {
        return (
            <div className="mx-4 mb-3 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3 shadow-inner">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800">
                        <Church size={16} className="text-slate-500" />
                    </div>
                    <div className="min-w-0 leading-tight">
                        <p className="truncate text-sm font-bold text-slate-400">
                            {t ? t('header.no_choir', 'No Choir') : 'No Choir'}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                            {t ? t('header.not_assigned', 'Not assigned') : 'Not assigned'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const primaryColor = choir.uniform_primary_color || 'var(--theme-primary)';

    return (
        <div className="mx-4 mb-3 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3 shadow-inner">
            <div className="flex items-center gap-2.5">
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
        </div>
    );
}

export default function MemberSidebar({ open, onClose }) {
    const { user, area, logout, can } = useAuth();
    const { currentChoir, isAllChoirs } = useChoir();
    const { t } = useLanguage();

    const isAdmin = area === 'admin';
    const basePath = BASE_PATHS[area] ?? '/member';
    const NAV = getNav(basePath, area, can, t);

    const initials = (user?.name ?? '?')
        .split(' ')
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const renderSidebarContent = (isMobile = false) => (
        <div className="flex h-full w-full flex-col bg-[#0b132b]">
            {/* 1. Header: Branding & Close button */}
            <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-slate-800/80 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <Logo size="sm" className="shrink-0" />
                    <div className="min-w-0 leading-tight">
                        <p className="text-sm font-black tracking-wider text-white">YEKA M.K.C CHOIR</p>
                        <p className="truncate text-[11px] font-medium text-slate-400">
                            YEKA M.K.C Choirs &amp; Worship Teams
                        </p>
                    </div>
                </div>
                {isMobile && (
                    <button
                        onClick={onClose}
                        className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                        aria-label={t('header.close_nav', 'Close navigation')}
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* 2. Choir Selector & Identity Block */}
            <div className="pt-3 shrink-0">
                {isAdmin ? (
                    <ChoirSelector />
                ) : (
                    <ChoirIdentityBlock choir={currentChoir} isAllChoirs={false} t={t} />
                )}
            </div>

            {/* 3. Navigation Sections (Scrollable Area) */}
            <nav className="flex-1 space-y-5 overflow-y-auto px-4 py-2 scrollbar-thin scrollbar-thumb-slate-800">
                {NAV.map((section) =>
                    section.title ? (
                        <div key={section.title} className="space-y-1">
                            <p className="px-3 pb-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
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

            {/* 4. Administrator Profile & Sign Out (Fixed at bottom) */}
            <div className="border-t border-slate-800/80 p-4 space-y-3 bg-[#0b132b]/95 shrink-0">
                <div className="flex items-center gap-3 px-1">
                    <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold bg-blue-600/20 text-blue-400 border border-blue-500/30"
                    >
                        {initials}
                    </span>
                    <div className="min-w-0 leading-tight">
                        <p className="truncate text-xs font-bold text-slate-100">{user?.name ?? 'Administrator'}</p>
                        <p className="truncate text-[10px] text-slate-400">{user?.email ?? ''}</p>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-xs font-bold text-slate-300 transition-all duration-200 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400 active:scale-95"
                >
                    <LogOut size={16} className="shrink-0" />
                    <span>{t('nav.sign_out', 'Sign Out')}</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Fixed Sidebar (w-72 = 288px) */}
            <aside className="hidden lg:flex lg:w-72 lg:shrink-0 lg:flex-col lg:h-screen lg:border-r lg:border-slate-800/80">
                {renderSidebarContent(false)}
            </aside>

            {/* Mobile Slide-Over Drawer */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
                    open ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {renderSidebarContent(true)}
            </aside>
        </>
    );
}
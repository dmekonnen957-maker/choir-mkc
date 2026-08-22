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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV = [
    { label: 'Dashboard', to: '/member/dashboard', icon: LayoutDashboard },
    {
        title: 'My Choir',
        items: [
            { label: 'My Choir', to: '/member/choir', icon: Users },
            { label: 'Choir Members', to: '/member/choir', icon: Users },
        ],
    },
    {
        title: 'Music',
        items: [
            { label: 'Songs', to: '/member/songs', icon: Music },
            { label: 'Lyrics', to: '/member/lyrics', icon: Mic2 },
        ],
    },
    {
        title: 'Schedule',
        items: [
            { label: 'Rehearsals', to: '/member/rehearsals', icon: CalendarClock },
            { label: 'Performances', to: '/member/performances', icon: CalendarDays },
            { label: 'Calendar', to: '/member/calendar', icon: Calendar },
        ],
    },
    {
        title: 'My Participation',
        items: [
            { label: 'My Attendance', to: '/member/attendance', icon: CheckCircle2 },
            { label: 'My Performances', to: '/member/my-performances', icon: ListMusic },
        ],
    },
    { label: 'Notifications', to: '/member/notifications', icon: Bell },
    {
        title: 'Account',
        items: [
            { label: 'My Profile', to: '/member/profile', icon: User },
            { label: 'Settings', to: '/member/settings', icon: Settings },
        ],
    },
];

function NavItem({ item, isActive, onNavigate }) {
    return (
        <NavLink
            to={item.to}
            end={item.to === '/member/dashboard'}
            onClick={onNavigate}
            className={({ isActive: active }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    active
                        ? 'bg-white/12 text-white rounded-xl'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`
            }
        >
            {item.icon && <item.icon size={18} />}
            <span>{item.label}</span>
        </NavLink>
    );
}

export default function MemberSidebar({ open, onClose }) {
    const { user, role, primaryChoir, logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    const initials = (user?.name ?? '?')
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <>
            {/* Mobile overlay */}
            {open && (
                <div
                    className="fixed inset-0 z-30 bg-black/28"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Mobile hamburger (only on small screens via CSS, but we add behavior here) */}
            {open && (
                <div
                    className="fixed inset-y-0 left-0 z-40 flex w-16 flex-shrink-0 items-center justify-center pointer-events-none"
                >
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="relative rounded-full bg-white/10 p-2"
                        aria-label="Open sidebar"
                    >
                        <X size={24} className="text-white" />
                    </button>
                </div>
            )}

            {/* Mobile drawer (over the content) */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 flex min-h-screen flex-col pointer-events-none"
                    onClick={onClose}
                >
                    <div
                        className="flex-shrink-0 w-16 bg-white/10 border-y border-white/14 border-t-0"
                    >
                        <Church size={18} className="flex h-6 w-6 items-center justify-center rounded-xl bg-blue-600 text-white m-3" />
                    </div>
                    <nav className="flex-1 px-3 py-3 space-y-2">
                        {NAV.map((section, idx) =>
                            section.title ? (
                                <div key={section.title}>
                                    <p className="text-xs uppercase tracking-wider text-white/50 mb-1">
                                        {section.title}
                                    </p>
                                    <div className="space-y-1">
                                        {section.items.map((item) => (
                                            <NavItem
                                                key={item.label}
                                                item={item}
                                                isActive={item.to === '/member/dashboard'}
                                                onNavigate={() => {
                                                    setMobileOpen(false);
                                                    // navigate would be handled by router; in real app use navigate()
                                                    // For this static implementation, just close
                                                }
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <NavItem
                                    key={section.label}
                                    item={section}
                                    isActive={false}
                                    onNavigate={() => setMobileOpen(false)}
                                />
                        )}
                    </nav>
                    <div className="pt-3 pb-2 border-t border-white/12">
                        <button
                            onClick={logout}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-white/60 transition hover:bg-white/5"
                        >
                            <LogOut size={16} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col transition-transform duration-300 lg:translate-x-0 lg:relative lg:block lg:max-w-none lg:bg-transparent lg:border-0 lg:shadow-none lg:w-auto lg:flex-shrink-0 ${
                    open ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex items-center justify-between px-4 py-4 border-b border-white/14">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                            <Church size={20} />
                        </span>
                        <div className="text-lg font-bold text-white">
                            <p className=" truncate">CHOIR MKC</p>
                            <p className="text-xs text-white/60">
                                {primaryChoir?.name ?? 'No choir assigned'}
                            </p>
                        </div>
                    </div>

                    {/* User info */}
                    <div className="hidden lg:block">
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white">
                                {initials}
                            </span>
                            <div>
                                <p className="font-medium text-white">{user?.name ?? 'Member'}</p>
                                <p className="text-xs text-white/50">{role?.replace('member', 'Member') ?? 'Member'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="lg:hidden rounded-lg p-1.5 text-white/70 hover:bg-white/10"
                        aria-label="Open sidebar"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Mobile toggle trigger on desktop */}
                <button
                    onClick={() => setMobileOpen(true)}
                    className="lg:hidden rounded-lg p-1.5 text-white/70 hover:bg-white/10 mb-3"
                    aria-label="Open sidebar"
                >
                    <X size={22} />
                </button>
            </aside>

            {/* Mobile drawer backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/28"
                />
            )}
        </>
    );
}
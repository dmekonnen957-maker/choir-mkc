import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import {
    Menu,
    Bell,
    Settings,
    CheckCheck,
    Calendar,
    Music2,
    CalendarClock,
    Info,
    X,
    ExternalLink,
} from 'lucide-react';
import { api } from '../../axios';
import { useAuth } from '../../context/AuthContext';
import { useChoir } from '../../context/ChoirContext';

const ROLE_LABELS = {
    member: 'Member',
    team_leader: 'Team Leader',
    admin: 'Admin',
    'super-admin': 'Super Admin',
};

const BASE_PATHS = {
    member: '/member',
    team_leader: '/team-leader',
    admin: '/admin',
    'super-admin': '/admin',
};

function formatTimeAgo(dateStr) {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffSec = Math.floor((now - date) / 1000);
        if (diffSec < 60) return 'Just now';
        const diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) return `${diffMin}m ago`;
        const diffHours = Math.floor(diffMin / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
        return '';
    }
}

export default function MemberHeader({ title, onMenu }) {
    const { user, role } = useAuth();
    const { currentChoir, isAllChoirs } = useChoir();

    const basePath = BASE_PATHS[role] ?? '/member';
    const settingsPath = `${basePath}/settings`;

    // Notification dropdown state
    const [openNotifications, setOpenNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingNotifs, setLoadingNotifs] = useState(false);
    const dropdownRef = useRef(null);

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

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        try {
            const res = await api.get('/notifications');
            const data = res.data?.data || {};
            const items = data.notifications || data.items || [];
            setNotifications(Array.isArray(items) ? items : []);
            setUnreadCount(typeof data.unread_count === 'number' ? data.unread_count : items.filter((n) => !n.read_at).length);
        } catch {
            // Fallback to member/notifications if needed
            try {
                const res = await api.get('/member/notifications');
                const data = res.data?.data || {};
                const items = data.notifications || [];
                setNotifications(Array.isArray(items) ? items : []);
                setUnreadCount(typeof data.unread_count === 'number' ? data.unread_count : 0);
            } catch {
                // Ignore background notification fetch errors
            }
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        // Optional polling interval every 60s
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Close notification panel on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenNotifications(false);
            }
        }
        if (openNotifications) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openNotifications]);

    const markSingleAsRead = async (notification) => {
        if (!notification.read_at) {
            try {
                await api.post(`/notifications/${notification.id}/read`);
                setNotifications((prev) =>
                    prev.map((n) => (n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            } catch {
                // fallback
            }
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/notifications/mark-all-read');
            setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
            setUnreadCount(0);
        } catch {
            // fallback
        }
    };

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
                {/* 🔔 Notifications Button & Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => {
                            setOpenNotifications(!openNotifications);
                            if (!openNotifications) fetchNotifications();
                        }}
                        className={`relative rounded-xl border p-2 shadow-xs transition-colors ${
                            openNotifications
                                ? 'border-blue-300 bg-blue-50 text-blue-600'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                        }`}
                        aria-label="Notifications"
                        title="Notifications"
                    >
                        <Bell size={18} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white shadow-sm ring-2 ring-white animate-pulse">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown Panel */}
                    {openNotifications && (
                        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden ring-1 ring-slate-900/5 animate-in fade-in slide-in-from-top-2 duration-150">
                            {/* Panel Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                                            {unreadCount} new
                                        </span>
                                    )}
                                </div>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                        <CheckCheck size={14} />
                                        Mark all as read
                                    </button>
                                )}
                            </div>

                            {/* Notifications List */}
                            <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                                {notifications.length === 0 ? (
                                    <div className="py-12 px-4 text-center text-slate-400">
                                        <Bell size={32} className="mx-auto mb-2 text-slate-300 opacity-60" />
                                        <p className="text-xs font-bold text-slate-600">No notifications</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">You're all caught up with choir updates.</p>
                                    </div>
                                ) : (
                                    notifications.map((n) => {
                                        const isUnread = !n.read_at;
                                        const title = n.data?.title || n.data?.message || n.type || 'Choir Notification';
                                        const body = n.data?.body || (n.data?.title ? n.data?.message : null);

                                        return (
                                            <div
                                                key={n.id}
                                                onClick={() => markSingleAsRead(n)}
                                                className={`flex items-start gap-3 p-3.5 transition-colors cursor-pointer ${
                                                    isUnread
                                                        ? 'bg-blue-50/50 hover:bg-blue-50/80'
                                                        : 'hover:bg-slate-50'
                                                }`}
                                            >
                                                <div
                                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                                        isUnread
                                                            ? 'bg-blue-600 text-white shadow-xs'
                                                            : 'bg-slate-100 text-slate-500'
                                                    }`}
                                                >
                                                    <Info size={15} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-1">
                                                        <p className={`text-xs leading-snug truncate ${isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                                            {title}
                                                        </p>
                                                        {isUnread && (
                                                            <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600 mt-1" />
                                                        )}
                                                    </div>
                                                    {body && (
                                                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                                                            {body}
                                                        </p>
                                                    )}
                                                    <p className="text-[10px] text-slate-400 mt-1">
                                                        {formatTimeAgo(n.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ⚙ Settings Button */}
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

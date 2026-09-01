/**
 * CalendarPage — Shared calendar UI for Admin, Team Leader, and Member.
 *
 * Props:
 *   fetchEvents(params) → Promise<{ events, choirs? }>
 *   role   : 'admin' | 'team_leader' | 'member'
 *   canEdit: boolean  — show Edit/Delete actions on event details (admin only)
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Calendar,
    CalendarDays,
    CalendarClock,
    List,
    MapPin,
    Clock,
    Users,
    Music2,
    FileText,
    RefreshCw,
    X,
    AlertCircle,
    ChevronDown,
    Mic2,
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import MemberSongLyricsModal from '../components/member/MemberSongLyricsModal';
import EmptyState from '../components/member/EmptyState';

/* ──────────────────────────────────────────────
 | Helpers
 | ─────────────────────────────────────────────*/
const MONTH_NAMES = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
];
const DAY_NAMES_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const DAY_NAMES_FULL  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

function toYMD(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function parseDate(str) {
    if (!str) return null;
    const [y, m, d] = str.split('-');
    return new Date(+y, +m - 1, +d);
}

function formatDisplayDate(str) {
    const d = parseDate(str);
    if (!d) return '';
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(value) {
    if (!value) return '';
    const [h, m] = value.split(':');
    const hour = parseInt(h, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}:${m ?? '00'} ${period}`;
}

function formatMonthYear(year, month) {
    return `${MONTH_NAMES[month]} ${year}`;
}

function getCalendarDays(year, month) {
    const firstDay = new Date(year, month, 1);
    // Monday-based: 0=Mon … 6=Sun
    let startDow = firstDay.getDay(); // 0=Sun
    startDow = startDow === 0 ? 6 : startDow - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < startDow; i++) {
        const prev = new Date(year, month, 1 - (startDow - i));
        days.push({ date: toYMD(prev), isCurrentMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const dt = new Date(year, month, d);
        days.push({ date: toYMD(dt), isCurrentMonth: true });
    }
    while (days.length % 7 !== 0) {
        const next = new Date(year, month + 1, days.length - (startDow + daysInMonth) + 1);
        days.push({ date: toYMD(next), isCurrentMonth: false });
    }
    return days;
}

function getWeekDays(date) {
    const d = new Date(date);
    const dow = d.getDay(); // 0=Sun
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(d);
    monday.setDate(d.getDate() + mondayOffset);
    return Array.from({ length: 7 }, (_, i) => {
        const day = new Date(monday);
        day.setDate(monday.getDate() + i);
        return toYMD(day);
    });
}

/* ──────────────────────────────────────────────
 | Event Styling
 | ─────────────────────────────────────────────*/
const TYPE_CONFIG = {
    performance: {
        label: 'Performance',
        icon: CalendarDays,
        bg: 'bg-blue-600',
        text: 'text-white',
        pill: 'bg-blue-100 text-blue-800 border-blue-200',
        dot: 'bg-blue-500',
        badge: 'bg-blue-600 text-white',
        border: 'border-l-blue-500',
    },
    rehearsal: {
        label: 'Rehearsal',
        icon: CalendarClock,
        bg: 'bg-violet-600',
        text: 'text-white',
        pill: 'bg-violet-100 text-violet-800 border-violet-200',
        dot: 'bg-violet-500',
        badge: 'bg-violet-600 text-white',
        border: 'border-l-violet-500',
    },
};

const STATUS_CONFIG = {
    scheduled:  { label: 'Upcoming',   bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    confirmed:  { label: 'Confirmed',  bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    completed:  { label: 'Completed',  bg: 'bg-slate-100 text-slate-600 border-slate-200' },
    cancelled:  { label: 'Cancelled',  bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    ongoing:    { label: 'Today',      bg: 'bg-amber-50 text-amber-700 border-amber-200' },
};

function getStatusConfig(status, date) {
    const today = toYMD(new Date());
    if (date === today && status !== 'completed' && status !== 'cancelled') {
        return STATUS_CONFIG.ongoing;
    }
    return STATUS_CONFIG[status] ?? { label: status, bg: 'bg-slate-100 text-slate-600 border-slate-200' };
}

/* ──────────────────────────────────────────────
 | Event Pill (used in month/week cells)
 | ─────────────────────────────────────────────*/
function EventPill({ event, onClick }) {
    const cfg = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.performance;
    return (
        <button
            onClick={() => onClick(event)}
            title={event.title}
            className={`w-full truncate rounded-md px-1.5 py-0.5 text-left text-[11px] font-semibold transition hover:opacity-80 ${cfg.bg} ${cfg.text}`}
        >
            {event.start_time ? `${formatTime(event.start_time)} ` : ''}{event.title}
        </button>
    );
}

/* ──────────────────────────────────────────────
 | Month View
 | ─────────────────────────────────────────────*/
function MonthView({ year, month, eventsByDate, onEventClick }) {
    const today = toYMD(new Date());
    const days  = useMemo(() => getCalendarDays(year, month), [year, month]);

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Day header */}
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
                {DAY_NAMES_SHORT.map((d) => (
                    <div key={d} className="py-2 text-center text-[11px] font-black uppercase tracking-widest text-slate-400">
                        {d}
                    </div>
                ))}
            </div>
            {/* Cells */}
            <div className="grid grid-cols-7">
                {days.map(({ date, isCurrentMonth }, idx) => {
                    const dayEvents = eventsByDate[date] ?? [];
                    const isToday   = date === today;
                    return (
                        <div
                            key={idx}
                            className={`min-h-[80px] border-b border-r border-slate-100 p-1.5 last:border-r-0 ${
                                !isCurrentMonth ? 'bg-slate-50/70' : ''
                            }`}
                        >
                            <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                isToday
                                    ? 'bg-blue-600 text-white shadow'
                                    : isCurrentMonth
                                    ? 'text-slate-800'
                                    : 'text-slate-300'
                            }`}>
                                {new Date(date + 'T00:00:00').getDate()}
                            </div>
                            <div className="space-y-0.5">
                                {dayEvents.slice(0, 3).map((ev) => (
                                    <EventPill key={`${ev.type}-${ev.id}`} event={ev} onClick={onEventClick} />
                                ))}
                                {dayEvents.length > 3 && (
                                    <p className="pl-1 text-[10px] font-semibold text-slate-400">
                                        +{dayEvents.length - 3} more
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────
 | Week View
 | ─────────────────────────────────────────────*/
function WeekView({ currentDate, eventsByDate, onEventClick }) {
    const today    = toYMD(new Date());
    const weekDays = useMemo(() => getWeekDays(new Date(currentDate + 'T00:00:00')), [currentDate]);

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
                {weekDays.map((date, i) => {
                    const d   = new Date(date + 'T00:00:00');
                    const isT = date === today;
                    return (
                        <div key={i} className="flex flex-col items-center py-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {DAY_NAMES_SHORT[i]}
                            </span>
                            <span className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                                isT ? 'bg-blue-600 text-white' : 'text-slate-700'
                            }`}>
                                {d.getDate()}
                            </span>
                        </div>
                    );
                })}
            </div>
            <div className="grid grid-cols-7 divide-x divide-slate-100">
                {weekDays.map((date, i) => {
                    const dayEvents = eventsByDate[date] ?? [];
                    const isT = date === today;
                    return (
                        <div key={i} className={`min-h-[200px] p-2 ${isT ? 'bg-blue-50/30' : ''}`}>
                            <div className="space-y-1">
                                {dayEvents.length === 0 ? (
                                    <span className="block pt-3 text-center text-[10px] text-slate-300">–</span>
                                ) : (
                                    dayEvents.map((ev) => (
                                        <EventPill key={`${ev.type}-${ev.id}`} event={ev} onClick={onEventClick} />
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────
 | Agenda View
 | ─────────────────────────────────────────────*/
function AgendaView({ events, onEventClick }) {
    // Group by date
    const grouped = useMemo(() => {
        const map = {};
        events.forEach((ev) => {
            if (!ev.date) return;
            if (!map[ev.date]) map[ev.date] = [];
            map[ev.date].push(ev);
        });
        return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
    }, [events]);

    if (grouped.length === 0) {
        return (
            <EmptyState
                icon={Calendar}
                title="No scheduled events"
                message="Your choir calendar will appear here when performances and rehearsals are scheduled."
            />
        );
    }

    const today = toYMD(new Date());

    return (
        <div className="space-y-4">
            {grouped.map(([date, dayEvents]) => {
                const isToday = date === today;
                const past    = date < today;
                return (
                    <div key={date}>
                        <div className={`mb-2 flex items-center gap-2 ${past ? 'opacity-60' : ''}`}>
                            <div className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl text-center shadow-sm ${
                                isToday ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200'
                            }`}>
                                <span className={`text-[10px] font-black uppercase tracking-wider ${isToday ? 'text-blue-200' : 'text-slate-400'}`}>
                                    {MONTH_NAMES[parseDate(date)?.getMonth()].slice(0,3)}
                                </span>
                                <span className={`text-sm font-black leading-tight ${isToday ? 'text-white' : 'text-slate-800'}`}>
                                    {parseDate(date)?.getDate()}
                                </span>
                            </div>
                            <span className={`text-sm font-bold ${isToday ? 'text-blue-700' : 'text-slate-600'}`}>
                                {isToday ? 'Today — ' : ''}{formatDisplayDate(date)}
                            </span>
                        </div>
                        <div className="ml-12 space-y-2">
                            {dayEvents.map((ev) => {
                                const cfg = TYPE_CONFIG[ev.type] ?? TYPE_CONFIG.performance;
                                return (
                                    <button
                                        key={`${ev.type}-${ev.id}`}
                                        onClick={() => onEventClick(ev)}
                                        className={`w-full rounded-2xl border border-l-4 bg-white p-4 text-left shadow-sm transition hover:shadow-md ${cfg.border} ${past ? 'opacity-70' : ''}`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${cfg.badge}`}>
                                                        <cfg.icon size={10} />
                                                        {cfg.label}
                                                    </span>
                                                    {ev.status && (
                                                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getStatusConfig(ev.status, ev.date).bg}`}>
                                                            {getStatusConfig(ev.status, ev.date).label}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="truncate text-sm font-bold text-slate-900">{ev.title}</h3>
                                                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                                                    {(ev.start_time || ev.end_time) && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={11} />
                                                            {formatTime(ev.start_time)}
                                                            {ev.end_time && ` – ${formatTime(ev.end_time)}`}
                                                        </span>
                                                    )}
                                                    {ev.location && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin size={11} />
                                                            {ev.location}
                                                        </span>
                                                    )}
                                                    {ev.choir?.name && (
                                                        <span className="flex items-center gap-1">
                                                            <Users size={11} />
                                                            {ev.choir.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="shrink-0 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500 border border-slate-100">
                                                View →
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ──────────────────────────────────────────────
 | Upcoming Events Panel (sidebar)
 | ─────────────────────────────────────────────*/
function UpcomingPanel({ events, onEventClick }) {
    const today = toYMD(new Date());
    const upcoming = useMemo(
        () => events.filter((e) => e.date && e.date >= today).slice(0, 8),
        [events, today]
    );

    if (upcoming.length === 0) {
        return (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-400">Upcoming</h3>
                <p className="text-xs text-slate-400">No upcoming events.</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">Upcoming Events</h3>
            </div>
            <div className="divide-y divide-slate-50">
                {upcoming.map((ev) => {
                    const cfg = TYPE_CONFIG[ev.type] ?? TYPE_CONFIG.performance;
                    const d   = parseDate(ev.date);
                    return (
                        <button
                            key={`${ev.type}-${ev.id}`}
                            onClick={() => onEventClick(ev)}
                            className="w-full px-5 py-4 text-left transition hover:bg-slate-50"
                        >
                            <div className="flex gap-3">
                                <div className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl text-center ${cfg.bg} text-white`}>
                                    <span className="text-[9px] font-black uppercase">{MONTH_NAMES[d.getMonth()].slice(0,3)}</span>
                                    <span className="text-sm font-black leading-none">{d.getDate()}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-bold text-slate-900">{ev.title}</p>
                                    {ev.start_time && (
                                        <p className="text-xs text-slate-500">{formatTime(ev.start_time)}</p>
                                    )}
                                    {ev.location && (
                                        <p className="truncate text-xs text-slate-400">{ev.location}</p>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────
 | Event Details Modal
 | ─────────────────────────────────────────────*/
function EventDetailsModal({ event, open, onClose }) {
    const [lyricsSong, setLyricsSong] = useState(null);

    if (!event) return null;
    const cfg    = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.performance;
    const status = getStatusConfig(event.status, event.date);

    return (
        <>
            <Modal open={open} onClose={onClose} size="lg" title={event.title} labelledBy={`event-detail-${event.id}`}>
                <div className="space-y-5">
                    {/* Type + Status badges */}
                    <div className="flex flex-wrap gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${cfg.badge}`}>
                            <cfg.icon size={12} /> {cfg.label}
                        </span>
                        {event.status && (
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${status.bg}`}>
                                ● {status.label}
                            </span>
                        )}
                    </div>

                    {/* Detail grid */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {event.date && (
                            <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                                <Calendar size={16} className="mt-0.5 shrink-0 text-slate-400" />
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Date</p>
                                    <p className="text-sm font-bold text-slate-800">{formatDisplayDate(event.date)}</p>
                                </div>
                            </div>
                        )}
                        {(event.start_time || event.end_time) && (
                            <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                                <Clock size={16} className="mt-0.5 shrink-0 text-slate-400" />
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Time</p>
                                    <p className="text-sm font-bold text-slate-800">
                                        {formatTime(event.start_time)}
                                        {event.end_time && ` – ${formatTime(event.end_time)}`}
                                    </p>
                                </div>
                            </div>
                        )}
                        {event.location && (
                            <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                                <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Location</p>
                                    <p className="text-sm font-bold text-slate-800">{event.location}</p>
                                </div>
                            </div>
                        )}
                        {event.choir?.name && (
                            <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                                <Users size={16} className="mt-0.5 shrink-0 text-slate-400" />
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Choir</p>
                                    <p className="text-sm font-bold text-slate-800">{event.choir.name}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {event.description && (
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                            <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Description</p>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{event.description}</p>
                        </div>
                    )}

                    {/* Songs */}
                    {event.songs && event.songs.length > 0 && (
                        <div>
                            <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                {event.type === 'performance' ? 'Performance Songs' : 'Songs to Practice'}
                            </p>
                            <div className="space-y-2">
                                {event.songs.map((song) => (
                                    <div
                                        key={song.id}
                                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Music2 size={14} className="shrink-0 text-blue-500" />
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-slate-900">{song.title}</p>
                                                {song.artist && <p className="text-xs text-slate-500">{song.artist}</p>}
                                            </div>
                                        </div>
                                        {song.has_lyrics && (
                                            <button
                                                onClick={() => setLyricsSong(song)}
                                                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-600 hover:text-white"
                                            >
                                                <FileText size={12} /> Lyrics
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Close button */}
                    <div className="flex justify-end pt-2">
                        <button
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Nested lyrics modal */}
            <MemberSongLyricsModal
                song={lyricsSong}
                isOpen={!!lyricsSong}
                onClose={() => setLyricsSong(null)}
            />
        </>
    );
}

/* ──────────────────────────────────────────────
 | Skeleton Loading
 | ─────────────────────────────────────────────*/
function CalendarSkeleton() {
    return (
        <div className="animate-pulse space-y-4">
            <div className="flex gap-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-9 w-28 rounded-xl bg-slate-200" />)}
            </div>
            <div className="h-[400px] rounded-2xl bg-slate-100" />
        </div>
    );
}

/* ──────────────────────────────────────────────
 | Select component
 | ─────────────────────────────────────────────*/
function FilterSelect({ label, value, onChange, options }) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
    );
}

/* ──────────────────────────────────────────────
 | Main CalendarPage
 | ─────────────────────────────────────────────*/
export default function CalendarPage({ fetchEvents, role = 'member', pageTitle, pageSubtitle }) {
    const today = toYMD(new Date());
    const [currentDate, setCurrentDate] = useState(today);       // YYYY-MM-DD anchor
    const [view, setView]               = useState('month');      // month | week | agenda
    const [allEvents, setAllEvents]     = useState([]);
    const [choirs, setChoirs]           = useState([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState(null);

    // Filters
    const [filterChoir, setFilterChoir] = useState('');
    const [filterType, setFilterType]   = useState('');

    // Selected event for modal
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [modalOpen, setModalOpen]         = useState(false);

    const currentYear  = useMemo(() => parseInt(currentDate.split('-')[0], 10), [currentDate]);
    const currentMonth = useMemo(() => parseInt(currentDate.split('-')[1], 10) - 1, [currentDate]);

    const monthParam = useMemo(
        () => `${currentDate.split('-')[0]}-${currentDate.split('-')[1]}`,
        [currentDate]
    );

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        const params = { month: monthParam };
        if (filterChoir) params.choir_id = filterChoir;
        if (filterType)  params.type     = filterType;

        fetchEvents(params)
            .then(({ events = [], choirs: c = [] }) => {
                setAllEvents(events);
                setChoirs(c);
            })
            .catch((err) => setError(err.message || 'Unable to load calendar events.'))
            .finally(() => setLoading(false));
    }, [fetchEvents, monthParam, filterChoir, filterType]);

    useEffect(() => { load(); }, [load]);

    // Event map keyed by date string
    const eventsByDate = useMemo(() => {
        const map = {};
        allEvents.forEach((ev) => {
            if (!ev.date) return;
            if (!map[ev.date]) map[ev.date] = [];
            map[ev.date].push(ev);
        });
        return map;
    }, [allEvents]);

    /* Navigation */
    function navigatePrev() {
        const d = new Date(currentDate + 'T00:00:00');
        if (view === 'week') {
            d.setDate(d.getDate() - 7);
        } else {
            d.setMonth(d.getMonth() - 1);
        }
        setCurrentDate(toYMD(d));
    }
    function navigateNext() {
        const d = new Date(currentDate + 'T00:00:00');
        if (view === 'week') {
            d.setDate(d.getDate() + 7);
        } else {
            d.setMonth(d.getMonth() + 1);
        }
        setCurrentDate(toYMD(d));
    }
    function goToday() {
        setCurrentDate(today);
    }

    function openEventModal(event) {
        setSelectedEvent(event);
        setModalOpen(true);
    }

    /* Period label */
    const periodLabel = useMemo(() => {
        if (view === 'week') {
            const week = getWeekDays(new Date(currentDate + 'T00:00:00'));
            const s = new Date(week[0] + 'T00:00:00');
            const e = new Date(week[6] + 'T00:00:00');
            if (s.getMonth() === e.getMonth()) {
                return `${s.getDate()} – ${e.getDate()} ${MONTH_NAMES[s.getMonth()]} ${s.getFullYear()}`;
            }
            return `${s.getDate()} ${MONTH_NAMES[s.getMonth()].slice(0,3)} – ${e.getDate()} ${MONTH_NAMES[e.getMonth()].slice(0,3)} ${e.getFullYear()}`;
        }
        return formatMonthYear(currentYear, currentMonth);
    }, [view, currentDate, currentYear, currentMonth]);

    /* Detect mobile — use agenda as default on small screens */
    useEffect(() => {
        if (window.innerWidth < 640 && view === 'month') {
            setView('agenda');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const choirOptions = [
        { value: '', label: 'All Choirs' },
        ...choirs.map((c) => ({ value: String(c.id), label: c.name })),
    ];

    const typeOptions = [
        { value: '', label: 'All Event Types' },
        { value: 'performance', label: 'Performance' },
        { value: 'rehearsal', label: 'Rehearsal' },
    ];

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                    {pageTitle || 'Calendar'}
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                    {pageSubtitle || 'View scheduled performances and rehearsals.'}
                </p>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Navigation */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={navigatePrev}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        aria-label="Previous"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={goToday}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                        Today
                    </button>
                    <button
                        onClick={navigateNext}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        aria-label="Next"
                    >
                        <ChevronRight size={16} />
                    </button>
                    <span className="ml-1 text-base font-black text-slate-800">{periodLabel}</span>
                </div>

                {/* View switcher */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Filters */}
                    {role === 'admin' && choirs.length > 0 && (
                        <FilterSelect
                            label="Choir"
                            value={filterChoir}
                            onChange={setFilterChoir}
                            options={choirOptions}
                        />
                    )}
                    <FilterSelect
                        label="Type"
                        value={filterType}
                        onChange={setFilterType}
                        options={typeOptions}
                    />

                    {/* View buttons */}
                    <div className="flex rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        {[
                            { id: 'month',  label: 'Month',  icon: CalendarDays },
                            { id: 'week',   label: 'Week',   icon: Calendar },
                            { id: 'agenda', label: 'Agenda', icon: List },
                        ].map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setView(id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition ${
                                    view === id
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <Icon size={13} /> {label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={load}
                        disabled={loading}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-blue-200 hover:text-blue-600 disabled:opacity-50"
                        aria-label="Refresh"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
                    <AlertCircle size={18} className="shrink-0 text-rose-500" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-rose-700">{error}</p>
                    </div>
                    <button onClick={load} className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50">
                        Try Again
                    </button>
                </div>
            )}

            {/* Main grid: calendar + upcoming panel */}
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
                {/* Calendar */}
                <div className="min-w-0 flex-1">
                    {loading ? (
                        <CalendarSkeleton />
                    ) : (
                        <>
                            {view === 'month' && (
                                <MonthView
                                    year={currentYear}
                                    month={currentMonth}
                                    eventsByDate={eventsByDate}
                                    onEventClick={openEventModal}
                                />
                            )}
                            {view === 'week' && (
                                <WeekView
                                    currentDate={currentDate}
                                    eventsByDate={eventsByDate}
                                    onEventClick={openEventModal}
                                />
                            )}
                            {view === 'agenda' && (
                                <AgendaView events={allEvents} onEventClick={openEventModal} />
                            )}
                            {view !== 'agenda' && allEvents.length === 0 && !loading && (
                                <div className="mt-8 text-center">
                                    <EmptyState
                                        icon={Calendar}
                                        title="No scheduled events"
                                        message="Your choir calendar will appear here when performances and rehearsals are scheduled."
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Upcoming panel — hidden on small screens in agenda */}
                {!loading && (
                    <div className="xl:w-72 xl:shrink-0">
                        <UpcomingPanel events={allEvents} onEventClick={openEventModal} />
                    </div>
                )}
            </div>

            {/* Event details modal */}
            <EventDetailsModal
                event={selectedEvent}
                open={modalOpen}
                onClose={() => setModalOpen(false)}
            />
        </div>
    );
}

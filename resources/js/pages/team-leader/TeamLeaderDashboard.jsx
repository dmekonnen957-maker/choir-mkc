import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    CalendarDays,
    CalendarClock,
    CheckCircle2,
    ListMusic,
    Users,
    Music,
    Building2,
    ChevronRight,
    MapPin,
    Clock,
    Plus,
    Sparkles,
    AlertTriangle,
    RefreshCw,
    Play,
    Check,
    ArrowUpRight,
} from 'lucide-react';
import { api } from '../../axios';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/ui/Button';

function formatDate(value) {
    if (!value) return '—';
    try {
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return value;
        return d.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    } catch {
        return value;
    }
}

function formatTime(value) {
    if (!value) return '';
    try {
        const [h, m] = value.split(':');
        const hour = parseInt(h, 10);
        const period = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 === 0 ? 12 : hour % 12;
        return `${hour12}:${m ?? '00'} ${period}`;
    } catch {
        return value;
    }
}

export default function TeamLeaderDashboard() {
    const navigate = useNavigate();
    const { user, primaryChoir } = useAuth();
    const { theme } = useTheme();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const primaryColor = theme.primary || '#2563eb';
    const borderColor = theme.border || '#e2e8f0';

    const fetchDashboard = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('/team-leader/dashboard');
            setData(res.data?.data || {});
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to load team leader dashboard.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    // Loading Skeleton
    if (loading && !data) {
        return (
            <div className="space-y-8 animate-pulse pb-14">
                <div className="flex flex-col gap-3">
                    <div className="h-8 w-64 rounded-xl bg-slate-200" />
                    <div className="h-4 w-80 rounded-lg bg-slate-100" />
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-28 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                            <div className="h-4 w-20 rounded bg-slate-100" />
                            <div className="h-7 w-16 rounded bg-slate-200" />
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="h-64 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" />
                    <div className="h-64 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" />
                </div>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900 shadow-sm flex flex-col items-center text-center gap-3 py-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                    <AlertTriangle size={24} />
                </div>
                <h3 className="text-base font-bold">Could not load Team Leader Dashboard</h3>
                <p className="text-xs text-rose-700 max-w-md">{error}</p>
                <Button variant="primary" size="sm" onClick={fetchDashboard} className="mt-2">
                    <RefreshCw size={14} /> Retry
                </Button>
            </div>
        );
    }

    // No Choir Assigned
    if (!data?.has_choir) {
        return (
            <div className="space-y-6 pb-12">
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mx-auto mb-4">
                        <Building2 size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Welcome, {user?.name}</h2>
                    <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                        You do not have a choir assigned to your team leader profile yet. An administrator will assign you to a choir soon.
                    </p>
                </div>
            </div>
        );
    }

    const { choir, stats = {}, next_performance, next_rehearsal, upcoming_performances = [], upcoming_rehearsals = [], recent_songs = [] } = data;
    const attendance = stats.attendance || {};

    return (
        <div className="space-y-8 pb-14">
            {/* Header Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div
                    className="absolute top-0 left-0 right-0 h-2"
                    style={{ backgroundColor: primaryColor }}
                />
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
                    <div className="flex items-center gap-3.5">
                        <div
                            className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <Building2 size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Team Leader Portal
                                </span>
                                <span className="text-slate-300">•</span>
                                <span
                                    className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                                    style={{
                                        backgroundColor: `${primaryColor}18`,
                                        color: primaryColor,
                                    }}
                                >
                                    {choir.name}
                                </span>
                            </div>
                            <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-0.5">
                                Welcome, {user?.name}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={fetchDashboard}
                            disabled={loading}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                            title="Refresh dashboard"
                        >
                            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        </button>

                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate('/team-leader/attendance')}
                            className="rounded-xl shadow-md"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <Play size={14} />
                            <span>Live Attendance</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Link
                    to="/team-leader/attendance"
                    className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                    <div
                        className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors"
                        style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                    >
                        <CheckCircle2 size={22} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-900">Take Attendance</p>
                        <p className="text-[11px] text-slate-400">Live roster check-in</p>
                    </div>
                </Link>

                <Link
                    to="/team-leader/rehearsals"
                    className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                    <div
                        className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors"
                        style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                    >
                        <CalendarClock size={22} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-900">Create Rehearsal</p>
                        <p className="text-[11px] text-slate-400">Schedule team practice</p>
                    </div>
                </Link>

                <Link
                    to="/team-leader/choir"
                    className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                    <div
                        className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors"
                        style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                    >
                        <Users size={22} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-900">View Members</p>
                        <p className="text-[11px] text-slate-400">Choir roster & voices</p>
                    </div>
                </Link>

                <Link
                    to="/team-leader/performances"
                    className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                    <div
                        className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors"
                        style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                    >
                        <CalendarDays size={22} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-900">View Performances</p>
                        <p className="text-[11px] text-slate-400">Scheduled events</p>
                    </div>
                </Link>
            </div>

            {/* Key Statistic Cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Members</span>
                        <div
                            className="flex h-9 w-9 items-center justify-center rounded-xl"
                            style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
                        >
                            <Users size={18} />
                        </div>
                    </div>
                    <p className="mt-3 text-3xl font-black text-slate-900">{stats.members ?? 0}</p>
                    <span className="text-xs text-slate-400">Choir roster count</span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Upcoming Events</span>
                        <div
                            className="flex h-9 w-9 items-center justify-center rounded-xl"
                            style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
                        >
                            <CalendarDays size={18} />
                        </div>
                    </div>
                    <p className="mt-3 text-3xl font-black text-slate-900">{stats.upcoming_performances ?? 0}</p>
                    <span className="text-xs text-slate-400">Performances ahead</span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Rehearsals</span>
                        <div
                            className="flex h-9 w-9 items-center justify-center rounded-xl"
                            style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
                        >
                            <CalendarClock size={18} />
                        </div>
                    </div>
                    <p className="mt-3 text-3xl font-black text-slate-900">{stats.upcoming_rehearsals ?? 0}</p>
                    <span className="text-xs text-slate-400">Scheduled rehearsals</span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Attendance Rate</span>
                        <div
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"
                        >
                            <CheckCircle2 size={18} />
                        </div>
                    </div>
                    <p className="mt-3 text-3xl font-black text-emerald-800">
                        {attendance.attendance_rate !== undefined ? `${attendance.attendance_rate}%` : 'N/A'}
                    </p>
                    <span className="text-xs text-slate-400 font-medium">
                        {attendance.has_records ? `${attendance.present || 0} present · ${attendance.absent || 0} absent` : 'No logs yet'}
                    </span>
                </div>
            </div>

            {/* Next Events Highlight Cards */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Next Performance */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-100">
                                <Sparkles size={12} /> Next Performance
                            </span>
                            <Link
                                to="/team-leader/performances"
                                className="inline-flex items-center gap-1 text-xs font-bold hover:underline"
                                style={{ color: primaryColor }}
                            >
                                All Events <ChevronRight size={14} />
                            </Link>
                        </div>

                        {next_performance ? (
                            <div className="space-y-3 mt-2">
                                <h3 className="text-lg font-bold text-slate-900">{next_performance.title}</h3>
                                <div className="space-y-2 text-xs text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <CalendarDays size={14} style={{ color: primaryColor }} />
                                        <span className="font-semibold text-slate-800">{formatDate(next_performance.date)}</span>
                                        {next_performance.start_time && (
                                            <span>· {formatTime(next_performance.start_time)}</span>
                                        )}
                                    </div>
                                    {next_performance.location && (
                                        <div className="flex items-center gap-2">
                                            <MapPin size={14} style={{ color: primaryColor }} />
                                            <span>{next_performance.location}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 text-center text-xs text-slate-400">
                                <CalendarDays size={24} className="mx-auto mb-2 text-slate-300" />
                                <p>No upcoming performances scheduled.</p>
                            </div>
                        )}
                    </div>

                    {next_performance && (
                        <div className="mt-5 border-t border-slate-100 pt-3">
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => navigate(`/team-leader/attendance?choir_id=${choir.id}&performance_id=${next_performance.id}`)}
                                className="w-full justify-center"
                                style={{ backgroundColor: primaryColor }}
                            >
                                <CheckCircle2 size={14} /> Take Performance Attendance
                            </Button>
                        </div>
                    )}
                </div>

                {/* Next Rehearsal */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-100">
                                <CalendarClock size={12} /> Next Rehearsal
                            </span>
                            <Link
                                to="/team-leader/rehearsals"
                                className="inline-flex items-center gap-1 text-xs font-bold hover:underline"
                                style={{ color: primaryColor }}
                            >
                                All Rehearsals <ChevronRight size={14} />
                            </Link>
                        </div>

                        {next_rehearsal ? (
                            <div className="space-y-3 mt-2">
                                <h3 className="text-lg font-bold text-slate-900">{next_rehearsal.title}</h3>
                                <div className="space-y-2 text-xs text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <CalendarClock size={14} style={{ color: primaryColor }} />
                                        <span className="font-semibold text-slate-800">{formatDate(next_rehearsal.date)}</span>
                                        {next_rehearsal.start_time && (
                                            <span>· {formatTime(next_rehearsal.start_time)}</span>
                                        )}
                                    </div>
                                    {next_rehearsal.location && (
                                        <div className="flex items-center gap-2">
                                            <MapPin size={14} style={{ color: primaryColor }} />
                                            <span>{next_rehearsal.location}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 text-center text-xs text-slate-400">
                                <CalendarClock size={24} className="mx-auto mb-2 text-slate-300" />
                                <p>No upcoming rehearsals scheduled.</p>
                            </div>
                        )}
                    </div>

                    {next_rehearsal && (
                        <div className="mt-5 border-t border-slate-100 pt-3">
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => navigate(`/team-leader/attendance?choir_id=${choir.id}&rehearsal_id=${next_rehearsal.id}`)}
                                className="w-full justify-center"
                                style={{ backgroundColor: primaryColor }}
                            >
                                <CheckCircle2 size={14} /> Take Rehearsal Attendance
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Upcoming Rehearsals & Recent Songs Schedule */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Upcoming Rehearsals List */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <CalendarClock size={16} style={{ color: primaryColor }} /> Upcoming Rehearsals
                        </h3>
                        <Link to="/team-leader/rehearsals" className="text-xs font-bold hover:underline" style={{ color: primaryColor }}>
                            Manage
                        </Link>
                    </div>

                    {upcoming_rehearsals.length === 0 ? (
                        <p className="py-8 text-center text-xs text-slate-400">No rehearsals on schedule.</p>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {upcoming_rehearsals.map((r) => (
                                <div key={r.id} className="py-3 flex items-center justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold text-slate-900 truncate">{r.title}</p>
                                        <p className="text-[11px] text-slate-500">
                                            {formatDate(r.date)} {r.start_time ? `· ${formatTime(r.start_time)}` : ''}
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-[11px] py-1 px-2.5 h-auto rounded-lg"
                                        onClick={() => navigate(`/team-leader/attendance?choir_id=${choir.id}&rehearsal_id=${r.id}`)}
                                    >
                                        Attendance
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Songs */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Music size={16} style={{ color: primaryColor }} /> Choir Songs ({stats.songs ?? 0})
                        </h3>
                        <Link to="/team-leader/songs" className="text-xs font-bold hover:underline" style={{ color: primaryColor }}>
                            Library
                        </Link>
                    </div>

                    {recent_songs.length === 0 ? (
                        <p className="py-8 text-center text-xs text-slate-400">No songs cataloged yet.</p>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {recent_songs.map((s) => (
                                <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold text-slate-900 truncate">{s.title}</p>
                                        <p className="text-[11px] text-slate-500">
                                            {s.artist ? `${s.artist} · ` : ''}
                                            {s.category || 'Worship'}
                                        </p>
                                    </div>
                                    {s.key && (
                                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600">
                                            Key: {s.key}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
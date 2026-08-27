import { useState, useEffect } from 'react';
import {
    CheckCircle2,
    Clock,
    XCircle,
    HelpCircle,
    Calendar,
    Search,
    Filter,
    BarChart3,
    Church,
    Music,
    Sparkles,
    CalendarDays,
} from 'lucide-react';
import { api } from '../../axios';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';

const STATUS_CONFIG = {
    present: {
        label: 'Present',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        icon: CheckCircle2,
    },
    late: {
        label: 'Late',
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
        icon: Clock,
    },
    absent: {
        label: 'Absent',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
        icon: XCircle,
    },
    excused: {
        label: 'Excused',
        bg: 'bg-sky-50 text-sky-700 border-sky-200',
        dot: 'bg-sky-500',
        icon: HelpCircle,
    },
    unmarked: {
        label: 'Unmarked',
        bg: 'bg-slate-50 text-slate-600 border-slate-200',
        dot: 'bg-slate-400',
        icon: HelpCircle,
    },
};

function formatDisplayDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const [year, month, day] = dateStr.split('-');
        if (!year || !month || !day) return dateStr;
        const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
        return d.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

export default function MemberAttendancePage() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        let active = true;
        api
            .get('/member/attendance')
            .then((res) => {
                if (active) setData(res.data.data);
            })
            .catch((err) => {
                if (active) setError(err.response?.data?.message || 'Failed to load attendance history');
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    const stats = data?.stats || {
        total_events: 0,
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
        attendance_rate: 0,
    };

    const history = data?.history || [];

    const filteredHistory = history.filter((item) => {
        const matchesSearch =
            !search.trim() ||
            item.event_title?.toLowerCase().includes(search.toLowerCase()) ||
            item.choir_name?.toLowerCase().includes(search.toLowerCase()) ||
            item.date?.includes(search);

        const matchesStatus =
            statusFilter === 'all' || item.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <LoadingSpinner size={32} className="text-blue-600" />
                <p className="mt-3 text-sm font-semibold text-slate-500">Loading your attendance records...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <Alert variant="error">{error}</Alert>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                            <CheckCircle2 size={22} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Attendance</h1>
                            <p className="text-sm text-slate-500">
                                {data?.choir?.name || 'Choir Ministry'} • {data?.member?.full_name || user?.name}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Attendance Overview Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {/* Total Events */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Total Events
                    </span>
                    <p className="mt-2 text-2xl font-black text-slate-900">{stats.total_events}</p>
                    <span className="text-xs text-slate-400">Scheduled Sessions</span>
                </div>

                {/* Present */}
                <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white p-4 shadow-sm">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                        Present
                    </span>
                    <p className="mt-2 text-2xl font-black text-emerald-800">{stats.present}</p>
                    <span className="text-xs font-semibold text-emerald-600">On Time</span>
                </div>

                {/* Late */}
                <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/50 to-white p-4 shadow-sm">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                        Late
                    </span>
                    <p className="mt-2 text-2xl font-black text-amber-800">{stats.late}</p>
                    <span className="text-xs font-semibold text-amber-600">After Start</span>
                </div>

                {/* Absent */}
                <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50/50 to-white p-4 shadow-sm">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                        Absent
                    </span>
                    <p className="mt-2 text-2xl font-black text-rose-800">{stats.absent}</p>
                    <span className="text-xs font-semibold text-rose-600">Missed</span>
                </div>

                {/* Attendance Rate */}
                <div className="col-span-2 sm:col-span-1 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-600 to-indigo-600 p-4 text-white shadow-md shadow-blue-500/10">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-100">
                        Attendance Rate
                    </span>
                    <p className="mt-2 text-2xl font-black">{stats.attendance_rate}%</p>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-blue-900/50 overflow-hidden">
                        <div
                            className="h-full bg-white rounded-full transition-all"
                            style={{ width: `${Math.min(stats.attendance_rate, 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search past events or dates..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                    {['all', 'present', 'late', 'absent', 'excused'].map((st) => (
                        <button
                            key={st}
                            onClick={() => setStatusFilter(st)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors ${
                                statusFilter === st
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {st}
                        </button>
                    ))}
                </div>
            </div>

            {/* Attendance History List */}
            {filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
                    <CalendarDays size={40} className="text-slate-300" />
                    <h3 className="mt-2 text-base font-bold text-slate-700">No attendance records found</h3>
                    <p className="text-xs text-slate-400 max-w-sm mt-1">
                        {search || statusFilter !== 'all'
                            ? 'Try clearing your search or filter.'
                            : 'No recorded attendance sessions yet.'}
                    </p>
                </div>
            ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="hidden sm:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                                    <th className="px-5 py-3.5">Date</th>
                                    <th className="px-5 py-3.5">Event / Performance</th>
                                    <th className="px-4 py-3.5">Choir</th>
                                    <th className="px-4 py-3.5">Status</th>
                                    <th className="px-4 py-3.5">Check-In</th>
                                    <th className="px-4 py-3.5">Check-Out</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filteredHistory.map((item) => {
                                    const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.unmarked;

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-5 py-3.5 font-semibold text-slate-900">
                                                {formatDisplayDate(item.date)}
                                            </td>

                                            <td className="px-5 py-3.5">
                                                <div className="font-bold text-slate-900">{item.event_title}</div>
                                                <span className="text-xs uppercase font-bold text-slate-400">
                                                    {item.event_type}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3.5 text-xs text-slate-600 font-medium">
                                                {item.choir_name}
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${statusCfg.bg}`}
                                                >
                                                    <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                                                    {statusCfg.label}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3.5 font-mono text-xs text-slate-700">
                                                {item.check_in_time || '—'}
                                            </td>

                                            <td className="px-4 py-3.5 font-mono text-xs text-slate-700">
                                                {item.check_out_time || '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards View */}
                    <div className="grid grid-cols-1 gap-3 sm:hidden">
                        {filteredHistory.map((item) => {
                            const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.unmarked;

                            return (
                                <div
                                    key={item.id}
                                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2.5"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-bold text-slate-900">{item.event_title}</p>
                                            <p className="text-xs text-slate-500 font-medium">
                                                {formatDisplayDate(item.date)} • {item.choir_name}
                                            </p>
                                        </div>
                                        <span
                                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusCfg.bg}`}
                                        >
                                            <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                                            {statusCfg.label}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2 text-xs text-slate-600">
                                        <div>
                                            <span className="font-bold text-slate-400 uppercase text-[10px] block">
                                                Check-In
                                            </span>
                                            <span className="font-semibold font-mono text-emerald-700">
                                                {item.check_in_time || '—'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-400 uppercase text-[10px] block">
                                                Check-Out
                                            </span>
                                            <span className="font-semibold font-mono text-blue-700">
                                                {item.check_out_time || '—'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

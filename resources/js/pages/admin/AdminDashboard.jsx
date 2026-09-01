import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Users,
    Music2,
    CalendarDays,
    CalendarClock,
    Building2,
    Activity,
    CheckCircle2,
    ChevronRight,
    TrendingUp,
    Sparkles,
    RefreshCw,
    Filter,
    BarChart3,
    PieChart as PieChartIcon,
    Layers,
    ArrowUpRight,
    Search,
    Clock,
    MapPin,
    AlertTriangle,
} from 'lucide-react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    CartesianGrid,
    Legend,
} from 'recharts';
import { api } from '../../axios';
import { useChoir } from '../../context/ChoirContext';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

/* ─────────────────────── Helpers ─────────────────────── */

function formatDate(iso) {
    if (!iso) return '—';
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return iso;
    }
}

function formatTime(timeStr) {
    if (!timeStr) return '';
    try {
        const [h, min] = timeStr.split(':');
        const hour = parseInt(h, 10);
        const period = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 === 0 ? 12 : hour % 12;
        return `${hour12}:${min ?? '00'} ${period}`;
    } catch {
        return timeStr;
    }
}

const ATTENDANCE_COLORS = {
    present: '#10b981', // emerald-500
    late: '#f59e0b',    // amber-500
    absent: '#f43f5e',  // rose-500
    excused: '#0ea5e9', // sky-500
};

const CHART_PALETTE = [
    '#2563eb', // blue-600
    '#8b5cf6', // violet-500
    '#06b6d4', // cyan-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ec4899', // pink-500
    '#6366f1', // indigo-500
];

/* ─────────────────────── Skeleton Loader ─────────────────────── */

function DashboardSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            {/* Header skeleton */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                    <div className="h-8 w-64 rounded-xl bg-slate-200" />
                    <div className="h-4 w-96 rounded-lg bg-slate-100" />
                </div>
                <div className="h-10 w-48 rounded-xl bg-slate-200" />
            </div>

            {/* Stat cards skeleton */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-28 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                        <div className="h-4 w-20 rounded bg-slate-100" />
                        <div className="h-7 w-16 rounded bg-slate-200" />
                    </div>
                ))}
            </div>

            {/* Charts skeleton */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="h-80 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" />
                <div className="h-80 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" />
            </div>
        </div>
    );
}

/* ─────────────────────── Stat Card ─────────────────────── */

function ModernStatCard({ icon: Icon, label, value, subtext, color = 'blue', trend }) {
    const colorStyles = {
        blue: {
            iconBg: 'bg-blue-50 text-blue-700',
            border: 'hover:border-blue-300',
            bar: 'from-blue-600 to-indigo-600',
        },
        emerald: {
            iconBg: 'bg-emerald-50 text-emerald-700',
            border: 'hover:border-emerald-300',
            bar: 'from-emerald-600 to-teal-600',
        },
        violet: {
            iconBg: 'bg-violet-50 text-violet-700',
            border: 'hover:border-violet-300',
            bar: 'from-violet-600 to-purple-600',
        },
        amber: {
            iconBg: 'bg-amber-50 text-amber-700',
            border: 'hover:border-amber-300',
            bar: 'from-amber-500 to-orange-500',
        },
        sky: {
            iconBg: 'bg-sky-50 text-sky-700',
            border: 'hover:border-sky-300',
            bar: 'from-sky-500 to-blue-500',
        },
        rose: {
            iconBg: 'bg-rose-50 text-rose-700',
            border: 'hover:border-rose-300',
            bar: 'from-rose-500 to-pink-500',
        },
    };

    const style = colorStyles[color] || colorStyles.blue;

    return (
        <div className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${style.border}`}>
            <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate">{label}</span>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.iconBg} shadow-sm`}>
                    <Icon size={20} />
                </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tight text-slate-900">{value}</span>
                {trend && (
                    <span className="inline-flex items-center text-xs font-bold text-emerald-600">
                        <TrendingUp size={13} className="mr-0.5" />
                        {trend}
                    </span>
                )}
            </div>

            {subtext && <p className="mt-1 text-xs text-slate-400 font-medium">{subtext}</p>}
        </div>
    );
}

/* ─────────────────────── Custom Chart Tooltip ─────────────────────── */

function CustomTooltip({ active, payload, label }) {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-xl border border-slate-200 bg-slate-900 p-3 text-xs text-white shadow-xl">
                <p className="font-bold text-slate-200">{label || payload[0].name}</p>
                <div className="mt-1.5 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: payload[0].color || payload[0].fill }} />
                    <span className="text-slate-300 capitalize">{payload[0].name}:</span>
                    <span className="font-black text-white">{payload[0].value}</span>
                </div>
            </div>
        );
    }
    return null;
}

/* ─────────────────────── MAIN ADMIN DASHBOARD ─────────────────────── */

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [choirs, setChoirs] = useState([]);
    const [selectedChoirId, setSelectedChoirId] = useState('all'); // 'all' | choirId
    const [dateRange, setDateRange] = useState('all'); // 'all' | '30days' | '6months' | 'year'

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch initial choir dropdown
    useEffect(() => {
        api.get('/public/choirs?per_page=100')
            .then((res) => {
                const items = res.data?.data?.items || res.data?.data || [];
                setChoirs(items);
            })
            .catch(() => {});
    }, []);

    // Fetch dashboard data based on selected choir
    const fetchDashboard = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            if (selectedChoirId === 'all') {
                const res = await api.get('/admin/dashboard');
                setData(res.data?.data || {});
            } else {
                const res = await api.get(`/admin/dashboard/${selectedChoirId}`);
                setData(res.data?.data || {});
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load dashboard statistics.');
        } finally {
            setLoading(false);
        }
    }, [selectedChoirId]);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    // Derived counts
    const counts = data?.counts || {};
    const charts = data?.charts || {};
    const upcoming = data?.upcoming_performances || [];
    const recentActivity = data?.recent_activity || [];
    const choirsOverview = data?.choirs_overview || [];

    // Formatted Attendance Pie Data
    const attendancePieData = useMemo(() => {
        const ov = charts.attendance_overview || {};
        return [
            { name: 'Present', value: ov.present || 0, color: ATTENDANCE_COLORS.present },
            { name: 'Late', value: ov.late || 0, color: ATTENDANCE_COLORS.late },
            { name: 'Absent', value: ov.absent || 0, color: ATTENDANCE_COLORS.absent },
            { name: 'Excused', value: ov.excused || 0, color: ATTENDANCE_COLORS.excused },
        ].filter((item) => item.value > 0);
    }, [charts.attendance_overview]);

    const isSpecificChoir = selectedChoirId !== 'all';
    const currentChoirName = isSpecificChoir
        ? choirs.find((c) => c.id.toString() === selectedChoirId)?.name || 'Selected Choir'
        : 'All Choirs';

    return (
        <div className="space-y-8 pb-14">
            {/* Top Bar / Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-lg shadow-blue-700/20">
                            <BarChart3 size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-slate-900">Admin Dashboard</h1>
                            <p className="text-sm text-slate-500">
                                Real-time executive overview across choirs, members, events, and attendance
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters Bar: Select Choir & Date Range & Refresh */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Choir Filter */}
                    <div className="relative">
                        <select
                            value={selectedChoirId}
                            onChange={(e) => setSelectedChoirId(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
                        >
                            <option value="all">🎶 All Choirs Overview ({choirs.length})</option>
                            {choirs.map((c) => (
                                <option key={c.id} value={c.id.toString()}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date Range Filter */}
                    <div className="relative">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
                        >
                            <option value="all">📅 All Time</option>
                            <option value="30days">Last 30 Days</option>
                            <option value="6months">Last 6 Months</option>
                            <option value="year">This Year</option>
                        </select>
                    </div>

                    {/* Refresh */}
                    <button
                        type="button"
                        onClick={fetchDashboard}
                        disabled={loading}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                        title="Refresh dashboard"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Error Message with Retry */}
            {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle size={20} className="text-rose-600 shrink-0" />
                        <div>
                            <p className="font-bold text-sm">{error}</p>
                            <p className="text-xs text-rose-600">Please check your network connection and try again.</p>
                        </div>
                    </div>
                    <Button variant="primary" size="sm" onClick={fetchDashboard}>
                        Retry
                    </Button>
                </div>
            )}

            {/* Loading Skeleton */}
            {loading && !data ? (
                <DashboardSkeleton />
            ) : (
                <>
                    {/* 1. KEY METRIC STAT CARDS */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                        {!isSpecificChoir && (
                            <ModernStatCard
                                icon={Building2}
                                label="Total Choirs"
                                value={counts.choirs ?? choirs.length}
                                subtext="Active ministries"
                                color="blue"
                            />
                        )}
                        <ModernStatCard
                            icon={Users}
                            label="Active Members"
                            value={counts.members ?? 0}
                            subtext={isSpecificChoir ? 'In this choir' : 'Across all choirs'}
                            color="emerald"
                        />
                        <ModernStatCard
                            icon={Music2}
                            label="Total Songs"
                            value={counts.songs ?? 0}
                            subtext="Library repertoire"
                            color="violet"
                        />
                        <ModernStatCard
                            icon={CalendarClock}
                            label="Rehearsals"
                            value={counts.rehearsals ?? 0}
                            subtext="Coordinated sessions"
                            color="amber"
                        />
                        <ModernStatCard
                            icon={CalendarDays}
                            label="Performances"
                            value={counts.performances ?? 0}
                            subtext={`${counts.upcoming_performances ?? counts.upcoming ?? 0} upcoming`}
                            color="sky"
                        />
                        <ModernStatCard
                            icon={CheckCircle2}
                            label="Attendance Rate"
                            value={`${counts.attendance_rate ?? 0}%`}
                            subtext="Overall check-in rate"
                            color="rose"
                        />
                    </div>

                    {/* 2. INTERACTIVE CHARTS SECTION */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Chart 1: Members by Choir (or Monthly Performances for single choir) */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        {!isSpecificChoir ? 'Members by Choir' : `${currentChoirName} — Attendance Breakdown`}
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        {!isSpecificChoir
                                            ? 'Active member distribution across choirs'
                                            : 'Distribution of check-in records'}
                                    </p>
                                </div>
                                <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                                    {!isSpecificChoir ? `${charts.members_by_choir?.length || 0} Choirs` : 'Live Stats'}
                                </span>
                            </div>

                            <div className="h-64 w-full">
                                {!isSpecificChoir ? (
                                    (charts.members_by_choir || []).length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={charts.members_by_choir}
                                                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis
                                                    dataKey="name"
                                                    tick={{ fontSize: 11, fill: '#64748b' }}
                                                    interval={0}
                                                    angle={-15}
                                                    textAnchor="end"
                                                />
                                                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey="count" name="Members" radius={[6, 6, 0, 0]}>
                                                    {(charts.members_by_choir || []).map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={entry.theme_color || CHART_PALETTE[index % CHART_PALETTE.length]}
                                                        />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                            No choir member data available.
                                        </div>
                                    )
                                ) : (
                                    /* Single choir: attendance bar */
                                    attendancePieData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={attendancePieData}
                                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                                                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey="value" name="Records" radius={[6, 6, 0, 0]}>
                                                    {attendancePieData.map((entry, index) => (
                                                        <Cell key={`att-cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                            No attendance records recorded yet.
                                        </div>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Chart 2: Performances Over Time (Area Chart) */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Performances Over Time</h3>
                                    <p className="text-xs text-slate-400">Monthly schedule frequency</p>
                                </div>
                                <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                    Last 6 Months
                                </span>
                            </div>

                            <div className="h-64 w-full">
                                {(charts.performances_over_time || []).length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={charts.performances_over_time}
                                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                        >
                                            <defs>
                                                <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="shortMonth" tick={{ fontSize: 11, fill: '#64748b' }} />
                                            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Area
                                                type="monotone"
                                                dataKey="count"
                                                name="Performances"
                                                stroke="#2563eb"
                                                strokeWidth={2.5}
                                                fillOpacity={1}
                                                fill="url(#perfGradient)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                        No performance timeline data.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Chart 3: Songs by Choir (only on all choirs view) */}
                        {!isSpecificChoir && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">Repertoire by Choir</h3>
                                        <p className="text-xs text-slate-400">Cataloged musical pieces per choir</p>
                                    </div>
                                    <span className="rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">
                                        {counts.songs || 0} Songs Total
                                    </span>
                                </div>

                                <div className="h-64 w-full">
                                    {(charts.songs_by_choir || []).length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={charts.songs_by_choir}
                                                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis
                                                    dataKey="name"
                                                    tick={{ fontSize: 11, fill: '#64748b' }}
                                                    interval={0}
                                                    angle={-15}
                                                    textAnchor="end"
                                                />
                                                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey="count" name="Songs" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                            No song data recorded yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Chart 4: Overall Attendance Breakdown (Donut Chart) */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Attendance Overview</h3>
                                    <p className="text-xs text-slate-400">Live check-in proportion</p>
                                </div>
                                <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                    {counts.attendance_rate ?? 0}% Rate
                                </span>
                            </div>

                            <div className="h-64 w-full flex items-center justify-center">
                                {attendancePieData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={attendancePieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={55}
                                                outerRadius={80}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {attendancePieData.map((entry, index) => (
                                                    <Cell key={`pie-cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend
                                                formatter={(value) => <span className="text-xs text-slate-700 font-bold">{value}</span>}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="text-center text-xs text-slate-400">
                                        <CheckCircle2 size={32} className="mx-auto mb-2 text-slate-300" />
                                        <p>No attendance records logged yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 3. BOTTOM SECTION: Upcoming Performances & Choirs Overview */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Upcoming Performances List */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                                        <CalendarDays size={16} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">Upcoming Performances</h3>
                                        <p className="text-xs text-slate-400">Next scheduled ministry services</p>
                                    </div>
                                </div>
                                <Link
                                    to="/admin/performances"
                                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800"
                                >
                                    View All <ChevronRight size={14} />
                                </Link>
                            </div>

                            {upcoming.length === 0 ? (
                                <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                                    <CalendarDays size={28} className="mx-auto mb-2 text-slate-300" />
                                    <p className="font-semibold text-slate-600">No upcoming performances scheduled.</p>
                                    <p className="mt-0.5">Schedule a performance in the Performances tab.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {upcoming.map((p) => (
                                        <div
                                            key={p.id}
                                            className="group rounded-xl border border-slate-100 bg-slate-50/70 p-4 transition-all hover:bg-white hover:shadow-sm hover:border-slate-200"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100 mb-1">
                                                        {p.choir?.name || 'Choir'}
                                                    </span>
                                                    <h4 className="font-bold text-sm text-slate-900 truncate">{p.title}</h4>
                                                </div>
                                            </div>

                                            <div className="mt-2.5 space-y-1 text-xs text-slate-500">
                                                <div className="flex items-center gap-1.5">
                                                    <CalendarDays size={13} className="text-blue-500 shrink-0" />
                                                    <span>{formatDate(p.date)}</span>
                                                    {p.start_time && <span>· {formatTime(p.start_time)}</span>}
                                                </div>
                                                {(p.location || p.venue) && (
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin size={13} className="text-blue-500 shrink-0" />
                                                        <span className="truncate">{p.location || p.venue}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Recent Activity Stream */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                                        <Activity size={16} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">Recent Activity</h3>
                                        <p className="text-xs text-slate-400">System audit trail</p>
                                    </div>
                                </div>
                            </div>

                            {recentActivity.length === 0 ? (
                                <p className="py-8 text-center text-xs text-slate-400">No activity recorded yet.</p>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {recentActivity.map((a, i) => (
                                        <li key={a.id || i} className="py-2.5 flex items-start gap-2.5 text-xs">
                                            <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-slate-800 font-medium leading-snug">
                                                    <span className="font-bold text-slate-900">{a.user_name || 'System'}</span>{' '}
                                                    {a.action}
                                                </p>
                                                <span className="text-[10px] text-slate-400">{formatDate(a.created_at)}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

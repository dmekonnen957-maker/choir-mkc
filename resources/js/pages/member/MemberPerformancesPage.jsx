import { useEffect, useState, useMemo, useCallback } from 'react';
import {
    CalendarDays,
    Music2,
    MapPin,
    Clock,
    CalendarClock,
    CheckCircle2,
    Sparkles,
} from 'lucide-react';
import { api } from '../../axios';
import Alert from '../../components/ui/Alert';
import EmptyState from '../../components/member/EmptyState';
import MemberPerformanceCard from '../../components/member/MemberPerformanceCard';
import PerformanceDetailModal from '../../components/member/PerformanceDetailModal';
import MemberSongLyricsModal from '../../components/member/MemberSongLyricsModal';

const FILTERS = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'past', label: 'Past' },
    { id: 'all', label: 'All' },
];

function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    return d.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatTime(value) {
    if (!value) return '';
    const [h, m] = value.split(':');
    const hour = parseInt(h, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}:${m ?? '00'} ${period}`;
}

export default function MemberPerformancesPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('upcoming');

    // Detail modal state
    const [selectedPerformance, setSelectedPerformance] = useState(null);

    // Lyrics modal state
    const [lyricsSong, setLyricsSong] = useState(null);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        api.get('/member/performances')
            .then((res) => setData(res.data.data))
            .catch((err) => setError('Unable to load performances. Please try again.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const upcoming = useMemo(() => data?.upcoming ?? [], [data]);
    const past = useMemo(() => data?.past ?? [], [data]);
    const stats = data?.stats || { upcoming: 0, this_month: 0, completed: 0 };

    const filtered = useMemo(() => {
        if (filter === 'upcoming') return upcoming;
        if (filter === 'past') return past;
        return [...upcoming, ...past];
    }, [filter, upcoming, past]);

    const nextPerformance = upcoming[0] || null;

    const openDetails = (performance) => {
        setSelectedPerformance(performance);
    };

    const hasChoir = data ? data.has_choir !== false : true;

    if (loading) {
        return (
            <div className="space-y-6">
                {/* Skeleton */}
                <div className="animate-pulse space-y-6">
                    <div className="h-8 w-56 rounded-lg bg-slate-200" />
                    <div className="h-4 w-96 max-w-full rounded bg-slate-200" />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="h-24 rounded-2xl bg-slate-200" />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="h-64 rounded-2xl bg-slate-200" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <Alert variant="error" title="Unable to load performances.">
                    <p>{error}</p>
                    <button
                        type="button"
                        onClick={load}
                        className="mt-3 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                        Try Again
                    </button>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                        <CalendarDays size={22} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Performances</h1>
                        <p className="text-sm text-slate-500">
                            View upcoming performances, prepare your songs, and stay connected with your choir schedule.
                        </p>
                    </div>
                </div>

                {data?.choir?.name && (
                    <p className="mt-2 text-sm font-semibold text-blue-700">{data.choir.name}</p>
                )}
            </div>

            {!hasChoir ? (
                <EmptyState
                    icon={Music2}
                    title="No choir assigned"
                    message="Once you're assigned to a choir, your performances and schedule will appear here."
                />
            ) : (
                <>
                    {/* Quick summary cards */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/60 to-white p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                                    Upcoming
                                </span>
                                <Sparkles size={16} className="text-blue-500" />
                            </div>
                            <p className="mt-2 text-3xl font-black text-slate-900">{stats.upcoming}</p>
                            <span className="text-xs text-slate-400">Scheduled ahead</span>
                        </div>
                        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/60 to-white p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                                    This Month
                                </span>
                                <CalendarClock size={16} className="text-blue-500" />
                            </div>
                            <p className="mt-2 text-3xl font-black text-slate-900">{stats.this_month}</p>
                            <span className="text-xs text-slate-400">Performances in {new Date().toLocaleDateString(undefined, { month: 'long' })}</span>
                        </div>
                        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/60 to-white p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                                    Completed
                                </span>
                                <CheckCircle2 size={16} className="text-blue-500" />
                            </div>
                            <p className="mt-2 text-3xl font-black text-slate-900">{stats.completed}</p>
                            <span className="text-xs text-slate-400">Past performances</span>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                        <div className="flex flex-wrap items-center gap-1.5">
                            {FILTERS.map((f) => (
                                <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => setFilter(f.id)}
                                    className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                                        filter === f.id
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        <span className="px-2 text-xs font-semibold text-slate-400">
                            {filtered.length} {filtered.length === 1 ? 'performance' : 'performances'}
                        </span>
                    </div>

                    {/* CONTENTS */}
                    <>
                        {/* Upcoming highlighted performance */}
                            {filter !== 'past' && nextPerformance && (
                                <section className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-600 to-indigo-600 p-6 text-white shadow-lg">
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-200">
                                        Upcoming Performance
                                    </p>
                                    <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                                        {nextPerformance.title}
                                    </h2>
                                    <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-blue-50 sm:grid-cols-2 lg:grid-cols-4">
                                        <div className="flex items-center gap-2">
                                            <CalendarDays size={16} className="text-blue-200" />
                                            {formatDisplayDate(nextPerformance.date)}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} className="text-blue-200" />
                                            {formatTime(nextPerformance.start_time)}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} className="text-blue-200" />
                                            {nextPerformance.venue || nextPerformance.location || 'TBD'}
                                        </div>
                                        <div className="flex items-center gap-2 font-semibold">
                                            <Music2 size={16} className="text-blue-200" />
                                            {nextPerformance.choir?.name || data?.choir?.name || 'Choir'}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => openDetails(nextPerformance)}
                                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-blue-700 shadow-md transition hover:bg-blue-50 active:scale-95"
                                    >
                                        View Details
                                    </button>
                                </section>
                            )}

                            {/* Performance cards */}
                            {filtered.length === 0 ? (
                                <EmptyState
                                    icon={CalendarDays}
                                    title={
                                        filter === 'upcoming'
                                            ? 'No upcoming performances'
                                            : filter === 'past'
                                              ? 'No past performances'
                                              : 'No performances found'
                                    }
                                    message={
                                        filter === 'upcoming'
                                            ? "Your choir's upcoming performances will appear here."
                                            : filter === 'past'
                                              ? "Your choir's past performances will appear here."
                                              : 'No performances are scheduled for your choir yet.'
                                    }
                                />
                            ) : (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {filtered.map((performance) => (
                                        <MemberPerformanceCard
                                            key={performance.id}
                                            performance={performance}
                                            onView={openDetails}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    </>
                )}

            {/* Performance detail modal */}
            <PerformanceDetailModal
                performance={selectedPerformance}
                songs={selectedPerformance?.songs}
                isLoading={false}
                onClose={() => setSelectedPerformance(null)}
                onViewSongLyrics={(song) => setLyricsSong(song)}
            />

            {/* Song lyrics modal */}
            <MemberSongLyricsModal
                song={lyricsSong}
                isOpen={!!lyricsSong}
                onClose={() => setLyricsSong(null)}
            />
        </div>
    );
}

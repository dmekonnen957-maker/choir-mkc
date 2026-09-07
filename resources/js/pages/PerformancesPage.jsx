import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Search, Filter, Sparkles, Clock, MapPin, ChevronRight, Music, Users, ArrowRight } from 'lucide-react';
import PerformanceCard from '../components/public/PerformanceCard';
import SectionHeading from '../components/public/SectionHeading';
import Reveal from '../components/ui/Reveal';
import EmptyState from '../components/public/EmptyState';
import CoverImage from '../components/public/CoverImage';
import { fetchAllPerformances, fetchChoirs, formatDate, parseDate, getPerformanceStatus } from '../lib/publicApi';
import { FeaturedPerformanceSkeleton, PerformanceCardSkeleton } from '../components/public/PublicSkeletons';

const PROGRAM_TYPES = [
    'All Program Types',
    'Worship',
    'Worship Night',
    'Concert',
    'Special Program',
    'Sunday Service',
    'Christmas',
    'Easter',
    'Youth',
    'Choir Presentation',
    'Other',
];

function FeaturedPerformanceCard({ performance }) {
    if (!performance) return null;

    const choir = performance.choir;
    const choirName = choir?.name || 'YKA M.K.C Choirs and Worship Teams';
    const computedStatus = getPerformanceStatus(performance.date, performance.status);
    const isToday = computedStatus === 'today';
    const parsedDate = parseDate(performance.date);
    const weekday = parsedDate?.toLocaleDateString('en-US', { weekday: 'long' });
    const formattedDate = formatDate(performance.date);
    const posterSrc = performance.poster_url || performance.poster_path;
    const eventType = performance.type || 'Worship';

    return (
        <article className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl transition-all duration-300 hover:shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12">
                {/* Poster / Visual column */}
                <div className="relative min-h-[280px] lg:col-span-5 lg:min-h-[380px] overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900">
                    {posterSrc ? (
                        <CoverImage
                            src={posterSrc}
                            label={performance.title}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center text-white/50">
                            <Music size={56} className="text-blue-400/60 mb-3" />
                            <p className="text-sm font-bold uppercase tracking-widest text-blue-200/80">
                                {choirName}
                            </p>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-slate-950/40" />

                    {/* Top badging */}
                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-white shadow-md backdrop-blur-md">
                            <Sparkles size={13} /> {eventType}
                        </span>
                        {isToday && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md animate-pulse">
                                <span className="h-2 w-2 rounded-full bg-white"></span> Today
                            </span>
                        )}
                    </div>
                </div>

                {/* Information column */}
                <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-7">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 uppercase tracking-wider">
                                Next Upcoming Program
                            </span>
                            {weekday && (
                                <span className="text-xs font-semibold text-slate-500">
                                    • {weekday}
                                </span>
                            )}
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                            {performance.title}
                        </h2>

                        {choirName && (
                            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-blue-600">
                                <Users size={16} />
                                <span>{choirName}</span>
                            </p>
                        )}

                        {performance.description && (
                            <p className="mt-4 text-sm text-slate-600 line-clamp-3 leading-relaxed">
                                {performance.description}
                            </p>
                        )}

                        {/* Metadata Grid */}
                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                                    <CalendarDays size={18} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date</p>
                                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">{formattedDate}</p>
                                </div>
                            </div>

                            {performance.start_time && (
                                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                                        <Clock size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Time</p>
                                        <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                                            {performance.start_time}
                                            {performance.end_time ? ` - ${performance.end_time}` : ''}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {(performance.venue || performance.location) && (
                                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-100 sm:col-span-2">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                                        <MapPin size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location / Venue</p>
                                        <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                                            {performance.venue || performance.location}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
                        <span className="text-xs font-medium text-slate-500 hidden sm:inline">
                            All are welcome to join us in worship
                        </span>
                        <Link
                            to={`/performances/${performance.id}`}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-6 py-3 text-sm font-bold shadow-md transition-all duration-200"
                        >
                            View Program Details
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </div>
        </article>
    );
}

export default function PerformancesPage() {
    const [performances, setPerformances] = useState([]);
    const [choirs, setChoirs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedChoirId, setSelectedChoirId] = useState('');
    const [selectedType, setSelectedType] = useState('All Program Types');

    useEffect(() => {
        Promise.all([
            fetchAllPerformances().catch(() => []),
            fetchChoirs().catch(() => []),
        ])
            .then(([perfData, choirData]) => {
                setPerformances(perfData || []);
                setChoirs(choirData || []);
            })
            .finally(() => setLoading(false));
    }, []);

    // Filter upcoming performances by search, choir, and program type
    const filteredPerformances = useMemo(() => {
        return performances.filter((p) => {
            const matchesChoir = !selectedChoirId || String(p.choir_id) === String(selectedChoirId) || String(p.choir?.id) === String(selectedChoirId);
            const matchesType = selectedType === 'All Program Types' || (p.type && p.type.toLowerCase() === selectedType.toLowerCase());
            const matchesSearch = !searchQuery || 
                (p.title && p.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (p.venue && p.venue.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (p.location && p.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (p.type && p.type.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (p.choir?.name && p.choir.name.toLowerCase().includes(searchQuery.toLowerCase()));

            return matchesChoir && matchesType && matchesSearch;
        });
    }, [performances, selectedChoirId, selectedType, searchQuery]);

    const featuredPerformance = filteredPerformances.length > 0 ? filteredPerformances[0] : null;
    const remainingPerformances = filteredPerformances.length > 1 ? filteredPerformances.slice(1) : [];

    return (
        <div className="bg-slate-50 min-h-screen text-slate-800">
            {/* Hero Header */}
            <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 text-white py-16 sm:py-20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.15),transparent_50%)] pointer-events-none" />
                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-200 border border-blue-400/30 uppercase tracking-wider mb-4">
                        <CalendarDays size={14} className="text-blue-300" />
                        Worship Schedule
                    </span>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                        Upcoming Programs &amp; Events
                    </h1>
                    <p className="mt-4 max-w-2xl text-base sm:text-lg text-blue-100/90 leading-relaxed font-normal">
                        Explore our upcoming choir worship programs, concerts, Sunday services, and special seasonal presentations.
                    </p>
                </div>
            </section>

            {/* Filter and Search Bar */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-7 relative z-20">
                <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-100 flex flex-col lg:flex-row gap-4 items-center justify-between">
                    {/* Search Input */}
                    <div className="relative w-full lg:w-96">
                        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search programs, events, venues..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                        />
                    </div>

                    {/* Dropdown Filters */}
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        {/* Program Type Filter */}
                        <div className="relative flex-1 sm:flex-none">
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="w-full sm:w-52 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                            >
                                {PROGRAM_TYPES.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Choir Group Filter */}
                        <div className="relative flex-1 sm:flex-none">
                            <select
                                value={selectedChoirId}
                                onChange={(e) => setSelectedChoirId(e.target.value)}
                                className="w-full sm:w-56 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                            >
                                <option value="">All Choir Groups</option>
                                {choirs.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </section>

            {/* Performance List Content */}
            <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {loading ? (
                    <div className="space-y-8">
                        <FeaturedPerformanceSkeleton />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
                            <PerformanceCardSkeleton />
                            <PerformanceCardSkeleton />
                            <PerformanceCardSkeleton />
                        </div>
                    </div>
                ) : filteredPerformances.length === 0 ? (
                    <div className="py-16 bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center max-w-2xl mx-auto">
                        <EmptyState
                            icon={CalendarDays}
                            title="NO UPCOMING PROGRAMS"
                            message="There are currently no upcoming choir performances or worship programs. Please check back soon."
                        />
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* 1. Featured Next Upcoming Performance */}
                        {featuredPerformance && (
                            <div>
                                <Reveal>
                                    <FeaturedPerformanceCard performance={featuredPerformance} />
                                </Reveal>
                            </div>
                        )}

                        {/* 2. Remaining Upcoming Programs Grid */}
                        {remainingPerformances.length > 0 && (
                            <div className="pt-6">
                                <div className="mb-8">
                                    <SectionHeading
                                        align="left"
                                        eyebrow="More Schedule"
                                        title={`Upcoming Programs (${remainingPerformances.length})`}
                                        subtitle="Join us for these upcoming choir worship presentations and events."
                                    />
                                </div>
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {remainingPerformances.map((p, i) => (
                                        <Reveal key={p.id} delay={(i % 3) * 60}>
                                            <PerformanceCard performance={p} />
                                        </Reveal>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}

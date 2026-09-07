import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, ChevronRight, CalendarDays, Music, Sparkles } from 'lucide-react';
import { parseDate, formatDate, getPerformanceStatus } from '../../lib/publicApi';
import CoverImage from './CoverImage';

const DEFAULT_CHOIR = 'YKA M.K.C Choirs and Worship Teams';

function DateBadge({ dateValue, isToday = false }) {
    const d = parseDate(dateValue);
    if (!d) {
        return (
            <div
                className="flex aspect-square w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"
                aria-label="Date unavailable"
            >
                <CalendarDays size={18} aria-hidden="true" />
            </div>
        );
    }
    const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const day = d.getDate();
    const label = d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div
            className={`flex aspect-square w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl text-white shadow-sm transition duration-300 ${
                isToday
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-700 ring-2 ring-emerald-400 ring-offset-2'
                    : 'bg-gradient-to-br from-blue-700 to-indigo-900'
            }`}
            aria-label={label}
        >
            <span className="text-[9px] font-bold uppercase tracking-wider opacity-90">{month}</span>
            <span className="text-xl font-extrabold leading-none">{day}</span>
        </div>
    );
}

export default function PerformanceCard({ performance }) {
    const computedStatus = getPerformanceStatus(performance.date, performance.status);
    const isToday = computedStatus === 'today';
    const choir = performance.choir;
    const choirName = choir?.name || DEFAULT_CHOIR;
    const parsedDate = parseDate(performance.date);
    const weekday = parsedDate?.toLocaleDateString('en-US', { weekday: 'long' });
    const posterSrc = performance.poster_url || performance.poster_path;
    const eventType = performance.type || 'Worship';

    return (
        <article className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-200">
            <div>
                {/* Poster / Header Graphic */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900">
                    {posterSrc ? (
                        <CoverImage
                            src={posterSrc}
                            label={performance.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-white/40">
                            <Music size={40} className="text-blue-400/60 mb-2" />
                            <span className="text-xs font-bold uppercase tracking-widest text-blue-200/60">
                                {choirName}
                            </span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                    {/* Floating Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center rounded-full bg-blue-600/90 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow backdrop-blur-md">
                            {eventType}
                        </span>
                        {isToday && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow animate-pulse">
                                <span className="h-1.5 w-1.5 rounded-full bg-white"></span> Today
                            </span>
                        )}
                    </div>

                    <div className="absolute bottom-3 left-4 right-4">
                        <p className="text-xs font-medium text-blue-200 truncate">{choirName}</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <DateBadge dateValue={performance.date} isToday={isToday} />
                        <div className="min-w-0 flex-1">
                            {weekday && (
                                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                                    {weekday}
                                </p>
                            )}
                            <h3 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
                                {performance.title}
                            </h3>
                        </div>
                    </div>

                    {performance.description && (
                        <p className="mt-3 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {performance.description}
                        </p>
                    )}

                    {/* Metadata items */}
                    <div className="mt-4 space-y-2 text-xs text-slate-600">
                        {performance.start_time && (
                            <div className="flex items-center gap-2">
                                <Clock size={14} className="text-blue-600 shrink-0" />
                                <span>
                                    {performance.start_time}
                                    {performance.end_time ? ` - ${performance.end_time}` : ''}
                                </span>
                            </div>
                        )}
                        {(performance.venue || performance.location) && (
                            <div className="flex items-center gap-2">
                                <MapPin size={14} className="text-blue-600 shrink-0" />
                                <span className="truncate">{performance.venue || performance.location}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action footer */}
            <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                <Link
                    to={`/performances/${performance.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-4 py-2.5 text-xs sm:text-sm font-bold shadow-sm transition-all duration-200"
                >
                    View Event
                    <ChevronRight size={15} />
                </Link>
            </div>
        </article>
    );
}


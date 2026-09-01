import { Link } from 'react-router-dom';
import { MapPin, Clock, ChevronRight, CalendarDays } from 'lucide-react';
import { parseDate } from '../../lib/publicApi';

const DEFAULT_CHOIR = 'EKA MKC Choirs and Worship Teams';

/**
 * DateBadge — attractive date display with a blue gradient accent,
 * a small calendar icon, large day number, and month label.
 * Reuses parseDate(); renders a neutral placeholder when the date is invalid.
 */
function DateBadge({ dateValue }) {
    const d = parseDate(dateValue);
    if (!d) {
        return (
            <div
                className="flex aspect-square w-16 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400"
                aria-label="Date unavailable"
            >
                <CalendarDays size={20} aria-hidden="true" />
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
            className="flex aspect-square w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl bg-gradient-to-br from-blue-700 to-blue-900 text-white shadow-md"
            aria-label={label}
        >
            <CalendarDays size={12} aria-hidden="true" />
            <span className="text-[10px] font-semibold uppercase tracking-wide">{month}</span>
            <span className="text-3xl font-extrabold leading-none">{day}</span>
        </div>
    );
}

/**
 * StatusBadge — small pill showing Upcoming / Past, driven by `variant`.
 */
function StatusBadge({ variant }) {
    const past = variant === 'past';
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${
                past
                    ? 'bg-slate-100 text-slate-600 ring-slate-200'
                    : 'bg-blue-50 text-blue-700 ring-blue-100'
            }`}
            aria-label={past ? 'Past' : 'Upcoming'}
        >
            {past ? 'Past' : 'Upcoming'}
        </span>
    );
}

export default function PerformanceCard({ performance, variant = 'upcoming' }) {
    const past = variant === 'past';
    const choir = performance.choir;
    const choirName = choir?.name || DEFAULT_CHOIR;
    const parsedDate = parseDate(performance.date);
    const weekday = parsedDate?.toLocaleDateString('en-US', { weekday: 'long' });

    // ---- PAST variant (compact single-row) ----
    if (past) {
        return (
            <Link
                to={`/performances/${performance.id}`}
                className="group flex items-center gap-3 overflow-hidden rounded-2xl border border-slate-100 bg-white px-4 py-3 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:gap-4 sm:px-5"
                aria-label={`View past performance: ${performance.title}`}
            >
                <DateBadge dateValue={performance.date} />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="truncate text-base font-semibold text-ink-900">
                            {performance.title}
                        </h3>
                        <StatusBadge variant={variant} />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-ink-500">
                                                {choirName}
                        {performance.location ? ` · ${performance.location}` : ''}
                    </p>
                </div>
                <ChevronRight
                    size={16}
                    className="shrink-0 text-slate-300 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                />
            </Link>
        );
    }

    // ---- UPCOMING variant (rich card) ----
    return (
        <article className="group flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">
            <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start">
                {/* Date badge + status badge */}
                <div className="flex items-start justify-between gap-3 sm:flex-col sm:items-start">
                    <DateBadge dateValue={performance.date} />
                    <StatusBadge variant={variant} />
                </div>

                {/* Main content */}
                <div className="min-w-0">
                    {weekday && (
                        <p className="text-xs font-medium uppercase tracking-wide text-ink-600">
                            {weekday}
                        </p>
                    )}
                    <h3 className="mt-1 text-xl font-bold leading-tight text-ink-900 truncate">
                        {performance.title}
                    </h3>
                    <p className="mt-1 text-sm text-ink-600 truncate">
                        {choirName}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-600">
                        {performance.start_time && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs">
                                <Clock size={14} className="text-blue-600" aria-hidden="true" />
                                {performance.start_time}
                            </span>
                        )}
                        {performance.location && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs">
                                <MapPin size={14} className="text-blue-600" aria-hidden="true" />
                                {performance.location}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* View details action */}
            <div className="border-t border-slate-100 px-5 py-3">
                <Link
                    to={`/performances/${performance.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition-all duration-200 hover:border-blue-200 hover:bg-blue-100 hover:text-blue-800"
                    aria-label={`View details for ${performance.title}`}
                >
                    View Performance Details
                    <ChevronRight
                        size={16}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                        aria-hidden="true"
                    />
                </Link>
            </div>
        </article>
    );
}

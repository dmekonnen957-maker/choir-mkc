import { Link } from 'react-router-dom';
import { MapPin, Clock, ChevronRight, CalendarDays } from 'lucide-react';
import { parseDate } from '../../lib/publicApi';

function DateBadge({ dateValue }) {
    const d = parseDate(dateValue);
    if (!d) {
        return (
            <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <CalendarDays size={18} />
            </div>
        );
    }
    const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const day = d.getDate();
    return (
        <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-blue-700 text-white shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wide">{month}</span>
            <span className="text-2xl font-bold leading-none">{day}</span>
        </div>
    );
}

export default function PerformanceCard({ performance, variant = 'upcoming' }) {
    const choir = performance.choir;
    const past = variant === 'past';

    if (past) {
        return (
            <Link
                to={`/performances/${performance.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 transition-all duration-300 hover:border-blue-200 hover:shadow-md"
            >
                <DateBadge dateValue={performance.date} />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{performance.title}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                        {choir?.name}
                        {performance.location ? ` · ${performance.location}` : ''}
                    </p>
                </div>
                <ChevronRight size={18} className="shrink-0 text-slate-300 transition-transform group-hover:translate-x-1" />
            </Link>
        );
    }

    return (
        <div className="group flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">
            <div className="flex gap-4 p-5">
                <DateBadge dateValue={performance.date} />
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                        {parseDate(performance.date)?.toLocaleDateString('en-US', { weekday: 'long' })}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                        {performance.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">{choir?.name || 'EKA MKC Choirs and Worship Teams'}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                        {performance.start_time && (
                            <span className="inline-flex items-center gap-1">
                                <Clock size={15} className="text-blue-500" />
                                {performance.start_time}
                            </span>
                        )}
                        {performance.location && (
                            <span className="inline-flex items-center gap-1">
                                <MapPin size={15} className="text-blue-500" />
                                {performance.location}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div className="border-t border-slate-100 px-5 py-3">
                <Link
                    to={`/performances/${performance.id}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800"
                >
                    View Details
                    <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
            </div>
        </div>
    );
}

import { CalendarDays, Clock, MapPin, Music2, ArrowRight, Church } from 'lucide-react';

const STATUS_CONFIG = {
    scheduled: { label: 'Upcoming', dot: 'bg-blue-500', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    confirmed: { label: 'Confirmed', dot: 'bg-blue-500', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    completed: { label: 'Completed', dot: 'bg-slate-400', bg: 'bg-slate-100 text-slate-600 border-slate-200' },
    cancelled: { label: 'Cancelled', dot: 'bg-red-500', bg: 'bg-red-50 text-red-700 border-red-200' },
    postponed: { label: 'Postponed', dot: 'bg-amber-500', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
};

function formatDateParts(dateStr) {
    if (!dateStr) return { day: '--', month: '---', year: '' };
    const [year, month, day] = dateStr.split('-');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return {
        day: day || '--',
        month: monthNames[(parseInt(month, 10) || 1) - 1] || '---',
        year: year || '',
    };
}

function formatDisplayDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const [year, month, day] = dateStr.split('-');
        const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
        return d.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

function formatTime(value) {
    if (!value) return '';
    const [h, m] = value.split(':');
    const hour = parseInt(h, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}:${m ?? '00'} ${period}`;
}

export default function MemberPerformanceCard({ performance, onView }) {
    const statusCfg = STATUS_CONFIG[performance.status] || STATUS_CONFIG.scheduled;
    const { day, month } = formatDateParts(performance.date);
    const isToday = performance.date === new Date().toISOString().slice(0, 10);
    const isUpcoming = performance.status === 'scheduled' || performance.status === 'confirmed';

    return (
        <div
            onClick={() => onView(performance)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onView(performance);
                }
            }}
            className="group flex w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
            {/* Top date band + status */}
            <div className="flex items-stretch border-b border-slate-100">
                <div
                    className={`flex w-20 shrink-0 flex-col items-center justify-center py-4 ${
                        isToday ? 'bg-blue-600 text-white' : 'bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700'
                    }`}
                >
                    <span className={`text-2xl font-black leading-none ${isToday ? 'text-white' : 'text-blue-700'}`}>
                        {day}
                    </span>
                    <span className={`mt-1 text-[11px] font-bold uppercase tracking-widest ${isToday ? 'text-blue-100' : 'text-blue-500'}`}>
                        {month}
                    </span>
                </div>

                <div className="flex flex-1 items-center justify-between gap-2 px-4 py-3">
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${statusCfg.bg}`}
                    >
                        <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                        {statusCfg.label}
                    </span>

                    {performance.song_count > 0 && (
                        <span className="hidden items-center gap-1 text-xs font-semibold text-slate-400 sm:inline-flex">
                            <Music2 size={13} />
                            {performance.song_count} {performance.song_count === 1 ? 'song' : 'songs'}
                        </span>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col p-4">
                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {performance.title}
                </h3>

                {performance.choir?.name && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                        <Church size={13} />
                        {performance.choir.name}
                    </p>
                )}

                <div className="mt-3 space-y-1.5 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                        <CalendarDays size={15} className="shrink-0 text-slate-400" />
                        <span>{formatDisplayDate(performance.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock size={15} className="shrink-0 text-slate-400" />
                        <span>{formatTime(performance.start_time)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin size={15} className="shrink-0 text-slate-400" />
                        <span className="truncate">{performance.venue || performance.location || 'TBD'}</span>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    {isUpcoming ? (
                        <span className="text-xs font-bold uppercase tracking-wide text-emerald-600">
                            Upcoming
                        </span>
                    ) : (
                        <span className="text-xs text-slate-400">Completed</span>
                    )}

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onView(performance);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
                    >
                        View Performance
                        <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}

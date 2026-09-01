import {
    CalendarDays,
    Clock,
    MapPin,
    Church,
    Music2,
    BookOpen,
    CalendarClock,
    CheckCircle2,
    UserCheck,
    UserX,
    HelpCircle,
} from 'lucide-react';
import Modal from '../ui/Modal';
import LoadingSpinner from '../ui/LoadingSpinner';
import Alert from '../ui/Alert';

const STATUS_CONFIG = {
    scheduled: { label: 'Upcoming', dot: 'bg-blue-500', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    confirmed: { label: 'Confirmed', dot: 'bg-blue-500', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    completed: { label: 'Completed', dot: 'bg-slate-400', bg: 'bg-slate-100 text-slate-600 border-slate-200' },
    cancelled: { label: 'Cancelled', dot: 'bg-red-500', bg: 'bg-red-50 text-red-700 border-red-200' },
    postponed: { label: 'Postponed', dot: 'bg-amber-500', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const PARTICIPATION_CONFIG = {
    participated: { label: 'Participated', dot: 'bg-emerald-500', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    absent: { label: 'Not Participated', dot: 'bg-red-500', bg: 'bg-red-50 text-red-700 border-red-200', icon: UserX },
    excused: { label: 'Excused', dot: 'bg-amber-500', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: UserCheck },
    late: { label: 'Late', dot: 'bg-amber-500', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: UserCheck },
};

function formatDisplayDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const [year, month, day] = dateStr.split('-');
        const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
        return d.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
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

export default function PerformanceDetailModal({ performance, songs, isLoading, onClose, onViewSongLyrics }) {
    if (!performance) return null;

    const statusCfg = STATUS_CONFIG[performance.status] || STATUS_CONFIG.scheduled;
    const part = performance.participation || {};
    const partCfg = PARTICIPATION_CONFIG[part.participation_status];

    return (
        <Modal open={!!performance} onClose={onClose} size="lg" labelledBy="performance-detail-title">
            <div className="space-y-6">
                {/* Header */}
                <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900" id="performance-detail-title">
                            {performance.title}
                        </h2>
                        <div className="flex flex-wrap gap-1.5">
                            <span
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${statusCfg.bg}`}
                            >
                                <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                                {statusCfg.label}
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                            <CalendarDays size={16} className="shrink-0 text-blue-600" />
                            {formatDisplayDate(performance.date)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                            <Clock size={16} className="shrink-0 text-blue-600" />
                            {formatTime(performance.start_time)}
                            {performance.end_time ? ` - ${formatTime(performance.end_time)}` : ''}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
                            <MapPin size={16} className="shrink-0 text-blue-600" />
                            {[performance.venue, performance.location].filter(Boolean).join(' · ') || 'TBD'}
                        </div>
                        {performance.choir?.name && (
                            <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 sm:col-span-2">
                                <Church size={16} className="shrink-0" />
                                {performance.choir.name}
                            </div>
                        )}
                    </div>

                    {performance.description && (
                        <p className="mt-4 border-t border-blue-100/80 pt-3 text-sm leading-relaxed text-slate-600">
                            {performance.description}
                        </p>
                    )}
                </div>

                {/* Participation */}
                <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                        Your Participation
                    </h3>
                    {partCfg ? (
                        <div
                            className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${partCfg.bg}`}
                        >
                            <partCfg.icon size={14} />
                            {partCfg.label}
                        </div>
                    ) : (
                        <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500">
                            <HelpCircle size={14} />
                            Not Yet Confirmed
                        </span>
                    )}
                    <p className="mt-2 text-xs text-slate-400">
                        {part.expected === true
                            ? 'You are expected to participate in this performance.'
                            : part.expected === false
                              ? "You are not marked as expected for this performance."
                              : 'Your participation will be confirmed closer to the date.'}
                    </p>
                </div>

                {/* Songs to prepare */}
                <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                            Songs to Prepare
                        </h3>
                        {songs?.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600">
                                <Music2 size={13} />
                                {songs.length} {songs.length === 1 ? 'song' : 'songs'}
                            </span>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <LoadingSpinner size={30} className="text-blue-600" />
                        </div>
                    ) : songs && songs.length > 0 ? (
                        <ul className="mt-3 space-y-2">
                            {songs.map((song, idx) => (
                                <li
                                    key={song.id}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 transition hover:border-blue-200 hover:bg-blue-50/40"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-[11px] font-black text-white">
                                            {idx + 1}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate font-bold text-slate-900">{song.title}</p>
                                            {song.artist && (
                                                <p className="truncate text-xs text-slate-500">{song.artist}</p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => onViewSongLyrics(song)}
                                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:scale-95"
                                    >
                                        <BookOpen size={14} className="text-blue-600" />
                                        View Lyrics
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="mt-3 flex flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/30 py-8 text-center">
                            <Music2 size={28} className="text-blue-300" />
                            <p className="mt-2 text-sm font-semibold text-slate-600">
                                No songs have been assigned to this performance yet.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}

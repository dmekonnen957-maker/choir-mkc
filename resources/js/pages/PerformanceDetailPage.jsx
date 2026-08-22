import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock, MapPin, Users, Sparkles } from 'lucide-react';
import ChoirArtwork from '../components/landing/ChoirArtwork';
import Reveal from '../components/ui/Reveal';
import DemoBadge from '../components/ui/DemoBadge';
import { getPerformanceById, getSongsForPerformance, getChoirById, isSameDay } from '../data/landingData';
import { formatLongDate, formatTime } from '../data/dateUtils';

export default function PerformanceDetailPage() {
    const { id } = useParams();
    const performance = getPerformanceById(id);

    if (!performance) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-24 text-center">
                <h1 className="text-2xl font-semibold text-blue-900">Performance not found</h1>
                <Link to="/performances" className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                    Back to performances
                </Link>
            </div>
        );
    }

    const choir = getChoirById(performance.choirId);
    const songList = getSongsForPerformance(performance);
    const isToday = isSameDay(performance.date);

    const detail = (icon, label, value) => (
        <div className="flex items-start gap-2.5">
            <span className="mt-0.5 text-blue-400">{icon}</span>
            <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</div>
                <div className="font-medium text-blue-900">{value}</div>
            </div>
        </div>
    );

    return (
        <>
            <section className="relative overflow-hidden bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 pb-12 pt-12 sm:pb-16">
                <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
                <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <Link to="/performances" className="inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-white">
                        <ArrowLeft size={16} /> All performances
                    </Link>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <h1 className="text-3xl font-semibold text-white sm:text-4xl">{performance.title}</h1>
                        {isToday && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                                <Sparkles size={13} /> Today
                            </span>
                        )}
                        <DemoBadge className="bg-white/15 text-white ring-white/30" />
                    </div>
                </div>
            </section>

            <section className="bg-surface py-12 sm:py-16">
                <div className="mx-auto grid max-w-5xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.3fr_1fr] lg:px-8">
                    <Reveal direction="up">
                        <p className="text-lg leading-relaxed text-ink-700">{performance.description}</p>

                        {isToday && (
                            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/70 p-5">
                                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                                    <Sparkles size={15} className="text-blue-500" /> Today’s Songs
                                </div>
                                <p className="mt-2 text-sm text-ink-600">
                                    Open any song below to read its public lyrics.
                                </p>
                            </div>
                        )}

                        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-blue-600">
                            Songs for This Performance
                        </h2>
                        <ul className="mt-3 divide-y divide-blue-100 rounded-2xl border border-blue-100 bg-white">
                            {songList.map((song, i) => (
                                <li key={song.id}>
                                    <Link
                                        to={`/songs/${song.id}`}
                                        className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-blue-50"
                                    >
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate font-medium text-blue-900">{song.title}</span>
                                            <span className="block truncate text-sm text-ink-500">{song.composer}</span>
                                        </span>
                                        <span className="text-sm font-medium text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
                                            View →
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        {choir && (
                            <Link
                                to={`/choirs/${choir.id}`}
                                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
                            >
                                <Users size={16} /> View {choir.name}
                            </Link>
                        )}
                    </Reveal>

                    <Reveal direction="right">
                        <div className="overflow-hidden rounded-3xl shadow-lg ring-1 ring-blue-100">
                            <ChoirArtwork
                                variant={isToday ? 'stage' : 'rows'}
                                seed={performance.id * 5 + 2}
                                className="aspect-[4/3] w-full"
                                label={performance.title}
                            />
                        </div>
                        <div className="mt-5 grid grid-cols-2 gap-4 rounded-2xl border border-blue-100 bg-white p-5">
                            {detail(<CalendarDays size={18} />, 'Date', formatLongDate(performance.date))}
                            {detail(<Clock size={18} />, 'Time', formatTime(performance.time))}
                            {detail(<MapPin size={18} />, 'Venue', performance.venue)}
                            {detail(<Users size={18} />, 'Choir', choir?.name ?? '—')}
                        </div>
                    </Reveal>
                </div>
            </section>
        </>
    );
}

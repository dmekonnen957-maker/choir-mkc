import { Link } from 'react-router-dom';
import { CalendarDays, Clock, MapPin, Users, ArrowRight } from 'lucide-react';
import Reveal from '../ui/Reveal';
import DemoBadge from '../ui/DemoBadge';
import ChoirArtwork from './ChoirArtwork';
import { getChoirById } from '../../data/landingData';
import { formatLongDate, formatTime, isSameDay } from '../../data/dateUtils';

export default function PerformanceCard({ performance, index = 0, showBadge = true }) {
    const choir = getChoirById(performance.choirId);
    const today = isSameDay(performance.date);

    return (
        <Reveal direction="up" delay={(index % 3) * 100}>
            <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-blue-100 transition-shadow duration-300 hover:shadow-xl">
                <div className="relative overflow-hidden">
                    <Link to={`/performances/${performance.id}`} className="block">
                        <div className="h-full w-full transition-transform duration-700 group-hover:scale-105">
                            <ChoirArtwork
                                variant={today ? 'stage' : 'rows'}
                                seed={performance.id * 5 + 2}
                                className="aspect-[16/9] w-full"
                                label={performance.title}
                            />
                        </div>
                    </Link>
                    {showBadge && today && (
                        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow">
                            Today
                        </span>
                    )}
                </div>
                <div className="flex flex-1 flex-col p-6">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
                        <span className="inline-flex items-center gap-1.5">
                            <CalendarDays size={15} className="text-blue-400" />
                            {formatLongDate(performance.date)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Clock size={15} className="text-blue-400" />
                            {formatTime(performance.time)}
                        </span>
                    </div>
                    <h3 className="mt-3 text-xl font-semibold text-blue-900">{performance.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-500">
                        <span className="inline-flex items-center gap-1.5">
                            <MapPin size={15} className="text-blue-400" /> {performance.venue}
                        </span>
                        {choir && (
                            <span className="inline-flex items-center gap-1.5">
                                <Users size={15} className="text-blue-400" /> {choir.name}
                            </span>
                        )}
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-600">
                        {performance.description}
                    </p>
                    <Link
                        to={`/performances/${performance.id}`}
                        className="mt-5 inline-flex items-center gap-2 self-start rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50"
                    >
                        View Performance
                        <ArrowRight size={16} />
                    </Link>
                </div>
            </article>
        </Reveal>
    );
}

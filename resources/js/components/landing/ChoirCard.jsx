import { Link } from 'react-router-dom';
import { Users, MapPin, ArrowRight } from 'lucide-react';
import Reveal from '../ui/Reveal';
import DemoBadge from '../ui/DemoBadge';
import ChoirArtwork from './ChoirArtwork';

export default function ChoirCard({ choir, index = 0, showBadge = true }) {
    return (
        <Reveal direction="up" delay={(index % 3) * 100}>
            <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-blue-100 transition-shadow duration-300 hover:shadow-xl">
                <Link to={`/choirs/${choir.id}`} className="relative block aspect-[4/3] overflow-hidden">
                    <div className="h-full w-full transition-transform duration-700 group-hover:scale-105">
                        <ChoirArtwork variant={choir.art.variant} seed={choir.art.seed} className="h-full w-full" label={`${choir.name} choir`} />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-900/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    {showBadge && (
                        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-blue-800 shadow-sm">
                            Est. {choir.foundedYear}
                        </span>
                    )}
                </Link>
                <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-xl font-semibold text-blue-900">{choir.name}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-600">
                        {choir.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-500">
                        {choir.location && (
                            <span className="inline-flex items-center gap-1.5">
                                <MapPin size={15} className="text-blue-400" /> {choir.location}
                            </span>
                        )}
                        {choir.membersCount != null && (
                            <span className="inline-flex items-center gap-1.5">
                                <Users size={15} className="text-blue-400" /> {choir.membersCount} members
                            </span>
                        )}
                    </div>
                    <Link
                        to={`/choirs/${choir.id}`}
                        className="mt-5 inline-flex items-center gap-2 self-start rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50"
                    >
                        View Choir
                        <ArrowRight size={16} />
                    </Link>
                </div>
            </article>
        </Reveal>
    );
}

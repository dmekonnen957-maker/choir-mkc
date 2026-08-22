import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Users, CalendarDays, Music4, History as HistoryIcon, Images } from 'lucide-react';
import ChoirArtwork from '../components/landing/ChoirArtwork';
import SongCard from '../components/landing/SongCard';
import PerformanceCard from '../components/landing/PerformanceCard';
import Timeline from '../components/landing/Timeline';
import Modal from '../components/ui/Modal';
import Reveal from '../components/ui/Reveal';
import DemoBadge from '../components/ui/DemoBadge';
import {
    getChoirById,
    getChoirSongs,
    getChoirPerformances,
    getChoirGallery,
    getChoirMilestones,
} from '../data/landingData';

const SECTIONS = [
    { id: 'overview', label: 'Overview', icon: Music4 },
    { id: 'songs', label: 'Songs', icon: Music4 },
    { id: 'performances', label: 'Performances', icon: CalendarDays },
    { id: 'history', label: 'History', icon: HistoryIcon },
    { id: 'gallery', label: 'Gallery', icon: Images },
];

function scrollTo(id) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}

export default function ChoirDetailPage() {
    const { id } = useParams();
    const choir = getChoirById(id);
    const [lightbox, setLightbox] = useState(null);

    if (!choir) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-24 text-center">
                <h1 className="text-2xl font-semibold text-blue-900">Choir not found</h1>
                <p className="mt-3 text-ink-600">We couldn’t find that choir.</p>
                <Link to="/choirs" className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                    Back to choirs
                </Link>
            </div>
        );
    }

    const songs = getChoirSongs(choir.id);
    const performances = getChoirPerformances(choir.id);
    const gallery = getChoirGallery(choir.id);
    const milestones = getChoirMilestones(choir.id);

    return (
        <>
            {/* COVER */}
            <section className="relative">
                <div className="h-56 w-full sm:h-72 lg:h-80">
                    <ChoirArtwork variant={choir.art.variant} seed={choir.art.seed} className="h-full w-full" label={`${choir.name} choir`} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-blue-950/85 via-blue-950/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0">
                    <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
                        <Link to="/choirs" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-white">
                            <ArrowLeft size={16} /> All choirs
                        </Link>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-semibold text-white sm:text-4xl">{choir.name}</h1>
                            <DemoBadge className="bg-white/15 text-white ring-white/30" />
                        </div>
                        <p className="mt-2 max-w-2xl text-blue-100">{choir.description}</p>
                    </div>
                </div>
            </section>

            {/* SUB NAV */}
            <div className="sticky top-[68px] z-40 border-b border-blue-100 bg-white/95 backdrop-blur">
                <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8" aria-label="Choir sections">
                    {SECTIONS.map((s) => (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => scrollTo(s.id)}
                            className="inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-3 text-sm font-medium text-ink-600 transition-colors hover:text-blue-700"
                        >
                            <s.icon size={15} className="text-blue-400" />
                            {s.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                {/* OVERVIEW */}
                <section id="overview" className="scroll-mt-28">
                    <Reveal>
                        <h2 className="text-2xl font-semibold text-blue-900">Overview</h2>
                        <p className="mt-4 max-w-3xl leading-relaxed text-ink-600">{choir.summary}</p>
                        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {choir.location && (
                                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                                    <div className="flex items-center gap-2 text-blue-600"><MapPin size={16} /> Location</div>
                                    <div className="mt-1 font-semibold text-blue-900">{choir.location}</div>
                                </div>
                            )}
                            {choir.leader && (
                                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                                    <div className="flex items-center gap-2 text-blue-600"><Users size={16} /> Leader</div>
                                    <div className="mt-1 font-semibold text-blue-900">{choir.leader}</div>
                                </div>
                            )}
                            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                                <div className="flex items-center gap-2 text-blue-600"><Users size={16} /> Members</div>
                                <div className="mt-1 font-semibold text-blue-900">{choir.membersCount}</div>
                            </div>
                            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                                <div className="flex items-center gap-2 text-blue-600"><CalendarDays size={16} /> Founded</div>
                                <div className="mt-1 font-semibold text-blue-900">{choir.foundedYear}</div>
                            </div>
                        </div>
                    </Reveal>
                </section>

                {/* SONGS */}
                <section id="songs" className="scroll-mt-28 py-14">
                    <h2 className="text-2xl font-semibold text-blue-900">Songs</h2>
                    {songs.length ? (
                        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {songs.map((s, i) => (
                                <SongCard key={s.id} song={s} index={i} />
                            ))}
                        </div>
                    ) : (
                        <p className="mt-4 text-ink-500">No public songs yet.</p>
                    )}
                </section>

                {/* PERFORMANCES */}
                <section id="performances" className="scroll-mt-28 border-t border-blue-100 py-14">
                    <h2 className="text-2xl font-semibold text-blue-900">Performances</h2>
                    {performances.length ? (
                        <div className="mt-6 grid gap-8 lg:grid-cols-2">
                            {performances.map((p, i) => (
                                <PerformanceCard key={p.id} performance={p} index={i} />
                            ))}
                        </div>
                    ) : (
                        <p className="mt-4 text-ink-500">No public performances yet.</p>
                    )}
                </section>

                {/* HISTORY */}
                <section id="history" className="scroll-mt-28 border-t border-blue-100 py-14">
                    <h2 className="text-2xl font-semibold text-blue-900">History</h2>
                    <p className="mt-2 max-w-2xl text-ink-600">Milestones from {choir.name}’s journey.</p>
                    <div className="mt-8">
                        <Timeline milestones={milestones} />
                    </div>
                    <div className="mt-6">
                        <Link to={`/choirs/${choir.id}/history`} className="text-sm font-semibold text-blue-700 hover:text-blue-900">
                            View full choir history →
                        </Link>
                    </div>
                </section>

                {/* GALLERY */}
                <section id="gallery" className="scroll-mt-28 border-t border-blue-100 py-14">
                    <h2 className="text-2xl font-semibold text-blue-900">Gallery</h2>
                    <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
                        {gallery.map((g) => (
                            <button
                                key={g.id}
                                type="button"
                                onClick={() => setLightbox(g)}
                                className="group relative block overflow-hidden rounded-2xl text-left ring-1 ring-blue-100"
                            >
                                <div className="transition-transform duration-700 group-hover:scale-105">
                                    <ChoirArtwork variant={g.art.variant} seed={g.art.seed} className="aspect-[4/3] w-full" label={g.title} />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                                <span className="absolute bottom-3 left-3 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                                    {g.title}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>
            </div>

            <Modal open={lightbox !== null} onClose={() => setLightbox(null)} title={lightbox?.title ?? 'Photo'} size="lg">
                {lightbox && (
                    <div className="overflow-hidden rounded-2xl ring-1 ring-blue-100">
                        <ChoirArtwork variant={lightbox.art.variant} seed={lightbox.art.seed} className="aspect-[3/2] w-full" label={lightbox.title} />
                    </div>
                )}
            </Modal>
        </>
    );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Music2, CalendarDays, History as HistoryIcon, Users } from 'lucide-react';
import HeroSection from '../components/public/HeroSection';
import ChoirCard from '../components/public/ChoirCard';
import SongCard from '../components/public/SongCard';
import PerformanceCard from '../components/public/PerformanceCard';
import SectionHeading from '../components/public/SectionHeading';
import Reveal from '../components/ui/Reveal';
import EmptyState from '../components/public/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { fetchChoirs, fetchAllSongs, fetchAllPerformances, isUpcoming } from '../lib/publicApi';

export default function HomePage() {
    const [loading, setLoading] = useState(true);
    const [choirs, setChoirs] = useState([]);
    const [songs, setSongs] = useState([]);
    const [performances, setPerformances] = useState([]);

    useEffect(() => {
        let active = true;
        Promise.all([fetchChoirs(), fetchAllSongs(), fetchAllPerformances()])
            .then(([c, s, p]) => {
                if (!active) return;
                setChoirs(c);
                setSongs(s);
                setPerformances(p);
            })
            .catch(() => {})
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, []);

    const featuredChoirs = choirs.slice(0, 3);
    const featuredSongs = songs.slice(0, 3);
    const upcoming = performances.filter((p) => isUpcoming(p.date)).slice(0, 3);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <LoadingSpinner text="Loading..." />
            </div>
        );
    }

    return (
        <div className="bg-white">
            <HeroSection featuredChoir={choirs[0] ?? null} />

            {/* MEET OUR CHOIRS */}
            <section className="bg-white py-20 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <Reveal>
                        <SectionHeading
                            eyebrow="Our Community"
                            title="Meet Our Choirs"
                            subtitle="Explore the voices, people, and stories behind Choir MKC."
                        />
                    </Reveal>
                    <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {featuredChoirs.map((choir, i) => (
                            <Reveal key={choir.id} delay={i * 80}>
                                <ChoirCard choir={choir} />
                            </Reveal>
                        ))}
                    </div>
                    {featuredChoirs.length === 0 && (
                        <div className="mt-10">
                            <EmptyState
                                icon={Users}
                                title="No choirs are currently available."
                                message="Check back soon as our choirs continue to grow."
                            />
                        </div>
                    )}
                    {choirs.length > 3 && (
                        <div className="mt-12 flex justify-center">
                            <Link
                                to="/choirs"
                                className="inline-flex items-center gap-2 rounded-full bg-blue-700 px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800"
                            >
                                Explore All Choirs
                                <ArrowRight size={18} />
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* UPCOMING PERFORMANCES */}
            <section className="bg-blue-50/50 py-20 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <Reveal>
                        <SectionHeading
                            eyebrow="Events"
                            title="Upcoming Performances"
                            subtitle="Be part of our next gathering of worship and song."
                        />
                    </Reveal>
                    <div className="mt-12 grid gap-8 lg:grid-cols-2">
                        {upcoming.map((p, i) => (
                            <Reveal key={p.id} delay={i * 80}>
                                <PerformanceCard performance={p} variant="upcoming" />
                            </Reveal>
                        ))}
                    </div>
                    {upcoming.length === 0 && (
                        <div className="mt-10">
                            <EmptyState
                                icon={CalendarDays}
                                title="No upcoming performances."
                                message="We are preparing our next service. Please check back soon."
                            />
                        </div>
                    )}
                    {performances.length > 0 && (
                        <div className="mt-12 flex justify-center">
                            <Link
                                to="/performances"
                                className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-7 py-3.5 text-sm font-semibold text-blue-700 transition-colors hover:border-blue-300"
                            >
                                View All Performances
                                <ArrowRight size={18} />
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* FEATURED SONGS */}
            <section className="bg-white py-20 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <Reveal>
                        <SectionHeading
                            eyebrow="Music"
                            title="Featured Songs"
                            subtitle="Listen, discover, and experience the songs of our choirs."
                        />
                    </Reveal>
                    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {featuredSongs.map((s, i) => (
                            <Reveal key={s.id} delay={i * 80}>
                                <SongCard song={s} />
                            </Reveal>
                        ))}
                    </div>
                    {featuredSongs.length === 0 && (
                        <div className="mt-10">
                            <EmptyState
                                icon={Music2}
                                title="No songs available yet."
                                message="Our choir library is being built. Visit again soon."
                            />
                        </div>
                    )}
                    {songs.length > 3 && (
                        <div className="mt-12 flex justify-center">
                            <Link
                                to="/songs"
                                className="inline-flex items-center gap-2 rounded-full bg-blue-700 px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800"
                            >
                                Explore Song Archive
                                <ArrowRight size={18} />
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* HISTORY TEASER */}
            <section className="bg-blue-50/50 py-20 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <Reveal>
                        <div className="overflow-hidden rounded-[2.5rem] border border-blue-100 bg-white px-8 py-14 text-center shadow-sm sm:px-16">
                            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 ring-1 ring-inset ring-blue-100">
                                <HistoryIcon size={14} /> Our Heritage
                            </span>
                            <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                                Explore Our History
                            </h2>
                            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-500">
                                Trace the journey of Choir MKC — the milestones, memories, and moments of
                                faithful service that shaped who we are today.
                            </p>
                            <Link
                                to="/history"
                                className="mt-8 inline-flex items-center gap-2 rounded-full bg-blue-700 px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800"
                            >
                                View History
                                <ArrowRight size={18} />
                            </Link>
                        </div>
                    </Reveal>
                </div>
            </section>
        </div>
    );
}

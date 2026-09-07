import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Music2, CalendarDays, Compass, Users, Sparkles } from 'lucide-react';
import HeroSection from '../components/public/HeroSection';
import ChoirCard from '../components/public/ChoirCard';
import SongCard from '../components/public/SongCard';
import PerformanceCard from '../components/public/PerformanceCard';
import SectionHeading from '../components/public/SectionHeading';
import Reveal from '../components/ui/Reveal';
import EmptyState from '../components/public/EmptyState';
import { fetchChoirs, fetchAllSongs, fetchAllPerformances, isUpcoming } from '../lib/publicApi';
import { ChoirCardSkeleton, SongCardSkeleton, PerformanceCardSkeleton } from '../components/public/PublicSkeletons';

export default function HomePage() {
    const [loading, setLoading] = useState(true);
    const [choirs, setChoirs] = useState([]);
    const [songs, setSongs] = useState([]);
    const [performances, setPerformances] = useState([]);

    useEffect(() => {
        let isMounted = true;
        Promise.all([
            fetchChoirs().catch(() => []),
            fetchAllSongs().catch(() => []),
            fetchAllPerformances().catch(() => []),
        ])
            .then(([c, s, p]) => {
                if (!isMounted) return;
                setChoirs(c || []);
                setSongs(s || []);
                setPerformances(p || []);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const featuredChoirs = choirs.slice(0, 3);
    const featuredSongs = songs.slice(0, 3);
    const upcoming = performances.filter((p) => isUpcoming(p.date)).slice(0, 2);

    return (
        <div className="bg-slate-50 min-h-screen text-slate-800">
            {/* HERO SECTION */}
            <HeroSection featuredChoir={choirs[0] ?? null} choirs={choirs} />

            {/* MEET OUR CHOIRS */}
            <section className="bg-white py-16 sm:py-24 border-b border-slate-100">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <Reveal>
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
                            <div>
                                <span className="text-blue-600 font-semibold text-xs uppercase tracking-wider">Our Voices</span>
                                <h2 className="text-3xl font-extrabold text-slate-900 mt-2">Meet Our Choirs</h2>
                                <p className="text-slate-600 mt-2">Explore the vocal teams and worship ensembles serving at Yeka MKC.</p>
                            </div>
                            <Link
                                to="/choirs"
                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm group"
                            >
                                View All Choirs <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </Reveal>

                    {loading ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            <ChoirCardSkeleton />
                            <ChoirCardSkeleton />
                            <ChoirCardSkeleton />
                        </div>
                    ) : featuredChoirs.length === 0 ? (
                        <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
                            <EmptyState
                                icon={Users}
                                title="No choirs available."
                                message="Choir groups will be listed here soon."
                            />
                        </div>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {featuredChoirs.map((choir, i) => (
                                <Reveal key={choir.id} delay={i * 80}>
                                    <ChoirCard choir={choir} />
                                </Reveal>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* UPCOMING PERFORMANCES */}
            <section className="bg-slate-50 py-16 sm:py-24 border-b border-slate-100">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <Reveal>
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
                            <div>
                                <span className="text-blue-600 font-semibold text-xs uppercase tracking-wider">Worship Schedule</span>
                                <h2 className="text-3xl font-extrabold text-slate-900 mt-2">Upcoming Performances</h2>
                                <p className="text-slate-600 mt-2">Join us in person for heartfelt worship and uplifting musical anthems.</p>
                            </div>
                            <Link
                                to="/performances"
                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm group"
                            >
                                Full Schedule <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </Reveal>

                    {loading ? (
                        <div className="grid gap-6 lg:grid-cols-2">
                            <PerformanceCardSkeleton />
                            <PerformanceCardSkeleton />
                        </div>
                    ) : upcoming.length === 0 ? (
                        <div className="bg-white rounded-3xl p-10 border border-slate-100 text-center shadow-sm">
                            <CalendarDays size={36} className="mx-auto text-blue-500 mb-3" />
                            <h3 className="text-lg font-bold text-slate-900">No upcoming events scheduled right now</h3>
                            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                                We are preparing our next worship presentations. Check back soon for the updated schedule.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-6 lg:grid-cols-2">
                            {upcoming.map((p, i) => (
                                <Reveal key={p.id} delay={i * 80}>
                                    <PerformanceCard performance={p} variant="upcoming" />
                                </Reveal>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* FEATURED SONGS */}
            <section className="bg-white py-16 sm:py-24 border-b border-slate-100">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <Reveal>
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
                            <div>
                                <span className="text-blue-600 font-semibold text-xs uppercase tracking-wider">Worship Music</span>
                                <h2 className="text-3xl font-extrabold text-slate-900 mt-2">Featured Songs</h2>
                                <p className="text-slate-600 mt-2">Listen, view lyrics, and explore songs from our choirs.</p>
                            </div>
                            <Link
                                to="/songs"
                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm group"
                            >
                                Browse All Songs <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </Reveal>

                    {loading ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            <SongCardSkeleton />
                            <SongCardSkeleton />
                            <SongCardSkeleton />
                        </div>
                    ) : featuredSongs.length === 0 ? (
                        <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
                            <EmptyState
                                icon={Music2}
                                title="No songs available."
                                message="Our song library will be updated shortly."
                            />
                        </div>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {featuredSongs.map((s, i) => (
                                <Reveal key={s.id} delay={i * 80}>
                                    <SongCard song={s} />
                                </Reveal>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ABOUT MINISTRY CALL-TO-ACTION */}
            <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 text-white py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.2),transparent_50%)] pointer-events-none" />
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <Reveal>
                        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-200 border border-blue-400/30 uppercase tracking-wider mb-6">
                            <Compass size={14} className="text-blue-300" />
                            Our Heart &amp; Mission
                        </span>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
                            Discover the Heart of Yeka MKC Worship Ministry
                        </h2>
                        <p className="mt-5 max-w-2xl mx-auto text-base sm:text-lg text-blue-100/90 leading-relaxed">
                            Learn about our mission, vision, four pillars of worship, choir history, and how God is using our voices to bless the church.
                        </p>
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                            <Link
                                to="/about"
                                className="inline-flex items-center gap-2 rounded-xl bg-white text-blue-900 px-7 py-3.5 text-sm font-bold shadow-lg hover:bg-blue-50 transition active:scale-95"
                            >
                                Learn About Our Ministry
                                <ArrowRight size={18} />
                            </Link>
                            <Link
                                to="/choirs"
                                className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white px-7 py-3.5 text-sm font-semibold border border-white/20 transition"
                            >
                                <Users size={18} />
                                Explore Choirs
                            </Link>
                        </div>
                    </Reveal>
                </div>
            </section>
        </div>
    );
}


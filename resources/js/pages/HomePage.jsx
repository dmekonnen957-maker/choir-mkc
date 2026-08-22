import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import HeroSection from '../components/landing/HeroSection';
import ChoirCard from '../components/landing/ChoirCard';
import PerformanceCard from '../components/landing/PerformanceCard';
import SongCard from '../components/landing/SongCard';
import Timeline from '../components/landing/Timeline';
import FinalCTA from '../components/landing/FinalCTA';
import DemoBadge from '../components/ui/DemoBadge';
import Reveal from '../components/ui/Reveal';
import SectionHeading from '../components/landing/SectionHeading';
import {
    choirs,
    songs,
    getUpcomingPerformance,
    getTodaysPerformance,
    historyMilestones,
} from '../data/landingData';

function ViewAll({ to, label }) {
    return (
        <div className="mt-10 flex justify-center">
            <Link
                to={to}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow transition-colors hover:bg-blue-700"
            >
                {label}
                <ArrowRight size={16} />
            </Link>
        </div>
    );
}

export default function HomePage() {
    const featuredChoirs = choirs.slice(0, 3);
    const featuredSongs = songs.slice(0, 3);
    const upcoming = getUpcomingPerformance();
    const todays = getTodaysPerformance();

    return (
        <>
            <HeroSection />

            {/* SHORT INTRODUCTION */}
            <section className="bg-white py-16 sm:py-20">
                <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                    <Reveal>
                        <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                            <span className="h-px w-6 bg-blue-300" />
                            Our Mission
                        </span>
                        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-blue-900 sm:text-4xl">
                            Many Voices. One Story.
                        </h2>
                        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-ink-600">
                            CHOIR MKC brings multiple choirs together in one digital space where
                            music is shared, performances are remembered, and the history of each
                            choir is preserved for the generations that follow.
                        </p>
                    </Reveal>
                </div>
            </section>

            {/* FEATURED CHOIRS */}
            <section className="bg-blue-50/50 py-16 sm:py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
                        <SectionHeading
                            align="left"
                            eyebrow="Community"
                            title="Featured Choirs"
                            subtitle="Meet a few of the voices that make up CHOIR MKC."
                        />
                        <DemoBadge />
                    </div>
                    <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {featuredChoirs.map((choir, i) => (
                            <ChoirCard key={choir.id} choir={choir} index={i} />
                        ))}
                    </div>
                    <ViewAll to="/choirs" label="View All Choirs" />
                </div>
            </section>

            {/* FEATURED PERFORMANCE */}
            <section className="bg-white py-16 sm:py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
                        <SectionHeading
                            align="left"
                            eyebrow="Performances"
                            title="Upcoming Performance"
                            subtitle="A preview of what’s happening next across our choirs."
                        />
                        <DemoBadge />
                    </div>
                    {todays && (
                        <Reveal className="mt-8">
                            <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 px-6 py-4 sm:flex-row sm:items-center">
                                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                                    Today’s Performance — {todays.title}
                                </div>
                                <Link
                                    to={`/performances/${todays.id}`}
                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                >
                                    View Performance
                                    <ArrowRight size={16} />
                                </Link>
                            </div>
                        </Reveal>
                    )}
                    {upcoming && (
                        <div className="mt-8 grid gap-8 lg:grid-cols-2">
                            <PerformanceCard performance={upcoming} />
                        </div>
                    )}
                    <ViewAll to="/performances" label="View All Performances" />
                </div>
            </section>

            {/* FEATURED SONGS */}
            <section className="bg-blue-50/50 py-16 sm:py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
                        <SectionHeading
                            align="left"
                            eyebrow="Songs"
                            title="Featured Songs"
                            subtitle="A taste of the hymns and anthems preserved in our archive."
                        />
                        <DemoBadge />
                    </div>
                    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {featuredSongs.map((song, i) => (
                            <SongCard key={song.id} song={song} index={i} />
                        ))}
                    </div>
                    <ViewAll to="/songs" label="Explore Songs" />
                </div>
            </section>

            {/* HISTORY PREVIEW */}
            <section className="bg-white py-16 sm:py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
                        <SectionHeading
                            align="left"
                            eyebrow="Heritage"
                            title="A Story Worth Keeping"
                            subtitle="From the first gathering of singers to a united digital archive."
                        />
                        <Link
                            to="/history"
                            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50"
                        >
                            Explore History
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                    <div className="mt-10">
                        <Timeline milestones={historyMilestones.slice(0, 4)} />
                    </div>
                </div>
            </section>

            <FinalCTA />
        </>
    );
}

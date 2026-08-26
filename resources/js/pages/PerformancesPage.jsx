import { useEffect, useState, useMemo } from 'react';
import { CalendarDays, MapPin, Clock } from 'lucide-react';
import PerformanceCard from '../components/public/PerformanceCard';
import SectionHeading from '../components/public/SectionHeading';
import Reveal from '../components/ui/Reveal';
import EmptyState from '../components/public/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { fetchAllPerformances, isUpcoming } from '../lib/publicApi';

export default function PerformancesPage() {
    const [performances, setPerformances] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllPerformances()
            .then(setPerformances)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const { upcoming, past } = useMemo(() => {
        const up = [];
        const pa = [];
        performances.forEach((p) => (isUpcoming(p.date) ? up : pa).push(p));
        pa.sort((a, b) => new Date(b.date) - new Date(a.date));
        return { upcoming: up, past: pa };
    }, [performances]);

    return (
        <div className="bg-white">
            <section className="relative overflow-hidden bg-blue-50/60 pb-12 pt-16 sm:pb-16 sm:pt-20">
                <div className="pointer-events-none absolute -top-24 -right-16 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 ring-1 ring-inset ring-blue-100">
                        <CalendarDays size={14} /> Events
                    </span>
                    <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                        Performances
                    </h1>
                    <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-500">
                        Join us for worship, concerts, and gatherings. Browse what is coming next and revisit
                        our past performances.
                    </p>
                </div>
            </section>

            <section className="bg-white py-12 sm:py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {loading ? (
                        <div className="flex justify-center">
                            <LoadingSpinner text="Loading performances..." />
                        </div>
                    ) : (
                        <div className="space-y-14">
                            <div>
                                <SectionHeading
                                    align="left"
                                    eyebrow="What's Next"
                                    title={`Upcoming (${upcoming.length})`}
                                />
                                <div className="mt-8 grid gap-8 lg:grid-cols-2">
                                    {upcoming.map((p, i) => (
                                        <Reveal key={p.id} delay={(i % 2) * 80}>
                                            <PerformanceCard performance={p} variant="upcoming" />
                                        </Reveal>
                                    ))}
                                </div>
                                {upcoming.length === 0 && (
                                    <div className="mt-8">
                                        <EmptyState
                                            icon={CalendarDays}
                                            title="No upcoming performances."
                                            message="We are preparing our next service. Please check back soon."
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <SectionHeading align="left" eyebrow="Looking Back" title="Past Performances" />
                                <div className="mt-8 grid gap-4">
                                    {past.map((p, i) => (
                                        <Reveal key={p.id} delay={(i % 2) * 60}>
                                            <PerformanceCard performance={p} variant="past" />
                                        </Reveal>
                                    ))}
                                </div>
                                {past.length === 0 && (
                                    <div className="mt-8">
                                        <EmptyState
                                            icon={CalendarDays}
                                            title="No past performances yet."
                                            message="Our journey is just beginning — stay tuned."
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

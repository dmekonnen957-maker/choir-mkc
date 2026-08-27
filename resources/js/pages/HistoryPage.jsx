import { useEffect, useState, useMemo } from 'react';
import { History as HistoryIcon, CalendarDays, Sparkles } from 'lucide-react';
import HistoryTimeline from '../components/public/HistoryTimeline';
import SectionHeading from '../components/public/SectionHeading';
import Reveal from '../components/ui/Reveal';
import EmptyState from '../components/public/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { fetchAllPerformances, isUpcoming, formatDate } from '../lib/publicApi';

export default function HistoryPage() {
    const [performances, setPerformances] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllPerformances()
            .then(setPerformances)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const timeline = useMemo(() => {
        const past = performances
            .filter((p) => !isUpcoming(p.date))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        const byYear = {};
        past.forEach((p) => {
            const year = new Date(p.date).getFullYear();
            (byYear[year] ||= []).push(p);
        });
        return Object.entries(byYear)
            .sort((a, b) => b[0] - a[0])
            .map(([year, items]) => ({
                year: Number(year),
                title: `${items.length} ${items.length === 1 ? 'Performance' : 'Performances'}`,
                description: items
                    .slice(0, 4)
                    .map((p) => `${p.title} (${formatDate(p.date)})`)
                    .join(' · '),
            }));
    }, [performances]);

    const totalPast = performances.filter((p) => !isUpcoming(p.date)).length;

    return (
        <div className="bg-white">
            <section className="relative overflow-hidden bg-blue-50/60 pb-12 pt-16 sm:pb-16 sm:pt-20">
                <div className="pointer-events-none absolute -top-24 -left-16 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 ring-1 ring-inset ring-blue-100">
                        <HistoryIcon size={14} /> Heritage
                    </span>
                    <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                        Our History
                    </h1>
                    <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-500">
                        A journey of worship, service, and song. Explore the milestones and memories that
                        have shaped EKA MKC Choirs and Worship Teams through the years.
                    </p>
                </div>
            </section>

            <section className="bg-white py-14 sm:py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {loading ? (
                        <div className="flex justify-center">
                            <LoadingSpinner text="Loading history..." />
                        </div>
                    ) : timeline.length === 0 ? (
                        <EmptyState
                            icon={HistoryIcon}
                            title="Our history is just beginning."
                            message="Once performances conclude, they will be remembered here. Check back soon."
                        />
                    ) : (
                        <>
                            <Reveal>
                                <div className="mb-12 flex flex-wrap gap-4">
                                    <StatCard icon={CalendarDays} value={totalPast} label="Past Performances" />
                                    <StatCard icon={Sparkles} value={timeline.length} label="Years of Worship" />
                                </div>
                            </Reveal>
                            <Reveal>
                                <SectionHeading
                                    eyebrow="Timeline"
                                    title="Moments We Cherish"
                                    subtitle="Each year, a story of faithful voices coming together."
                                />
                            </Reveal>
                            <div className="mt-12">
                                <HistoryTimeline items={timeline} />
                            </div>
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}

function StatCard({ icon: Icon, value, label }) {
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Icon size={20} />
            </span>
            <div>
                <p className="text-2xl font-bold leading-none text-slate-900">{value}</p>
                <p className="mt-1 text-sm text-slate-500">{label}</p>
            </div>
        </div>
    );
}

import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import PageHeader from '../components/landing/PageHeader';
import PerformanceCard from '../components/landing/PerformanceCard';
import ChoirArtwork from '../components/landing/ChoirArtwork';
import DemoBadge from '../components/ui/DemoBadge';
import { performances, getTodaysPerformance, isSameDay } from '../data/landingData';

function isPast(iso) {
    const d = new Date(iso + 'T00:00:00');
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return d < t;
}

export default function PerformancesPage() {
    const todays = getTodaysPerformance();
    const upcoming = performances
        .filter((p) => !isPast(p.date) && !isSameDay(p.date))
        .sort((a, b) => a.date.localeCompare(b.date));
    const past = performances
        .filter((p) => isPast(p.date))
        .sort((a, b) => b.date.localeCompare(a.date));

    const Block = ({ title, items }) =>
        items.length ? (
            <div className="mt-10">
                <h2 className="text-xl font-semibold text-blue-900">{title}</h2>
                <div className="mt-6 grid gap-8 lg:grid-cols-2">
                    {items.map((p, i) => (
                        <PerformanceCard key={p.id} performance={p} index={i} />
                    ))}
                </div>
            </div>
        ) : null;

    return (
        <>
            <PageHeader
                eyebrow="Schedule"
                title="Performances"
                subtitle="Follow upcoming services and concerts where our choirs lead the congregation in song."
            />
            <section className="bg-surface py-12 sm:py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <DemoBadge />
                    {todays && (
                        <div className="mt-8 overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-700 to-blue-900 p-6 text-white shadow-xl sm:p-8">
                            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">
                                <Sparkles size={16} className="text-blue-300" /> Today’s Performance
                            </div>
                            <div className="mt-3 grid gap-6 lg:grid-cols-2 lg:items-center">
                                <div>
                                    <h3 className="text-2xl font-semibold">{todays.title}</h3>
                                    <p className="mt-2 text-blue-100">{todays.description}</p>
                                    <Link
                                        to={`/performances/${todays.id}`}
                                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-900 hover:bg-blue-50"
                                    >
                                        View Performance <Sparkles size={16} />
                                    </Link>
                                </div>
                                <div className="overflow-hidden rounded-2xl ring-1 ring-white/20">
                                    <ChoirArtwork
                                        variant="stage"
                                        seed={todays.id * 5 + 2}
                                        className="aspect-[16/9] w-full"
                                        label={todays.title}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    <Block title="Upcoming" items={upcoming} />
                    <Block title="Past" items={past} />
                    {!todays && upcoming.length === 0 && past.length === 0 && (
                        <p className="mt-10 text-center text-ink-500">No performances scheduled yet.</p>
                    )}
                </div>
            </section>
        </>
    );
}

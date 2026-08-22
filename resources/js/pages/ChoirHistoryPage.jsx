import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ChoirArtwork from '../components/landing/ChoirArtwork';
import Timeline from '../components/landing/Timeline';
import Reveal from '../components/ui/Reveal';
import DemoBadge from '../components/ui/DemoBadge';
import {
    getChoirById,
    getChoirMilestones,
    getChoirGallery,
    getChoirPerformances,
} from '../data/landingData';
import { formatLongDate } from '../data/dateUtils';

export default function ChoirHistoryPage() {
    const { id } = useParams();
    const choir = getChoirById(id);

    if (!choir) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-24 text-center">
                <h1 className="text-2xl font-semibold text-blue-900">Choir not found</h1>
                <Link to="/choirs" className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                    Back to choirs
                </Link>
            </div>
        );
    }

    const milestones = getChoirMilestones(choir.id);
    const gallery = getChoirGallery(choir.id);
    const performances = getChoirPerformances(choir.id);

    return (
        <>
            <section className="relative overflow-hidden bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 pb-12 pt-12 sm:pb-16">
                <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
                <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <Link to={`/choirs/${choir.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-white">
                        <ArrowLeft size={16} /> {choir.name}
                    </Link>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <h1 className="text-3xl font-semibold text-white sm:text-4xl">{choir.name} — History</h1>
                        <DemoBadge className="bg-white/15 text-white ring-white/30" />
                    </div>
                </div>
            </section>

            <section className="bg-surface py-12 sm:py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <p className="max-w-2xl text-lg leading-relaxed text-ink-600">{choir.summary}</p>

                    <h2 className="mt-12 text-2xl font-semibold text-blue-900">Timeline</h2>
                    <div className="mt-6">
                        <Timeline milestones={milestones} />
                    </div>

                    <h2 className="mt-14 text-2xl font-semibold text-blue-900">Historical Photos</h2>
                    <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
                        {gallery.map((g) => (
                            <Reveal key={g.id} direction="up" className="overflow-hidden rounded-2xl ring-1 ring-blue-100">
                                <ChoirArtwork variant={g.art.variant} seed={g.art.seed} className="aspect-[4/3] w-full" label={g.title} />
                            </Reveal>
                        ))}
                    </div>

                    <h2 className="mt-14 text-2xl font-semibold text-blue-900">Important Performances</h2>
                    <ul className="mt-6 space-y-3">
                        {performances.map((p) => (
                            <li key={p.id}>
                                <Link
                                    to={`/performances/${p.id}`}
                                    className="flex flex-wrap items-center gap-x-3 rounded-xl border border-blue-100 bg-white px-4 py-3 transition-colors hover:bg-blue-50"
                                >
                                    <span className="font-medium text-blue-900">{p.title}</span>
                                    <span className="text-sm text-ink-500">{formatLongDate(p.date)}</span>
                                    <span className="text-sm text-ink-500">· {p.venue}</span>
                                </Link>
                            </li>
                        ))}
                        {performances.length === 0 && (
                            <li className="text-ink-500">No public performances yet.</li>
                        )}
                    </ul>
                </div>
            </section>
        </>
    );
}

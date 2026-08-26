import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CalendarDays, MapPin, Clock, Users, Info } from 'lucide-react';
import CoverImage from '../components/public/CoverImage';
import Reveal from '../components/ui/Reveal';
import EmptyState from '../components/public/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { fetchAllPerformances, formatDate, imageUrl } from '../lib/publicApi';

export default function PerformanceDetailPage() {
    const { id } = useParams();
    const [performance, setPerformance] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllPerformances()
            .then((list) => list.find((p) => String(p.id) === String(id)) ?? null)
            .then(setPerformance)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center bg-white">
                <LoadingSpinner text="Loading performance..." />
            </div>
        );
    }

    if (!performance) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-24">
                <EmptyState
                    icon={CalendarDays}
                    title="This performance could not be found."
                    message="It may be private or no longer available."
                    action={
                        <Link
                            to="/performances"
                            className="inline-flex items-center gap-2 rounded-full bg-blue-700 px-6 py-3 text-sm font-semibold text-white"
                        >
                            <ArrowLeft size={16} /> Back to Performances
                        </Link>
                    }
                />
            </div>
        );
    }

    const choir = performance.choir;

    return (
        <div className="bg-white">
            <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 to-white pb-12 pt-14 sm:pb-16 sm:pt-20">
                <div className="pointer-events-none absolute -top-24 -left-20 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
                <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <Link
                        to="/performances"
                        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-blue-700"
                    >
                        <ArrowLeft size={16} /> All Performances
                    </Link>
                    <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 ring-1 ring-inset ring-blue-100">
                        <CalendarDays size={14} /> Performance
                    </span>
                    <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                        {performance.title}
                    </h1>
                    {choir?.name && (
                        <Link
                            to={`/choirs/${choir.id}`}
                            className="mt-3 inline-flex w-fit items-center gap-2 text-base font-medium text-blue-700 hover:text-blue-800"
                        >
                            <Users size={16} /> {choir.name}
                        </Link>
                    )}

                    <div className="mt-8 grid gap-4 sm:grid-cols-3">
                        <DetailMeta
                            icon={CalendarDays}
                            label="Date"
                            value={formatDate(performance.date)}
                        />
                        {performance.start_time && (
                            <DetailMeta
                                icon={Clock}
                                label="Time"
                                value={`${performance.start_time}${
                                    performance.end_time ? ` – ${performance.end_time}` : ''
                                }`}
                            />
                        )}
                        {(performance.venue || performance.location) && (
                            <DetailMeta
                                icon={MapPin}
                                label="Location"
                                value={performance.venue || performance.location}
                                sub={performance.location}
                            />
                        )}
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
                <Reveal>
                    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 shadow-sm">
                        <div className="aspect-[16/9] w-full">
                            <CoverImage src={null} label={performance.title} className="h-full w-full" />
                        </div>
                    </div>
                </Reveal>

                {performance.description && (
                    <Reveal>
                        <div className="mt-10">
                            <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
                                <Info size={18} className="text-blue-600" /> About this Performance
                            </h2>
                            <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-600">
                                {performance.description}
                            </p>
                        </div>
                    </Reveal>
                )}

                <div className="mt-10 grid gap-4 sm:grid-cols-2">
                    {performance.organizer && (
                        <DetailMeta icon={Users} label="Organizer" value={performance.organizer} />
                    )}
                    {performance.dress_code && (
                        <DetailMeta icon={Info} label="Dress Code" value={performance.dress_code} />
                    )}
                </div>

                {performance.special_instructions && (
                    <Reveal>
                        <div className="mt-8 rounded-3xl border border-blue-100 bg-blue-50/60 p-6">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                                Special Instructions
                            </h3>
                            <p className="mt-2 leading-relaxed text-slate-600">
                                {performance.special_instructions}
                            </p>
                        </div>
                    </Reveal>
                )}
            </section>
        </div>
    );
}

function DetailMeta({ icon: Icon, label, value, sub }) {
    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                <Icon size={13} /> {label}
            </p>
            <p className="mt-1.5 text-sm font-semibold text-slate-800">{value}</p>
            {sub && sub !== value && <p className="text-xs text-slate-400">{sub}</p>}
        </div>
    );
}

import { useEffect, useState, useMemo } from 'react';
import { Search, Users } from 'lucide-react';
import ChoirCard from '../components/public/ChoirCard';
import SectionHeading from '../components/public/SectionHeading';
import Reveal from '../components/ui/Reveal';
import EmptyState from '../components/public/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { fetchChoirs } from '../lib/publicApi';

export default function ChoirsPage() {
    const [choirs, setChoirs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');

    useEffect(() => {
        fetchChoirs()
            .then(setChoirs)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return choirs;
        return choirs.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                (c.team_leader?.name ?? '').toLowerCase().includes(q),
        );
    }, [choirs, query]);

    return (
        <div className="bg-white">
            <section className="relative overflow-hidden bg-blue-50/60 pb-12 pt-16 sm:pb-16 sm:pt-20">
                <div className="pointer-events-none absolute -top-24 -right-16 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <SectionHeading
                        eyebrow="Community"
                        title="Our Choirs"
                        subtitle="Discover the voices, people, and stories behind EKA MKC Choirs and Worship Teams."
                        align="left"
                    />
                </div>
            </section>

            <section className="bg-white py-12 sm:py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="relative w-full sm:w-96">
                            <Search
                                size={18}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search choirs by name or leader"
                                aria-label="Search choirs"
                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="mt-16 flex justify-center">
                            <LoadingSpinner text="Loading choirs..." />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="mt-10">
                            <EmptyState
                                icon={Users}
                                title="No choirs are currently available."
                                message={
                                    query
                                        ? `No choirs match “${query}”.`
                                        : 'Check back soon as our choirs continue to grow.'
                                }
                            />
                        </div>
                    ) : (
                        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            {filtered.map((choir, i) => (
                                <Reveal key={choir.id} delay={(i % 3) * 80}>
                                    <ChoirCard choir={choir} />
                                </Reveal>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

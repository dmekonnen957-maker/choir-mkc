import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import PageHeader from '../components/landing/PageHeader';
import ChoirCard from '../components/landing/ChoirCard';
import DemoBadge from '../components/ui/DemoBadge';
import { choirs } from '../data/landingData';

export default function ChoirsPage() {
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return choirs;
        return choirs.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                (c.location ?? '').toLowerCase().includes(q) ||
                (c.leader ?? '').toLowerCase().includes(q),
        );
    }, [query]);

    return (
        <>
            <PageHeader
                eyebrow="Community"
                title="Discover Our Choirs"
                subtitle="Meet the voices, people, and communities that make CHOIR MKC."
            />
            <section className="bg-surface py-12 sm:py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <DemoBadge />
                        <div className="relative w-full sm:w-80">
                            <Search
                                size={18}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                            />
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search choirs by name, location or leader"
                                aria-label="Search choirs"
                                className="w-full rounded-xl border border-blue-200 bg-white py-2.5 pl-10 pr-4 text-sm text-ink-800 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    </div>

                    {filtered.length === 0 ? (
                        <p className="mt-12 text-center text-ink-500">
                            No choirs match “{query}”.
                        </p>
                    ) : (
                        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            {filtered.map((choir, i) => (
                                <ChoirCard key={choir.id} choir={choir} index={i} />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}

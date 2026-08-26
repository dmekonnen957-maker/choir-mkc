import { useEffect, useState, useMemo } from 'react';
import { Search, Music2, Play } from 'lucide-react';
import SongCard from '../components/public/SongCard';
import Reveal from '../components/ui/Reveal';
import EmptyState from '../components/public/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { fetchAllSongs, fetchChoirs } from '../lib/publicApi';

export default function SongsPage() {
    const [songs, setSongs] = useState([]);
    const [choirs, setChoirs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [choirId, setChoirId] = useState('');

    useEffect(() => {
        Promise.all([fetchAllSongs(), fetchChoirs()])
            .then(([s, c]) => {
                setSongs(s);
                setChoirs(c);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return songs.filter((s) => {
            const matchQ = !q || s.title.toLowerCase().includes(q);
            const matchC = !choirId || String(s.choir?.id) === String(choirId);
            return matchQ && matchC;
        });
    }, [songs, query, choirId]);

    return (
        <div className="bg-white">
            <section className="relative overflow-hidden bg-blue-50/60 pb-12 pt-16 sm:pb-16 sm:pt-20">
                <div className="pointer-events-none absolute -top-24 -left-16 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 ring-1 ring-inset ring-blue-100">
                        <Music2 size={14} /> Music Library
                    </span>
                    <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                        Songs
                    </h1>
                    <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-500">
                        Listen to the music of our choirs. Explore recordings, lyrics, and the voices behind
                        every song.
                    </p>
                </div>
            </section>

            <section className="bg-white py-12 sm:py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search
                                size={18}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search songs by title"
                                aria-label="Search songs"
                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                        <select
                            value={choirId}
                            onChange={(e) => setChoirId(e.target.value)}
                            aria-label="Filter by choir"
                            className="rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm text-slate-700 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="">All Choirs</option>
                            {choirs.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {loading ? (
                        <div className="mt-16 flex justify-center">
                            <LoadingSpinner text="Loading songs..." />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="mt-10">
                            <EmptyState
                                icon={Music2}
                                title="No songs found."
                                message={
                                    query || choirId
                                        ? 'Try adjusting your search or filters.'
                                        : 'Our song library is being built.'
                                }
                            />
                        </div>
                    ) : (
                        <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
                            {filtered.map((s, i) => (
                                <Reveal key={s.id} delay={(i % 4) * 60}>
                                    <SongCard song={s} />
                                </Reveal>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

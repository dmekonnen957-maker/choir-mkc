import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Music2, Play } from 'lucide-react';
import Reveal from '../components/ui/Reveal';
import EmptyState from '../components/public/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { fetchAllSongs, fetchChoirs } from '../lib/publicApi';

const SCALE_LABELS = {
    major: 'Major',
    minor: 'Minor',
    ethiopian: 'Ethiopian',
};

export default function SongsPage() {
    const [songs, setSongs] = useState([]);
    const [choirs, setChoirs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [choirId, setChoirId] = useState('');
    const [scale, setScale] = useState('');
    const [keyFilter, setKeyFilter] = useState('');

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
            const matchS = !scale || s.scale === scale;
            const matchK = !keyFilter || s.original_key === keyFilter;
            return matchQ && matchC && matchS && matchK;
        });
    }, [songs, query, choirId, scale, keyFilter]);

    const keys = useMemo(
        () => [...new Set(songs.map((s) => s.original_key).filter(Boolean))].sort(),
        [songs]
    );

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
                        Listen to the music of our choirs. Explore recordings, lyrics, keys and scales,
                        and the voices behind every song.
                    </p>
                </div>
            </section>

            <section className="bg-white py-12 sm:py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
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
                        <select
                            value={scale}
                            onChange={(e) => setScale(e.target.value)}
                            aria-label="Filter by scale"
                            className="rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm text-slate-700 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="">All Scales</option>
                            <option value="major">Major</option>
                            <option value="minor">Minor</option>
                            <option value="ethiopian">Ethiopian</option>
                        </select>
                        <select
                            value={keyFilter}
                            onChange={(e) => setKeyFilter(e.target.value)}
                            aria-label="Filter by key"
                            className="rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm text-slate-700 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="">All Keys</option>
                            {keys.map((k) => (
                                <option key={k} value={k}>
                                    {k}
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
                                    query || choirId || scale || keyFilter
                                        ? 'Try adjusting your search or filters.'
                                        : 'Our song library is being built.'
                                }
                            />
                        </div>
                    ) : (
                        <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
                            {filtered.map((s, i) => (
                                <Reveal key={s.id} delay={(i % 4) * 60}>
                                    <Link
                                        to={`/songs/${s.id}`}
                                        className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                                    >
                                        <div className="flex h-28 items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 text-indigo-400">
                                            <Music2 size={40} />
                                        </div>
                                        <div className="space-y-2 p-4">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="font-semibold text-slate-800 group-hover:text-blue-600">
                                                    {s.title}
                                                </h3>
                                                {s.audio_url && (
                                                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                                                        <Play size={12} /> Play
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400">
                                                {s.choir?.name}
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {s.original_key && (
                                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                                                        Key {s.original_key}
                                                    </span>
                                                )}
                                                {s.scale && (
                                                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                                                        {SCALE_LABELS[s.scale] ?? s.scale}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                </Reveal>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

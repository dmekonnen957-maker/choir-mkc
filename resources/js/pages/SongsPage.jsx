import { useMemo, useState } from 'react';
import { Search, Music2 } from 'lucide-react';
import PageHeader from '../components/landing/PageHeader';
import SongCard from '../components/landing/SongCard';
import DemoBadge from '../components/ui/DemoBadge';
import { songs, choirs, getChoirById } from '../data/landingData';

function unique(values) {
    return [...new Set(values.filter(Boolean))].sort();
}

export default function SongsPage() {
    const [query, setQuery] = useState('');
    const [choir, setChoir] = useState('');
    const [language, setLanguage] = useState('');
    const [composer, setComposer] = useState('');

    const choirOptions = useMemo(() => choirs.map((c) => ({ id: c.id, name: c.name })), []);
    const languageOptions = useMemo(() => unique(songs.map((s) => s.language)), []);
    const composerOptions = useMemo(() => unique(songs.map((s) => s.composer)), []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return songs.filter((s) => {
            if (choir && s.choirId !== Number(choir)) return false;
            if (language && s.language !== language) return false;
            if (composer && s.composer !== composer) return false;
            if (q && !(`${s.title} ${s.composer} ${getChoirById(s.choirId)?.name}`.toLowerCase().includes(q)))
                return false;
            return true;
        });
    }, [query, choir, language, composer]);

    const selectCls =
        'rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm text-ink-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100';

    return (
        <>
            <PageHeader
                eyebrow="Archive"
                title="Songs & Lyrics"
                subtitle="Browse the hymns and anthems preserved in our living archive."
            />
            <section className="bg-surface py-12 sm:py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <DemoBadge />
                        <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:grid-cols-4">
                            <div className="relative sm:col-span-2 lg:col-span-1">
                                <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                                <input
                                    type="search"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search songs"
                                    aria-label="Search songs"
                                    className="w-full rounded-xl border border-blue-200 bg-white py-2.5 pl-10 pr-4 text-sm text-ink-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                            <select value={choir} onChange={(e) => setChoir(e.target.value)} aria-label="Filter by choir" className={selectCls}>
                                <option value="">All choirs</option>
                                {choirOptions.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <select value={language} onChange={(e) => setLanguage(e.target.value)} aria-label="Filter by language" className={selectCls}>
                                <option value="">All languages</option>
                                {languageOptions.map((l) => (
                                    <option key={l} value={l}>{l}</option>
                                ))}
                            </select>
                            <select value={composer} onChange={(e) => setComposer(e.target.value)} aria-label="Filter by composer" className={selectCls}>
                                <option value="">All composers</option>
                                {composerOptions.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <p className="mt-6 text-sm text-ink-500">Showing {filtered.length} of {songs.length} songs</p>

                    {filtered.length === 0 ? (
                        <p className="mt-12 text-center text-ink-500">No songs match your filters.</p>
                    ) : (
                        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {filtered.map((song, i) => (
                                <SongCard key={song.id} song={song} index={i} />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}

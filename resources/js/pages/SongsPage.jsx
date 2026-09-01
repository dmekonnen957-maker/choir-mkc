import { useEffect, useState, useMemo, useRef } from 'react';
import { Search, Music2, CheckCircle2, Volume2, Pause, Play, Download } from 'lucide-react';
import Reveal from '../components/ui/Reveal';
import EmptyState from '../components/public/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import SongCard from '../components/public/SongCard';
import SongLyricsModal from '../components/public/SongLyricsModal';
import { fetchAllSongs, fetchChoirs } from '../lib/publicApi';

export default function SongsPage() {
    const [songs, setSongs] = useState([]);
    const [choirs, setChoirs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [query, setQuery] = useState('');
    const [choirId, setChoirId] = useState('');
    const [lyricsFilter, setLyricsFilter] = useState('');
    const [sortOption, setSortOption] = useState('recent');

    // Active playback
    const [playingSong, setPlayingSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

    // Lyrics modal
    const [lyricsSong, setLyricsSong] = useState(null);

    // Toast notification
    const [toast, setToast] = useState('');

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchAllSongs(), fetchChoirs()])
            .then(([s, c]) => {
                setSongs(Array.isArray(s) ? s : []);
                setChoirs(Array.isArray(c) ? c : []);
            })
            .catch(() => {
                setSongs([]);
                setChoirs([]);
            })
            .finally(() => setLoading(false));
    }, []);

    // Filter & sort logic
    const filtered = useMemo(() => {
        if (!Array.isArray(songs)) return [];
        const q = query.trim().toLowerCase();
        let result = songs.filter((s) => {
            if (!s) return false;
            const titleMatch = !q || (s.title && s.title.toLowerCase().includes(q)) || (s.artist && s.artist.toLowerCase().includes(q));
            const choirMatch = !choirId || String(s.choir?.id || s.choir_id) === String(choirId);

            const hasLyrics = !!(s.lyrics && s.lyrics.trim());
            const lyricsMatch =
                !lyricsFilter ||
                (lyricsFilter === 'yes' && hasLyrics) ||
                (lyricsFilter === 'no' && !hasLyrics);

            return titleMatch && choirMatch && lyricsMatch;
        });

        // Sorting
        if (sortOption === 'title') {
            result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        } else if (sortOption === 'oldest') {
            result.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
        } else {
            result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        }

        return result;
    }, [songs, query, choirId, lyricsFilter, sortOption]);

    // Handle audio play/pause toggle
    const handlePlaySong = (song) => {
        if (!song || !song.audio_url) return;

        if (playingSong?.id === song.id) {
            if (isPlaying) {
                audioRef.current?.pause();
                setIsPlaying(false);
            } else {
                audioRef.current?.play();
                setIsPlaying(true);
            }
        } else {
            setPlayingSong(song);
            setIsPlaying(true);
        }
    };

    // When playingSong changes, play audio
    useEffect(() => {
        if (playingSong?.audio_url && audioRef.current) {
            audioRef.current.src = playingSong.audio_url;
            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }
    }, [playingSong]);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 2500);
    };

    const handleShare = (song) => {
        const url = window.location.origin + '/songs/' + song.id;
        if (navigator.share) {
            navigator.share({ title: song.title, url }).catch(() => {});
        } else {
            navigator.clipboard.writeText(url);
            showToast('Song link copied!');
        }
    };

    return (
        <div className="bg-white min-h-screen pb-24">
            {/* Hidden global audio element for page playback */}
            <audio
                ref={audioRef}
                onEnded={() => setIsPlaying(false)}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
            />

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-[110] flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-2xl animate-fade-in">
                    <CheckCircle2 size={18} className="text-emerald-400" />
                    <span>{toast}</span>
                </div>
            )}

            {/* Hero Header */}
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
                        Listen to the music of our choirs. Explore recordings, lyrics, and the voices behind every song.
                    </p>
                </div>
            </section>

            {/* Search and Filters Section */}
            <section className="bg-white py-8 sm:py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search
                                size={18}
                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search songs by title"
                                aria-label="Search songs"
                                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm"
                            />
                        </div>

                        {/* Choir Filter */}
                        <select
                            value={choirId}
                            onChange={(e) => setChoirId(e.target.value)}
                            aria-label="Filter by choir"
                            className="rounded-xl border border-slate-200 bg-white py-3 pl-3.5 pr-8 text-sm text-slate-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm"
                        >
                            <option value="">All Choirs</option>
                            {choirs.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>

                        {/* Lyrics Filter */}
                        <select
                            value={lyricsFilter}
                            onChange={(e) => setLyricsFilter(e.target.value)}
                            aria-label="Filter by lyrics"
                            className="rounded-xl border border-slate-200 bg-white py-3 pl-3.5 pr-8 text-sm text-slate-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm"
                        >
                            <option value="">Lyrics Available</option>
                            <option value="yes">With Lyrics</option>
                            <option value="no">Without Lyrics</option>
                        </select>

                        {/* Sort Option */}
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            aria-label="Sort songs"
                            className="rounded-xl border border-slate-200 bg-white py-3 pl-3.5 pr-8 text-sm text-slate-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm"
                        >
                            <option value="recent">Recently Added</option>
                            <option value="title">Title (A - Z)</option>
                            <option value="oldest">Oldest First</option>
                        </select>
                    </div>

                    {/* Songs Content */}
                    {loading ? (
                        <div className="mt-16 flex justify-center">
                            <LoadingSpinner text="Loading music library..." />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="mt-12">
                            <EmptyState
                                icon={Music2}
                                title="No songs found."
                                message={
                                    query || choirId || lyricsFilter
                                        ? 'Try adjusting your search query or filters.'
                                        : 'Our song library is currently empty.'
                                }
                            />
                        </div>
                    ) : (
                        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filtered.map((s, i) => (
                                <Reveal key={s.id} delay={(i % 4) * 50}>
                                    <SongCard
                                        song={s}
                                        onPlay={handlePlaySong}
                                        onViewLyrics={(song) => setLyricsSong(song)}
                                        onShare={handleShare}
                                        isPlaying={playingSong?.id === s.id && isPlaying}
                                    />
                                </Reveal>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Persistent Audio Player Bar if playing */}
            {playingSong && (
                <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-blue-100 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur-md">
                    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                <Volume2 size={20} />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-900">{playingSong.title}</p>
                                <p className="truncate text-xs text-slate-500">{playingSong.choir?.name || 'Choir MKC'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => handlePlaySong(playingSong)}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 transition"
                            >
                                {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                            </button>

                            {playingSong.audio_url && (
                                <a
                                    href={playingSong.audio_url}
                                    download
                                    className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    <Download size={14} /> Download
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Lyrics Modal */}
            <SongLyricsModal
                song={lyricsSong}
                isOpen={!!lyricsSong}
                onClose={() => setLyricsSong(null)}
                onShare={handleShare}
            />
        </div>
    );
}

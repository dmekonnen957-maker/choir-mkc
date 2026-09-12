import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
    Search,
    Music2,
    Volume2,
    Pause,
    Play,
    Download,
    Filter,
    Heart,
    CheckCircle2,
    X,
    ChevronLeft,
    ChevronRight,
    Flame,
    SlidersHorizontal,
} from 'lucide-react';
import EmptyState from '../components/public/EmptyState';
import SongLyricsModal from '../components/public/SongLyricsModal';
import { fetchPaginatedSongs, fetchChoirs, fetchLikedSongs, likeSong, unlikeSong } from '../lib/publicApi';
import { useAuth } from '../context/AuthContext';

function formatScale(scale, scaleMode) {
    const value = scale || scaleMode;
    if (!value) return 'Not specified';
    return value
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function SongsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { isAuthenticated } = useAuth();

    // Query state
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [selectedChoir, setSelectedChoir] = useState(searchParams.get('choir_id') || '');
    const [sortOption, setSortOption] = useState(searchParams.get('sort') || 'most_liked');
    const [onlyLiked, setOnlyLiked] = useState(searchParams.get('liked') === '1');
    const [page, setPage] = useState(1);

    // Data state
    const [songs, setSongs] = useState([]);
    const [choirs, setChoirs] = useState([]);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [likingSongId, setLikingSongId] = useState(null);

    // Playback state
    const [playingSong, setPlayingSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

    // Lyrics modal
    const [lyricsSong, setLyricsSong] = useState(null);

    // Toast
    const [toast, setToast] = useState('');

    // Load choirs once for dropdown filter
    useEffect(() => {
        fetchChoirs()
            .then((c) => setChoirs(Array.isArray(c) ? c : []))
            .catch(() => setChoirs([]));
    }, []);

    // Main fetch songs handler
    const loadSongs = useCallback(async () => {
        setLoading(true);
        try {
            if (onlyLiked && isAuthenticated) {
                const res = await fetchLikedSongs({
                    page,
                    per_page: 100,
                });
                setSongs(res.items || []);
                setPagination(res.pagination);
            } else {
                const params = {
                    page,
                    per_page: 100,
                    sort: sortOption,
                };
                if (searchQuery.trim()) params.search = searchQuery.trim();
                if (selectedChoir) params.choir_id = selectedChoir;

                const res = await fetchPaginatedSongs(params);
                setSongs(res.items || []);
                setPagination(res.pagination);
            }
        } catch (err) {
            setSongs([]);
        } finally {
            setLoading(false);
        }
    }, [page, searchQuery, selectedChoir, sortOption, onlyLiked, isAuthenticated]);

    useEffect(() => {
        loadSongs();
    }, [loadSongs]);

    // Handle Audio play/pause
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

    useEffect(() => {
        if (playingSong?.audio_url && audioRef.current) {
            audioRef.current.src = playingSong.audio_url;
            audioRef.current
                .play()
                .then(() => setIsPlaying(true))
                .catch(() => setIsPlaying(false));
        }
    }, [playingSong]);

    const handleLikeChanged = (songId, nextLiked, nextCount) => {
        setSongs((prev) =>
            prev.map((s) =>
                s.id === songId
                    ? { ...s, is_liked: nextLiked, likes_count: nextCount }
                    : s
            )
        );
    };

    const handleLikeToggle = async (song) => {
        if (!isAuthenticated || likingSongId === song.id) return;
        setLikingSongId(song.id);
        const wasLiked = Boolean(song.is_liked);
        const nextLiked = !wasLiked;
        const nextCount = Math.max(0, Number(song.likes_count || 0) + (nextLiked ? 1 : -1));
        handleLikeChanged(song.id, nextLiked, nextCount);

        try {
            const response = nextLiked ? await likeSong(song.id) : await unlikeSong(song.id);
            if (response?.likes_count !== undefined) {
                handleLikeChanged(song.id, nextLiked, Number(response.likes_count));
            }
        } catch {
            handleLikeChanged(song.id, wasLiked, Number(song.likes_count || 0));
        } finally {
            setLikingSongId(null);
        }
    };

    const showToastMsg = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedChoir('');
        setSortOption('most_liked');
        setOnlyLiked(false);
        setPage(1);
    };

    const hasActiveFilters = Boolean(
        searchQuery.trim() || selectedChoir || onlyLiked || sortOption !== 'most_liked'
    );

    return (
        <div className="bg-slate-50 min-h-screen text-slate-800 pb-28">
            {/* Hidden global audio element */}
            <audio
                ref={audioRef}
                onEnded={() => setIsPlaying(false)}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
            />

            {/* Toast notification */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-[110] flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-2xl animate-fade-in">
                    <CheckCircle2 size={18} className="text-emerald-400" />
                    <span>{toast}</span>
                </div>
            )}

            {/* 1. HERO HEADER */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white py-14 sm:py-18 border-b border-blue-900/40">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.2),transparent_50%)] pointer-events-none" />
                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-blue-300 backdrop-blur-md mb-4">
                        <Music2 size={14} className="text-cyan-400" /> Ethiopian Worship Music Library
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
                        Songs
                    </h1>
                    <p className="mt-3 max-w-2xl text-base sm:text-lg text-blue-100/80 font-normal leading-relaxed">
                        Explore Ethiopian choir songs and discover new music.
                    </p>
                </div>
            </section>

            {/* 2. SEARCH & DISCOVERY CONTROLS */}
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-7 relative z-20">
                <div className="rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-xl space-y-4">
                    {/* Top Row: Search Input & Main Controls */}
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                        {/* Prominent Search Bar */}
                        <div className="relative flex-1">
                            <Search
                                size={18}
                                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="Search songs by title, choir, or composer..."
                                aria-label="Search songs"
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-10 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* Choir Filter Dropdown */}
                        <div className="w-full lg:w-56">
                            <select
                                value={selectedChoir}
                                onChange={(e) => {
                                    setSelectedChoir(e.target.value);
                                    setPage(1);
                                }}
                                aria-label="Filter by Choir"
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-700 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="">All Choirs</option>
                                {choirs.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Sort Dropdown */}
                        <div className="w-full lg:w-52">
                            <select
                                value={sortOption}
                                onChange={(e) => {
                                    setSortOption(e.target.value);
                                    setPage(1);
                                }}
                                aria-label="Sort Songs"
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-700 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="most_liked">Most Liked (Popular)</option>
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="title">Title (A - Z)</option>
                            </select>
                        </div>
                    </div>

                    {/* Member Liked Filter */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                        {/* Authenticated Member: My Liked Songs Toggle */}
                        <div className="flex items-center gap-3">
                            {isAuthenticated && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setOnlyLiked(!onlyLiked);
                                        setPage(1);
                                    }}
                                    className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                                        onlyLiked
                                            ? 'bg-rose-50 text-rose-700 border border-rose-300 ring-2 ring-rose-200'
                                            : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                                    }`}
                                >
                                    <Heart
                                        size={14}
                                        className={onlyLiked ? 'fill-rose-600 text-rose-600' : 'text-slate-400'}
                                    />
                                    <span>My Liked Songs</span>
                                </button>
                            )}

                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    className="text-xs font-semibold text-slate-400 hover:text-rose-600 transition"
                                >
                                    Reset Filters
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. SONG CARDS GRID */}
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10">
                {/* Result count summary */}
                <div className="flex items-center justify-between mb-6">
                    <p className="text-sm font-semibold text-slate-500">
                        {loading
                            ? 'Loading songs...'
                            : `Showing ${songs.length} of ${pagination.total || songs.length} choir songs`}
                    </p>
                    {onlyLiked && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                            <Heart size={12} className="fill-rose-500" /> Filtered by Liked Songs
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {[...Array(8)].map((_, index) => (
                            <div key={index} className="h-16 animate-pulse border-b border-slate-100 bg-slate-50/70 last:border-b-0" />
                        ))}
                    </div>
                ) : songs.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-16 text-center shadow-sm">
                        <Music2 size={48} className="mx-auto text-slate-300 mb-3" />
                        <h3 className="text-lg font-bold text-slate-900">No songs match your criteria</h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                            {hasActiveFilters
                                ? 'Try clearing your search keyword or selecting a different choir.'
                                : 'Our Ethiopian choir songs catalog is being updated. Please check back soon.'}
                        </p>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
                            >
                                Clear All Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="max-h-[80vh] overflow-y-auto [scrollbar-color:#94a3b8_#f8fafc] [scrollbar-width:thin]">
                            <div className="sticky top-0 z-10 hidden grid-cols-[minmax(0,1.5fr)_minmax(140px,1fr)_minmax(140px,0.8fr)_auto] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 sm:grid">
                                <span>Song</span>
                                <span>Created by Choir</span>
                                <span>Ethiopian Scale</span>
                                <span className="text-right">Likes</span>
                            </div>
                            {songs.map((song, index) => (
                                <div key={song.id} className="grid gap-3 border-b border-slate-100 px-4 py-3.5 last:border-b-0 hover:bg-blue-50/40 sm:grid-cols-[minmax(0,1.5fr)_minmax(140px,1fr)_minmax(140px,0.8fr)_auto] sm:items-center sm:gap-4 sm:px-5">
                                    <div className="min-w-0">
                                        <span className="mr-2 text-xs font-semibold text-slate-400">{String(index + 1).padStart(2, '0')}</span>
                                        <Link to={`/songs/${song.id}`} className="font-bold text-slate-900 transition hover:text-blue-700">
                                            {song.title}
                                        </Link>
                                        <p className="mt-1 text-xs text-slate-500 sm:hidden">{song.choir?.name || 'Choir MKC'} · {formatScale(song.scale, song.scale_mode)}</p>
                                    </div>
                                    <span className="hidden truncate text-sm text-slate-600 sm:block">{song.choir?.name || 'Choir MKC'}</span>
                                    <span className="hidden text-sm capitalize text-slate-600 sm:block">{formatScale(song.scale, song.scale_mode)}</span>
                                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                                        <span className="text-xs font-semibold text-slate-500 sm:hidden">{song.likes_count || 0} likes</span>
                                        <button type="button" onClick={() => handleLikeToggle(song)} disabled={!isAuthenticated || likingSongId === song.id} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${song.is_liked ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600'}`} aria-label={isAuthenticated ? `${song.is_liked ? 'Unlike' : 'Like'} ${song.title}` : 'Sign in to like songs'}>
                                            <Heart size={14} className={song.is_liked ? 'fill-current' : ''} />
                                            <span className="hidden sm:inline">{song.likes_count || 0}</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 4. PAGINATION — Page numbers + Prev / Next */}
                {pagination.last_page > 1 && (
                    <div className="mt-12 flex items-center justify-center gap-1.5 flex-wrap">
                        {/* Previous */}
                        <button
                            type="button"
                            onClick={() => {
                                setPage((p) => Math.max(1, p - 1));
                                window.scrollTo({ top: 240, behavior: 'smooth' });
                            }}
                            disabled={page <= 1}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={15} /> Previous
                        </button>

                        {/* Page number buttons */}
                        {(() => {
                            const total = pagination.last_page;
                            const current = pagination.current_page;
                            // Generate a windowed page list: always show 1, last, and pages around current
                            const pages = [];
                            const window = 2;
                            let prev = -1;
                            for (let p = 1; p <= total; p++) {
                                if (
                                    p === 1 ||
                                    p === total ||
                                    (p >= current - window && p <= current + window)
                                ) {
                                    if (prev !== -1 && p - prev > 1) {
                                        pages.push('...');
                                    }
                                    pages.push(p);
                                    prev = p;
                                }
                            }
                            return pages.map((p, i) =>
                                p === '...' ? (
                                    <span
                                        key={`ellipsis-${i}`}
                                        className="px-2 py-2.5 text-xs font-semibold text-slate-400"
                                    >
                                        …
                                    </span>
                                ) : (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => {
                                            setPage(p);
                                            window.scrollTo({ top: 240, behavior: 'smooth' });
                                        }}
                                        className={`min-w-[38px] rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
                                            p === current
                                                ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                )
                            );
                        })()}

                        {/* Next */}
                        <button
                            type="button"
                            onClick={() => {
                                setPage((p) => Math.min(pagination.last_page, p + 1));
                                window.scrollTo({ top: 240, behavior: 'smooth' });
                            }}
                            disabled={page >= pagination.last_page}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Next <ChevronRight size={15} />
                        </button>
                    </div>
                )}
            </main>

            {/* Persistent Audio Player Bar */}
            {playingSong && (
                <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur-md">
                    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
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
                                    className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
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
            />
        </div>
    );
}


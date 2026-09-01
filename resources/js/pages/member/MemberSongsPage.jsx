import { useEffect, useState, useMemo, useCallback } from 'react';
import {
    Music2,
    Search,
    RefreshCw,
    Download,
    FileText,
    Play,
    X,
    Disc3,
} from 'lucide-react';
import { api } from '../../axios';
import Alert from '../../components/ui/Alert';
import EmptyState from '../../components/member/EmptyState';
import MemberSongLyricsModal from '../../components/member/MemberSongLyricsModal';

/* ─────────────────────── Mini Audio Player ─────────────────────── */
function MiniAudioPlayer({ audioUrl, onClose }) {
    return (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-2xl border border-blue-200 bg-white px-5 py-3 shadow-2xl ring-1 ring-blue-100">
            <Music2 size={18} className="text-blue-600 shrink-0" />
            <audio
                controls
                autoPlay
                src={audioUrl}
                className="h-8 w-56 sm:w-72"
                onEnded={onClose}
            />
            <button
                onClick={onClose}
                className="rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close player"
            >
                <X size={16} />
            </button>
        </div>
    );
}

/* ─────────────────────── Song Card ─────────────────────── */
function SongCard({ song, onPlay, onLyrics, onDownload }) {
    return (
        <div className="group flex flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-sm ring-1 ring-slate-50 transition hover:shadow-md hover:border-blue-100">
            {/* Cover / Icon */}
            <div className="mb-3 flex items-start gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-500">
                    {song.cover_url ? (
                        <img src={song.cover_url} alt={song.title} className="h-full w-full rounded-xl object-cover" />
                    ) : (
                        <Disc3 size={26} />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-slate-900 leading-tight">{song.title}</h3>
                    {song.artist && (
                        <p className="mt-0.5 truncate text-xs text-slate-500">{song.artist}</p>
                    )}
                    {song.original_key && (
                        <span className="mt-1.5 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                            Key: {song.original_key}
                        </span>
                    )}
                </div>
            </div>

            {/* Badges */}
            <div className="mb-3 flex flex-wrap gap-1.5">
                {song.has_lyrics && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-100">
                        <FileText size={10} /> Lyrics
                    </span>
                )}
                {song.has_audio && (
                    <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-100">
                        <Play size={10} /> Audio
                    </span>
                )}
                <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500 border border-slate-100">
                    {song.choir?.name || 'Choir MKC'}
                </span>
            </div>

            {/* Actions */}
            <div className="mt-auto flex flex-wrap gap-2 pt-1">
                {song.has_lyrics && (
                    <button
                        onClick={() => onLyrics(song)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                        <FileText size={13} /> Lyrics
                    </button>
                )}
                {song.has_audio && (
                    <button
                        onClick={() => onPlay(song)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-600 hover:text-white"
                    >
                        <Play size={13} /> Play
                    </button>
                )}
                {song.has_audio && (
                    <a
                        href={song.audio_url}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                        title="Download audio"
                    >
                        <Download size={13} />
                    </a>
                )}
            </div>
        </div>
    );
}

/* ─────────────────────── Skeleton ─────────────────────── */
function SkeletonCard() {
    return (
        <div className="animate-pulse rounded-2xl border border-slate-100 bg-white p-4">
            <div className="mb-3 flex gap-3">
                <div className="h-14 w-14 rounded-xl bg-slate-200" />
                <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 w-3/4 rounded bg-slate-200" />
                    <div className="h-3 w-1/2 rounded bg-slate-200" />
                </div>
            </div>
            <div className="mb-3 flex gap-1.5">
                <div className="h-5 w-14 rounded-full bg-slate-200" />
                <div className="h-5 w-12 rounded-full bg-slate-200" />
            </div>
            <div className="flex gap-2">
                <div className="h-8 flex-1 rounded-xl bg-slate-200" />
                <div className="h-8 flex-1 rounded-xl bg-slate-200" />
            </div>
        </div>
    );
}

/* ─────────────────────── Page ─────────────────────── */
export default function MemberSongsPage({ apiPath = 'member/songs' }) {
    const [data, setData]     = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]   = useState(null);
    const [search, setSearch] = useState('');
    const [playingSong, setPlayingSong] = useState(null);
    const [lyricsSong, setLyricsSong]   = useState(null);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        api.get(`/${apiPath}`)
            .then((res) => setData(res.data?.data ?? res.data))
            .catch((err) => setError(err.message || 'Unable to load songs.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const songs = data?.songs ?? [];

    const filtered = useMemo(() => {
        if (!search.trim()) return songs;
        const q = search.toLowerCase();
        return songs.filter(
            (s) =>
                s.title?.toLowerCase().includes(q) ||
                s.artist?.toLowerCase().includes(q) ||
                s.composer?.toLowerCase().includes(q)
        );
    }, [songs, search]);

    const stats = useMemo(() => ({
        total: songs.length,
        withLyrics: songs.filter((s) => s.has_lyrics).length,
        withAudio:  songs.filter((s) => s.has_audio).length,
    }), [songs]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Songs</h1>
                    <p className="mt-0.5 text-sm text-slate-500">
                        {data?.choir ? `${data.choir.name} song library` : 'Your choir song library'}
                    </p>
                </div>
                <button
                    onClick={load}
                    disabled={loading}
                    className="flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-60"
                >
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Stats bar */}
            {!loading && !error && songs.length > 0 && (
                <div className="flex flex-wrap gap-3">
                    {[
                        { label: 'Total Songs', value: stats.total, color: 'blue' },
                        { label: 'With Lyrics', value: stats.withLyrics, color: 'emerald' },
                        { label: 'With Audio', value: stats.withAudio, color: 'indigo' },
                    ].map(({ label, value, color }) => (
                        <div
                            key={label}
                            className={`flex items-center gap-2 rounded-2xl border bg-white px-4 py-2.5 shadow-sm border-${color}-100`}
                        >
                            <span className={`text-lg font-black text-${color}-600`}>{value}</span>
                            <span className="text-xs font-medium text-slate-500">{label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Search */}
            {!loading && !error && songs.length > 0 && (
                <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search songs by title, artist, or composer…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-600"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            )}

            {/* Error */}
            {error && (
                <Alert variant="error" title="Unable to load songs">
                    <p>{error}</p>
                    <button onClick={load} className="mt-2 text-sm font-semibold underline">Try Again</button>
                </Alert>
            )}

            {/* Loading skeleton */}
            {loading && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            )}

            {/* No choir */}
            {!loading && !error && !data?.has_choir && (
                <EmptyState
                    icon={Music2}
                    title="No choir assigned"
                    message="You are not currently assigned to a choir. Songs will appear here once you're added."
                />
            )}

            {/* Empty */}
            {!loading && !error && data?.has_choir && songs.length === 0 && (
                <EmptyState
                    icon={Music2}
                    title="No songs yet"
                    message="Your choir's song library will appear here when songs are added."
                />
            )}

            {/* No search results */}
            {!loading && !error && filtered.length === 0 && songs.length > 0 && (
                <EmptyState
                    icon={Search}
                    title="No matching songs"
                    message={`No songs found for "${search}". Try a different search.`}
                />
            )}

            {/* Song grid */}
            {!loading && !error && filtered.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filtered.map((song) => (
                        <SongCard
                            key={song.id}
                            song={song}
                            onPlay={setPlayingSong}
                            onLyrics={setLyricsSong}
                            onDownload={() => {}}
                        />
                    ))}
                </div>
            )}

            {/* Mini audio player */}
            {playingSong?.audio_url && (
                <MiniAudioPlayer
                    audioUrl={playingSong.audio_url}
                    onClose={() => setPlayingSong(null)}
                />
            )}

            {/* Lyrics modal */}
            <MemberSongLyricsModal
                song={lyricsSong}
                isOpen={!!lyricsSong}
                onClose={() => setLyricsSong(null)}
            />
        </div>
    );
}

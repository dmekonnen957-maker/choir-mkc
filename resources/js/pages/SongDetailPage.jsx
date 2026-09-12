import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Music2,
    Download,
    Disc3,
    Minus,
    Plus,
    RotateCcw,
    Heart,
    Calendar,
    User,
    Share2,
    Check,
    LogIn,
} from 'lucide-react';
import AudioPlayer from '../components/public/AudioPlayer';
import LyricsViewer from '../components/public/LyricsViewer';
import Reveal from '../components/ui/Reveal';
import EmptyState from '../components/public/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import CoverImage from '../components/public/CoverImage';
import { useAuth } from '../context/AuthContext';
import { fetchPublicSong, fetchChoirSong, likeSong, unlikeSong, formatDate } from '../lib/publicApi';

const QUICK_STEPS = [-3, -2, -1, 0, 1, 2, 3];

export default function SongDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [song, setSong] = useState(null);
    const [transpose, setTranspose] = useState(0);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    // Like state
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [liking, setLiking] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setLoading(true);
        setNotFound(false);
        setTranspose(0);

        fetchPublicSong(id, 0)
            .then((data) => {
                if (!data) {
                    setNotFound(true);
                    return;
                }
                setSong(data);
                setIsLiked(Boolean(data.is_liked));
                setLikesCount(Number(data.likes_count || 0));
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [id]);

    const changeTranspose = (steps) => {
        const next = Math.max(-12, Math.min(12, steps));
        setTranspose(next);

        // Fetch transposed version
        fetchPublicSong(id, next)
            .then((updated) => {
                if (updated) {
                    setSong((prev) => ({
                        ...prev,
                        key: updated.key,
                        display_lyrics: updated.display_lyrics,
                    }));
                }
            })
            .catch(() => {
                if (song?.choir?.id) {
                    fetchChoirSong(song.choir.id, id, next).then((updated) => {
                        if (updated) {
                            setSong((prev) => ({
                                ...prev,
                                key: updated.key,
                                display_lyrics: updated.display_lyrics,
                            }));
                        }
                    });
                }
            });
    };

    const handleLikeToggle = async () => {
        if (!isAuthenticated) {
            setShowLoginModal(true);
            return;
        }

        if (liking) return;
        setLiking(true);

        const prevLiked = isLiked;
        const prevCount = likesCount;

        // Optimistic UI update
        setIsLiked(!prevLiked);
        setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

        try {
            if (prevLiked) {
                const res = await unlikeSong(song.id);
                if (res && res.likes_count !== undefined) {
                    setLikesCount(Number(res.likes_count));
                }
            } else {
                const res = await likeSong(song.id);
                if (res && res.likes_count !== undefined) {
                    setLikesCount(Number(res.likes_count));
                }
            }
        } catch {
            // Revert on failure
            setIsLiked(prevLiked);
            setLikesCount(prevCount);
        } finally {
            setLiking(false);
        }
    };

    const handleShare = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center bg-white">
                <LoadingSpinner text="Loading Ethiopian choir song..." />
            </div>
        );
    }

    if (notFound || !song) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-24">
                <EmptyState
                    icon={Music2}
                    title="This song could not be found."
                    message="It may be private, unpublished, or removed."
                    action={
                        <Link
                            to="/songs"
                            className="inline-flex items-center gap-2 rounded-full bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-blue-800"
                        >
                            <ArrowLeft size={16} /> Back to Songs
                        </Link>
                    }
                />
            </div>
        );
    }

    const choir = song.choir;
    const coverPath = song.cover_image_path || song.cover_url;

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Login Prompt Modal for unauthenticated likes */}
            {showLoginModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                            <Heart size={24} className="fill-rose-500 text-rose-500" />
                        </div>
                        <h3 className="mt-4 text-xl font-bold text-slate-900">
                            Sign in to like this song
                        </h3>
                        <p className="mt-2 text-sm text-slate-600">
                            Create a free account or sign in to save <strong className="font-semibold text-slate-800">{song.title}</strong> to your liked songs collection and support our choirs.
                        </p>
                        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse sm:justify-start">
                            <Link
                                to={`/login?redirect=/songs/${song.id}`}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
                            >
                                <LogIn size={16} /> Sign In
                            </Link>
                            <Link
                                to={`/register?redirect=/songs/${song.id}`}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Register
                            </Link>
                            <button
                                type="button"
                                onClick={() => setShowLoginModal(false)}
                                className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 sm:mr-auto"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Song Hero Section */}
            <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-white via-blue-50/40 to-slate-50/80 pb-12 pt-8 sm:pb-16 sm:pt-12">
                <div className="pointer-events-none absolute -top-24 -right-20 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" />
                <div className="pointer-events-none absolute bottom-0 left-10 h-72 w-72 rounded-full bg-indigo-100/40 blur-3xl" />

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Navigation bar breadcrumb */}
                    <div className="flex items-center justify-between">
                        <Link
                            to="/songs"
                            className="group inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-blue-700"
                        >
                            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                            Back to Discover Songs
                        </Link>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleShare}
                                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition-colors hover:bg-slate-50 hover:text-blue-700"
                            >
                                {copied ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
                                {copied ? 'Link Copied!' : 'Share'}
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 grid gap-10 lg:grid-cols-[340px_1fr] lg:gap-14">
                        {/* Cover Column */}
                        <Reveal>
                            <div className="space-y-4">
                                <div className="group relative aspect-square w-full overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-900 shadow-xl ring-1 ring-slate-900/5">
                                    <CoverImage
                                        src={coverPath}
                                        label={song.title}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                </div>

                                {/* Prominent Like Card */}
                                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div>
                                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Audience Love
                                        </div>
                                        <div className="mt-0.5 flex items-baseline gap-1.5">
                                            <span className="text-2xl font-black text-slate-900">{likesCount}</span>
                                            <span className="text-sm font-medium text-slate-500">
                                                {likesCount === 1 ? 'like' : 'likes'}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleLikeToggle}
                                        disabled={liking}
                                        aria-label={isLiked ? 'Unlike song' : 'Like song'}
                                        className={`group relative flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold text-sm transition-all duration-200 shadow-sm active:scale-95 ${
                                            isLiked
                                                ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 hover:border-rose-300'
                                                : 'bg-white text-slate-700 border border-slate-300 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50/50'
                                        }`}
                                    >
                                        <Heart
                                            size={18}
                                            className={`transition-transform group-hover:scale-110 ${
                                                isLiked
                                                    ? 'fill-rose-500 text-rose-500'
                                                    : 'text-slate-400 group-hover:text-rose-500'
                                            }`}
                                        />
                                        <span>{isLiked ? 'Liked' : 'Like Song'}</span>
                                    </button>
                                </div>
                            </div>
                        </Reveal>

                        {/* Song Details Column */}
                        <div className="flex flex-col justify-center">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-800">
                                    <Music2 size={13} /> Ethiopian Choir Song
                                </span>
                                {song.song_category?.name && (
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                        {song.song_category.name}
                                    </span>
                                )}
                            </div>

                            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                                {song.title}
                            </h1>

                            {/* Choir Info */}
                            {choir?.name && (
                                <div className="mt-3 flex items-center gap-2">
                                    <span className="text-sm text-slate-500">Created by:</span>
                                    <Link
                                        to={`/choirs/${choir.id}`}
                                        className="inline-flex items-center gap-1.5 text-base font-semibold text-blue-700 transition-colors hover:text-blue-800 hover:underline"
                                    >
                                        <Disc3 size={16} />
                                        {choir.name}
                                    </Link>
                                </div>
                            )}

                            {/* Credits grid */}
                            <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-slate-200/80 bg-white/70 p-4 backdrop-blur-xs sm:grid-cols-3">
                                {song.composer && (
                                    <div>
                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Composer</span>
                                        <p className="mt-0.5 text-sm font-medium text-slate-900">{song.composer}</p>
                                    </div>
                                )}
                                {song.artist && (
                                    <div>
                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Artist / Lead</span>
                                        <p className="mt-0.5 text-sm font-medium text-slate-900">{song.artist}</p>
                                    </div>
                                )}
                                {song.arranger && (
                                    <div>
                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Arranger</span>
                                        <p className="mt-0.5 text-sm font-medium text-slate-900">{song.arranger}</p>
                                    </div>
                                )}
                                {song.created_at && (
                                    <div>
                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Date Added</span>
                                        <p className="mt-0.5 text-sm font-medium text-slate-900">{formatDate(song.created_at)}</p>
                                    </div>
                                )}
                                {song.language && (
                                    <div>
                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Language</span>
                                        <p className="mt-0.5 text-sm font-medium text-slate-900">{song.language}</p>
                                    </div>
                                )}
                            </div>

                            {/* Audio Player */}
                            {song.audio_url && (
                                <div className="mt-8 space-y-3">
                                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Listen to Track
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-md">
                                        <AudioPlayer src={song.audio_url} title={song.title} />
                                    </div>
                                    <a
                                        href={song.audio_url}
                                        download
                                        className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 hover:text-blue-800 hover:underline"
                                    >
                                        <Download size={14} /> Download Audio
                                    </a>
                                </div>
                            )}

                            {/* Description */}
                            {song.description && (
                                <div className="mt-8 border-t border-slate-200 pt-6">
                                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">About this song</h2>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                                        {song.description}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Lyrics are available only to authenticated members. */}
            {isAuthenticated && <section className="py-12 sm:py-16">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <Reveal>
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                                        Lyrics & Chords
                                    </h2>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Adjust pitch transpose to fit your vocal range.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => changeTranspose(transpose - 1)}
                                        disabled={transpose <= -12}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                                        title="Down a semitone"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <span className="min-w-[100px] text-center text-sm font-bold text-slate-800">
                                        {transpose > 0 ? `+${transpose}` : transpose} semitone
                                        {transpose === 1 || transpose === -1 ? '' : 's'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => changeTranspose(transpose + 1)}
                                        disabled={transpose >= 12}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                                        title="Up a semitone"
                                    >
                                        <Plus size={16} />
                                    </button>
                                    {transpose !== 0 && (
                                        <button
                                            type="button"
                                            onClick={() => changeTranspose(0)}
                                            className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                            title="Reset transpose"
                                        >
                                            <RotateCcw size={14} /> Reset
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Quick Semitone Steps */}
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                <span className="text-xs font-medium text-slate-500 mr-1">Quick transpose:</span>
                                {QUICK_STEPS.map((s) => (
                                    <button
                                        type="button"
                                        key={s}
                                        onClick={() => changeTranspose(s)}
                                        className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                                            transpose === s
                                                ? 'bg-blue-700 text-white shadow-xs'
                                                : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        {s > 0 ? `+${s}` : s}
                                    </button>
                                ))}
                            </div>

                            {/* Lyrics Viewer */}
                            <div className="mt-8">
                                <LyricsViewer lyrics={song.display_lyrics || song.lyrics} />
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>}
        </div>
    );
}

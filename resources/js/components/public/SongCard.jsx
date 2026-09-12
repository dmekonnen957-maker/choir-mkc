import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Play, Pause, ArrowRight, Disc3, Music2, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { likeSong, unlikeSong, formatDate } from '../../lib/publicApi';
import CoverImage from './CoverImage';

export default function SongCard({
    song,
    onPlay,
    isPlaying = false,
    onLikeChanged,
    onPromptLogin,
}) {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [isLiked, setIsLiked] = useState(Boolean(song.is_liked));
    const [likesCount, setLikesCount] = useState(Number(song.likes_count || 0));
    const [liking, setLiking] = useState(false);
    const [showLoginTooltip, setShowLoginTooltip] = useState(false);

    const choirName = song.choir?.name || 'Choir MKC';
    const hasAudio = Boolean(song.audio_url || song.has_audio);

    const handleLikeClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            if (onPromptLogin) {
                onPromptLogin(song);
            } else {
                setShowLoginTooltip(true);
                setTimeout(() => setShowLoginTooltip(false), 3000);
            }
            return;
        }

        if (liking) return;
        setLiking(true);

        const nextLiked = !isLiked;
        const nextCount = nextLiked ? likesCount + 1 : Math.max(0, likesCount - 1);

        // Optimistic UI update
        setIsLiked(nextLiked);
        setLikesCount(nextCount);

        try {
            if (nextLiked) {
                const res = await likeSong(song.id);
                if (res?.likes_count !== undefined) {
                    setLikesCount(res.likes_count);
                }
            } else {
                const res = await unlikeSong(song.id);
                if (res?.likes_count !== undefined) {
                    setLikesCount(res.likes_count);
                }
            }
            if (onLikeChanged) {
                onLikeChanged(song.id, nextLiked, nextCount);
            }
        } catch (err) {
            // Revert on error
            setIsLiked(!nextLiked);
            setLikesCount(likesCount);
        } finally {
            setLiking(false);
        }
    };

    const handlePlayClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onPlay) onPlay(song);
    };

    return (
        <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">
            {/* Artwork / Cover Container */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
                {song.cover_url ? (
                    <CoverImage
                        src={song.cover_url}
                        alt={song.title}
                        label={song.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-950 p-6 text-center text-white/50">
                        <Music2 size={44} className="text-blue-400/70 mb-2 transition-transform duration-500 group-hover:scale-110" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200/60 truncate max-w-full">
                            {choirName}
                        </span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />

                {/* Audio quick play button on top right */}
                {hasAudio && (
                    <button
                        type="button"
                        onClick={handlePlayClick}
                        className={`absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full shadow-lg backdrop-blur-md transition-all duration-200 active:scale-95 ${
                            isPlaying
                                ? 'bg-blue-600 text-white ring-2 ring-white/60'
                                : 'bg-white/90 text-blue-700 hover:bg-blue-600 hover:text-white'
                        }`}
                        title={isPlaying ? 'Pause' : 'Play audio preview'}
                        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                    >
                        {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5 fill-current" />}
                    </button>
                )}

                {/* Unauthenticated Login Tooltip */}
                {showLoginTooltip && (
                    <div className="absolute inset-x-3 bottom-3 z-30 rounded-xl bg-slate-950/95 p-2.5 text-center text-xs text-white shadow-2xl backdrop-blur-md border border-slate-700 animate-fade-in">
                        <p className="font-semibold">Login to like this song</p>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate('/login');
                            }}
                            className="mt-1.5 inline-block rounded-lg bg-blue-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-blue-500"
                        >
                            Sign In →
                        </button>
                    </div>
                )}
            </div>

            {/* Card Content Body */}
            <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                    <h3 className="text-lg font-extrabold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        <Link to={`/songs/${song.id}`}>
                            {song.title}
                        </Link>
                    </h3>

                    {/* Choir info: Created by: Choir Name */}
                    <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <span className="font-medium text-slate-400">Created by:</span>
                        {song.choir?.id ? (
                            <Link
                                to={`/choirs/${song.choir.id}`}
                                className="font-semibold text-slate-700 hover:text-blue-600 transition-colors truncate"
                            >
                                {choirName}
                            </Link>
                        ) : (
                            <span className="font-semibold text-slate-700 truncate">{choirName}</span>
                        )}
                    </div>

                    {/* Song date */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        {song.created_at && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-400 ml-auto">
                                <Calendar size={12} />
                                {formatDate(song.created_at)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Bottom Actions: Like button & count + View button */}
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5">
                    {/* Like button & Like count */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={handleLikeClick}
                            disabled={liking}
                            className={`group/like inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-200 active:scale-95 ${
                                isLiked
                                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                    : 'bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 border border-slate-200/60'
                            }`}
                            title={isLiked ? 'Unlike this song' : 'Like this song'}
                            aria-label={`${likesCount} likes. Click to ${isLiked ? 'unlike' : 'like'}`}
                        >
                            <Heart
                                size={16}
                                className={`transition-transform group-hover/like:scale-110 ${
                                    isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-400 group-hover/like:text-rose-500'
                                }`}
                            />
                            <span>{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>
                        </button>
                    </div>

                    {/* View Song button */}
                    <Link
                        to={`/songs/${song.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition group/link"
                    >
                        <span>View Song</span>
                        <ArrowRight size={14} className="transition-transform group-hover/link:translate-x-1" />
                    </Link>
                </div>
            </div>
        </article>
    );
}
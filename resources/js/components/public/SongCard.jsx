import { Play, Pause, Music2, BookOpen, Download, Share2, Disc3 } from 'lucide-react';

export default function SongCard({
    song,
    onPlay,
    onViewLyrics,
    onShare,
    isPlaying = false,
}) {
    const choirName = song.choir?.name || 'Choir MKC';

    const handlePlayClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onPlay) onPlay(song);
    };

    const handleLyricsClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onViewLyrics) onViewLyrics(song);
    };

    const handleShareClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onShare) onShare(song);
    };

    return (
        <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl">
            {/* Artwork Container */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
                {song.cover_url ? (
                    <img
                        src={song.cover_url}
                        alt={song.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-blue-400/80 transition-transform duration-500 group-hover:scale-110">
                        <Music2 className="h-16 w-16 stroke-[1.5]" />
                    </div>
                )}

                {/* Floating Share button */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={handleShareClick}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-md backdrop-blur-md transition hover:bg-white hover:text-blue-600 active:scale-90"
                        title="Share song"
                    >
                        <Share2 size={14} />
                    </button>
                </div>
            </div>

            {/* Song Content */}
            <div className="flex flex-1 flex-col p-4 sm:p-5">
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-base truncate">
                        {song.title}
                    </h3>
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500 truncate">
                        <Disc3 size={13} className="text-blue-500 shrink-0" />
                        <span className="truncate">{choirName}</span>
                    </p>
                </div>

                {/* Primary Play Button / Action */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
                    {song.audio_url ? (
                        <button
                            type="button"
                            onClick={handlePlayClick}
                            className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-200 ${
                                isPlaying
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                    : 'bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white hover:shadow-md'
                            }`}
                        >
                            {isPlaying ? (
                                <>
                                    <Pause size={15} /> Pause Audio
                                </>
                            ) : (
                                <>
                                    <Play size={15} className="fill-current" /> Play Audio
                                </>
                            )}
                        </button>
                    ) : (
                        <div className="py-1 text-center text-xs text-slate-400 italic">
                            No audio recording
                        </div>
                    )}

                    {/* Secondary Actions: View Lyrics & Download */}
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <button
                            type="button"
                            onClick={handleLyricsClick}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-700 active:scale-95"
                        >
                            <BookOpen size={14} className="text-blue-600 shrink-0" />
                            <span className="truncate">View Lyrics</span>
                        </button>

                        {song.audio_url ? (
                            <a
                                href={song.audio_url}
                                download
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-700 active:scale-95"
                            >
                                <Download size={14} className="text-slate-500 shrink-0" />
                                <span className="truncate">Download</span>
                            </a>
                        ) : (
                            <div className="flex items-center justify-center rounded-xl border border-slate-100 bg-slate-50 px-2 py-2 text-xs text-slate-300">
                                No audio
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
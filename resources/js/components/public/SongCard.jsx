import { Link } from 'react-router-dom';
import { Play, Pause, Music2, Volume2 } from 'lucide-react';
import { useState, useRef } from 'react';
import CoverImage from './CoverImage';

export default function SongCard({ song, onPlay, isPlaying = false }) {
    const choirName = song.choir?.name;
    const [playError, setPlayError] = useState(false);

    const handlePlayClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onPlay) {
            onPlay(song);
        }
    };

    return (
        <div className="group w-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:border-blue-200 hover:shadow-lg">
            <div className="flex items-center gap-4 p-4">
                {/* Artwork */}
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                    <div className="h-full w-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                        <Music2 className="h-8 w-8 text-blue-400" />
                    </div>
                </div>

                {/* Song Info */}
                <div className="flex-1 min-w-0">
                    <Link to={`/songs/${song.id}`} className="block">
                        <h3 className="font-semibold text-slate-900 hover:text-blue-600 transition-colors truncate">
                            {song.title}
                        </h3>
                    </Link>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Music2 size={12} className="text-blue-500" />
                        {choirName || 'Yeka MKC Choirs and Worship Teams'}
                    </p>
                    {song.artist && (
                        <p className="text-xs text-slate-400 truncate">{song.artist}</p>
                    )}
                </div>

                {/* Play Button */}
                {song.audio_url ? (
                    <button
                        onClick={handlePlayClick}
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
                    >
                        {isPlaying ? (
                            <Pause className="h-7 w-7" />
                        ) : (
                            <Play className="h-7 w-7 ml-0.5" />
                        )}
                    </button>
                ) : (
                    <div className="shrink-0 text-slate-300">
                        <Volume2 className="h-5 w-5" />
                    </div>
                )}

                {/* Audio Indicator */}
                {song.audio_url && (
                    <div className="shrink-0 hidden sm:block">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
                            <Volume2 className="h-3 w-3" /> Audio
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
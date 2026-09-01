import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

export default function AudioPlayer({ src, className = '', title = '', artist = '' }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef(null);
    const progressRef = useRef(null);

    useEffect(() => {
        if (!src) return;

        const audio = audioRef.current;
        if (!audio) return;

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        const handleError = () => {
            console.error('Audio error:', audio.error);
            setIsPlaying(false);
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
        };
    }, [src]);

    const togglePlay = async () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            try {
                await audio.play();
                setIsPlaying(true);
            } catch (error) {
                console.error('Audio playback failed:', error);
                setIsPlaying(false);
            }
        }
    };

    const handleProgressClick = (e) => {
        const audio = audioRef.current;
        if (!audio || !progressRef.current) return;

        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(1, x / rect.width));
        audio.currentTime = percent * duration;
    };

    const toggleMute = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isMuted) {
            audio.volume = volume;
            setIsMuted(false);
        } else {
            audio.volume = 0;
            setIsMuted(true);
        }
    };

    const formatTime = (time) => {
        if (!time || isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    if (!src) {
        return (
            <div className="rounded-xl bg-slate-100 p-4 text-center text-sm text-slate-400">
                <Volume2 className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                Audio preview is not available for this song.
            </div>
        );
    }

    return (
        <div className={`rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4 ${className}`}>
            <audio ref={audioRef} src={src} preload="metadata" />

            {/* Title/Artist */}
            {(title || artist) && (
                <div className="mb-3">
                    {title && <p className="font-semibold text-slate-800">{title}</p>}
                    {artist && <p className="text-sm text-slate-500">{artist}</p>}
                </div>
            )}

            <div className="flex items-center gap-4">
                {/* Play/Pause Button */}
                <button
                    onClick={togglePlay}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all hover:scale-105"
                >
                    {isPlaying ? (
                        <Pause className="h-6 w-6" />
                    ) : (
                        <Play className="h-6 w-6 ml-0.5" />
                    )}
                </button>

                {/* Progress Bar */}
                <div className="flex-1 min-w-0">
                    <div
                        ref={progressRef}
                        onClick={handleProgressClick}
                        className="relative h-1.5 w-full cursor-pointer rounded-full bg-blue-200/60"
                    >
                        <div
                            className="absolute h-full rounded-full bg-blue-600 transition-all"
                            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                        />
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-slate-500">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Volume Control */}
                <button
                    onClick={toggleMute}
                    className="text-slate-500 hover:text-slate-700 transition-colors"
                >
                    {isMuted ? (
                        <VolumeX className="h-5 w-5" />
                    ) : (
                        <Volume2 className="h-5 w-5" />
                    )}
                </button>
            </div>
        </div>
    );
}
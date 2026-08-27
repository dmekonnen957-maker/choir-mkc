import { Link } from 'react-router-dom';
import { Play, Music2 } from 'lucide-react';
import CoverImage from './CoverImage';

export default function SongCard({ song, onPlay }) {
    const choirName = song.choir?.name;
    return (
        <div className="group flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">
            <div className="relative aspect-square w-full overflow-hidden">
                <div className="h-full w-full transition-transform duration-700 group-hover:scale-105">
                    <CoverImage src={song.cover_image_path} label={song.title} className="h-full w-full" />
                </div>
                <button
                    type="button"
                    onClick={() => (onPlay ? onPlay(song) : null)}
                    aria-label={`Play ${song.title}`}
                    className="absolute inset-0 flex items-center justify-center bg-slate-900/0 opacity-0 transition-all duration-300 group-hover:bg-slate-900/30 group-hover:opacity-100"
                >
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-blue-700 shadow-lg transition-transform duration-300 group-hover:scale-105">
                        <Play size={22} className="ml-0.5" />
                    </span>
                </button>
            </div>
            <div className="flex flex-1 flex-col p-4">
                <Link to={`/songs/${song.id}`} className="text-sm font-semibold leading-snug tracking-tight text-slate-900 hover:text-blue-700">
                    {song.title}
                </Link>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <Music2 size={13} className="text-blue-500" />
                    {choirName || 'EKA MKC Choirs and Worship Teams'}
                </p>
            </div>
        </div>
    );
}

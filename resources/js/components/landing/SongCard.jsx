import { Link } from 'react-router-dom';
import { Music2, BookOpen } from 'lucide-react';
import Reveal from '../ui/Reveal';
import { getChoirById } from '../../data/landingData';

export default function SongCard({ song, index = 0 }) {
    const choir = getChoirById(song.choirId);
    return (
        <Reveal direction="up" delay={(index % 3) * 90}>
            <article className="group flex h-full flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blue-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                        <Music2 size={20} />
                    </span>
                    <span className="text-xs font-medium text-ink-400">{song.language}</span>
                </div>
                <h3 className="mt-5 text-xl font-semibold text-blue-900">{song.title}</h3>
                <p className="mt-1 text-sm text-ink-500">{song.composer}</p>
                <p className="mt-3 text-sm text-ink-600">{choir?.name}</p>
                {song.year && <p className="mt-1 text-xs text-ink-400">{song.year}</p>}
                <Link
                    to={`/songs/${song.id}`}
                    className="mt-5 inline-flex items-center gap-2 self-start rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50"
                >
                    <BookOpen size={16} />
                    Read Lyrics
                </Link>
            </article>
        </Reveal>
    );
}

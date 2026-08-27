import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Music2, Play, Download, Disc3, Minus, Plus, RotateCcw } from 'lucide-react';
import AudioPlayer from '../components/public/AudioPlayer';
import LyricsViewer from '../components/public/LyricsViewer';
import Reveal from '../components/ui/Reveal';
import EmptyState from '../components/public/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { fetchAllSongs, fetchChoirSong } from '../lib/publicApi';

const SCALE_LABELS = {
    major: 'Major',
    minor: 'Minor',
    ethiopian: 'Ethiopian',
};

const QUICK_STEPS = [-2, -1, 0, 1, 2, 3];

export default function SongDetailPage() {
    const { id } = useParams();
    const [song, setSong] = useState(null);
    const [transpose, setTranspose] = useState(0);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        setLoading(true);
        setNotFound(false);
        setTranspose(0);
        fetchAllSongs()
            .then((songs) => songs.find((s) => String(s.id) === String(id)) ?? null)
            .then((found) => {
                if (!found) {
                    setNotFound(true);
                    return;
                }
                const choirId = found.choir?.id;
                return fetchChoirSong(choirId, id, 0).then(setSong);
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [id]);

    const changeTranspose = (steps) => {
        const next = Math.max(-12, Math.min(12, steps));
        setTranspose(next);
        if (!song?.choir?.id) return;
        fetchChoirSong(song.choir.id, id, next).then(setSong);
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center bg-white">
                <LoadingSpinner text="Loading song..." />
            </div>
        );
    }

    if (notFound || !song) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-24">
                <EmptyState
                    icon={Music2}
                    title="This song could not be found."
                    message="It may be private or not yet published."
                    action={
                        <Link
                            to="/songs"
                            className="inline-flex items-center gap-2 rounded-full bg-blue-700 px-6 py-3 text-sm font-semibold text-white"
                        >
                            <ArrowLeft size={16} /> Back to Songs
                        </Link>
                    }
                />
            </div>
        );
    }

    const choir = song.choir;

    return (
        <div className="bg-white">
            <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 to-white pb-12 pt-14 sm:pb-16 sm:pt-20">
                <div className="pointer-events-none absolute -top-24 -right-20 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <Link
                        to="/songs"
                        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-blue-700"
                    >
                        <ArrowLeft size={16} /> All Songs
                    </Link>

                    <div className="mt-6 grid gap-10 lg:grid-cols-[340px_1fr] lg:gap-14">
                        <Reveal>
                            <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl">
                                <div className="flex aspect-square w-full items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 text-indigo-300">
                                    <Music2 size={72} />
                                </div>
                            </div>
                        </Reveal>

                        <div className="flex flex-col">
                            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 ring-1 ring-inset ring-blue-100">
                                <Music2 size={14} /> Song
                            </span>
                            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                                {song.title}
                            </h1>
                            {choir?.name && (
                                <Link
                                    to={`/choirs/${choir.id}`}
                                    className="mt-3 inline-flex w-fit items-center gap-2 text-base font-medium text-blue-700 hover:text-blue-800"
                                >
                                    <Disc3 size={16} /> {choir.name}
                                </Link>
                            )}

                            <div className="mt-6 flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                                    Key: {song.key || '—'}
                                </span>
                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                                    {song.scale ? SCALE_LABELS[song.scale] ?? song.scale : 'No scale'}
                                </span>
                                {transpose !== 0 && (
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                                        Original: {song.original_key}
                                    </span>
                                )}
                                {song.artist && (
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                                        {song.artist}
                                    </span>
                                )}
                            </div>

                            <div className="mt-8">
                                <AudioPlayer src={song.audio_url} />
                            </div>

                            {song.audio_url && (
                                <a
                                    href={song.audio_url}
                                    download
                                    className="mt-4 inline-flex w-fit items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800"
                                >
                                    <Download size={16} /> Download
                                </a>
                            )}

                            {song.description && (
                                <div className="mt-8">
                                    <h2 className="text-lg font-semibold text-slate-900">About this song</h2>
                                    <p className="mt-2 max-w-2xl leading-relaxed text-slate-600">
                                        {song.description}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-white py-12 sm:py-16">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <Reveal>
                        <div className="rounded-3xl border border-slate-100 bg-blue-50/50 p-8 sm:p-12">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                                    Lyrics & Chords
                                </h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => changeTranspose(transpose - 1)}
                                        disabled={transpose <= -12}
                                        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                                        title="Down a semitone"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <span className="w-24 text-center text-sm font-semibold text-slate-700">
                                        {transpose > 0 ? `+${transpose}` : transpose} semitone
                                        {transpose === 1 || transpose === -1 ? '' : 's'}
                                    </span>
                                    <button
                                        onClick={() => changeTranspose(transpose + 1)}
                                        disabled={transpose >= 12}
                                        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                                        title="Up a semitone"
                                    >
                                        <Plus size={16} />
                                    </button>
                                    {transpose !== 0 && (
                                        <button
                                            onClick={() => changeTranspose(0)}
                                            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
                                            title="Reset"
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {QUICK_STEPS.map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => changeTranspose(s)}
                                        className={`rounded-lg px-3 py-1 text-sm font-medium ${
                                            transpose === s
                                                ? 'bg-indigo-600 text-white'
                                                : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        {s > 0 ? `+${s}` : s}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-6">
                                <LyricsViewer lyrics={song.display_lyrics} />
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>
        </div>
    );
}

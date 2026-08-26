import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Music2, Play, Download, Mic2, Disc3 } from 'lucide-react';
import CoverImage from '../components/public/CoverImage';
import AudioPlayer from '../components/public/AudioPlayer';
import Reveal from '../components/ui/Reveal';
import EmptyState from '../components/public/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { fetchAllSongs } from '../lib/publicApi';

export default function SongDetailPage() {
    const { id } = useParams();
    const [song, setSong] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllSongs()
            .then((songs) => songs.find((s) => String(s.id) === String(id)) ?? null)
            .then(setSong)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center bg-white">
                <LoadingSpinner text="Loading song..." />
            </div>
        );
    }

    if (!song) {
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
                                <div className="aspect-square w-full">
                                    <CoverImage src={song.cover_image_path} label={song.title} className="h-full w-full" />
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

                            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                                {song.composer && <Meta icon={Mic2} label="Composer" value={song.composer} />}
                                {song.artist && <Meta icon={Disc3} label="Artist" value={song.artist} />}
                                {song.song_category?.name && (
                                    <Meta icon={Music2} label="Category" value={song.song_category.name} />
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
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <Reveal>
                        <div className="rounded-3xl border border-slate-100 bg-blue-50/50 p-8 text-center sm:p-12">
                            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                                <Play size={22} />
                            </span>
                            <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                                Listen and Sing Along
                            </h2>
                            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-500">
                                Press play above to enjoy “{song.title}”. Share it with your choir and bring
                                this song into your next gathering.
                            </p>
                        </div>
                    </Reveal>
                </div>
            </section>
        </div>
    );
}

function Meta({ icon: Icon, label, value }) {
    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                <Icon size={13} /> {label}
            </p>
            <p className="mt-1.5 truncate text-sm font-semibold text-slate-800">{value}</p>
        </div>
    );
}

import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, BookOpen } from 'lucide-react';
import ChoirArtwork from '../components/landing/ChoirArtwork';
import Reveal from '../components/ui/Reveal';
import DemoBadge from '../components/ui/DemoBadge';
import { getSongById, getChoirById, getAdjacentSong, songs } from '../data/landingData';

export default function SongDetailPage() {
    const { id } = useParams();
    const song = getSongById(id);

    if (!song) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-24 text-center">
                <h1 className="text-2xl font-semibold text-blue-900">Song not found</h1>
                <Link to="/songs" className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                    Back to songs
                </Link>
            </div>
        );
    }

    const choir = getChoirById(song.choirId);
    const { prev, next } = getAdjacentSong(songs, song.id);

    return (
        <>
            <section className="relative overflow-hidden bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 pb-12 pt-12 sm:pb-16">
                <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
                <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <Link to="/songs" className="inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-white">
                        <ArrowLeft size={16} /> All songs
                    </Link>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <h1 className="text-3xl font-semibold text-white sm:text-4xl">{song.title}</h1>
                        <DemoBadge className="bg-white/15 text-white ring-white/30" />
                    </div>
                    <p className="mt-2 text-blue-100">{choir?.name}</p>
                </div>
            </section>

            <section className="bg-surface py-12 sm:py-16">
                <div className="mx-auto grid max-w-5xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:px-8">
                    {/* META */}
                    <Reveal direction="left">
                        <div className="overflow-hidden rounded-3xl shadow-lg ring-1 ring-blue-100">
                            <ChoirArtwork variant="glow" seed={song.id * 3 + 1} className="aspect-[4/3] w-full" label={song.title} />
                        </div>
                        <dl className="mt-6 space-y-3 rounded-2xl border border-blue-100 bg-white p-6 text-sm">
                            <div className="flex justify-between gap-4"><dt className="text-ink-500">Choir</dt><dd className="text-right font-medium text-blue-900">{choir?.name ?? '—'}</dd></div>
                            <div className="flex justify-between gap-4"><dt className="text-ink-500">Composer</dt><dd className="text-right font-medium text-blue-900">{song.composer}</dd></div>
                            <div className="flex justify-between gap-4"><dt className="text-ink-500">Arranger</dt><dd className="text-right font-medium text-blue-900">{song.arranger ?? '—'}</dd></div>
                            <div className="flex justify-between gap-4"><dt className="text-ink-500">Language</dt><dd className="text-right font-medium text-blue-900">{song.language}</dd></div>
                            <div className="flex justify-between gap-4"><dt className="text-ink-500">Year</dt><dd className="text-right font-medium text-blue-900">{song.year ?? '—'}</dd></div>
                        </dl>
                        <div className="mt-4 flex gap-3">
                            {song.isDemo && (
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-sm text-blue-700">
                                    <BookOpen size={15} /> Lyrics available
                                </span>
                            )}
                            {/* Download only when a public file exists (none in demo) */}
                            {false && (
                                <a href="#" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                                    <Download size={15} /> Download
                                </a>
                            )}
                        </div>
                    </Reveal>

                    {/* LYRICS */}
                    <Reveal direction="up">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-600">Lyrics</h2>
                        {song.isPublished === false ? (
                            <p className="mt-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-ink-600">
                                These lyrics are not published for public viewing.
                            </p>
                        ) : (
                            <div className="lyric-scroll mt-3 space-y-3 text-[1.075rem] leading-loose text-ink-800">
                                {song.lyrics && song.lyrics.length > 0 ? (
                                    song.lyrics.map((line, i) => (
                                        <p key={i} className={line === '' ? 'h-3' : ''}>{line || ' '}</p>
                                    ))
                                ) : (
                                    <p className="text-ink-500">No lyrics available.</p>
                                )}
                            </div>
                        )}
                    </Reveal>
                </div>

                {/* PREV / NEXT */}
                <div className="mx-auto mt-12 flex max-w-5xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    {prev ? (
                        <Link to={`/songs/${prev.id}`} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50">
                            <ChevronLeft size={16} /> {prev.title}
                        </Link>
                    ) : (
                        <span />
                    )}
                    {next ? (
                        <Link to={`/songs/${next.id}`} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50">
                            {next.title} <ChevronRight size={16} />
                        </Link>
                    ) : (
                        <span />
                    )}
                </div>
            </section>
        </>
    );
}

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CalendarDays, MapPin, Clock, Users, Info, Music, Disc3, FileText, Sparkles, ChevronRight, Tag } from 'lucide-react';
import CoverImage from '../components/public/CoverImage';
import Reveal from '../components/ui/Reveal';
import EmptyState from '../components/public/EmptyState';
import SongLyricsModal from '../components/public/SongLyricsModal';
import { fetchPublicPerformance, fetchAllPerformances, formatDate, getPerformanceStatus } from '../lib/publicApi';
import { PerformanceCardSkeleton } from '../components/public/PublicSkeletons';

export default function PerformanceDetailPage() {
    const { id } = useParams();
    const [performance, setPerformance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedSong, setSelectedSong] = useState(null);
    const [isLyricsOpen, setIsLyricsOpen] = useState(false);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);

        fetchPublicPerformance(id)
            .then((data) => {
                if (!isMounted) return;
                if (data) {
                    setPerformance(data);
                } else {
                    // Fallback to searching all performances
                    return fetchAllPerformances().then((list) => {
                        if (!isMounted) return;
                        const found = list.find((p) => String(p.id) === String(id));
                        setPerformance(found || null);
                    });
                }
            })
            .catch(() => {
                if (isMounted) setPerformance(null);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [id]);

    const handleOpenSong = (song) => {
        setSelectedSong({
            ...song,
            choir: song.choir || (performance?.choir ? { id: performance.choir.id, name: performance.choir.name } : null),
        });
        setIsLyricsOpen(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <PerformanceCardSkeleton />
                </div>
            </div>
        );
    }

    if (!performance) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-24">
                <EmptyState
                    icon={CalendarDays}
                    title="Program Not Found"
                    message="This worship program or performance may be private, cancelled, or does not exist."
                    action={
                        <Link
                            to="/performances"
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3 text-sm font-semibold text-white transition shadow-sm"
                        >
                            <ArrowLeft size={16} /> Back to Upcoming Programs
                        </Link>
                    }
                />
            </div>
        );
    }

    const choir = performance.choir;
    const computedStatus = getPerformanceStatus(performance.date, performance.status);
    const songs = performance.songs || [];
    const posterSrc = performance.poster_url || performance.poster_path;
    const eventType = performance.type || 'Worship';

    return (
        <div className="bg-slate-50 min-h-screen text-slate-800 pb-20">
            {/* Header Hero */}
            <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 text-white py-14 sm:py-18">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.15),transparent_50%)] pointer-events-none" />
                <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <Link
                        to="/performances"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-200 hover:text-white transition mb-6"
                    >
                        <ArrowLeft size={14} /> Back to Upcoming Programs
                    </Link>
                    
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 px-3.5 py-1 text-xs font-bold uppercase tracking-wider">
                            <Tag size={12} /> {eventType}
                        </span>
                        {computedStatus === 'today' && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-3.5 py-1 text-xs font-bold uppercase tracking-wider">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Today
                            </span>
                        )}
                        {computedStatus === 'upcoming' && (
                            <span className="inline-flex items-center rounded-full bg-blue-400/20 text-blue-100 border border-blue-300/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                                Upcoming
                            </span>
                        )}
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                        {performance.title}
                    </h1>

                    {choir?.name && (
                        <Link
                            to={`/choirs/${choir.id}`}
                            className="mt-4 inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-blue-200 hover:text-white group"
                        >
                            <Users size={18} className="text-blue-300" />
                            <span>{choir.name}</span>
                            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    )}

                    {/* Metadata Cards */}
                    <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-3">
                        <div className="bg-white/10 border border-white/15 backdrop-blur-md rounded-2xl p-4">
                            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-200 mb-1">
                                <CalendarDays size={14} className="text-blue-300" /> Date
                            </p>
                            <p className="text-base font-bold text-white">{formatDate(performance.date)}</p>
                        </div>

                        {performance.start_time && (
                            <div className="bg-white/10 border border-white/15 backdrop-blur-md rounded-2xl p-4">
                                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-200 mb-1">
                                    <Clock size={14} className="text-blue-300" /> Time
                                </p>
                                <p className="text-base font-bold text-white">
                                    {performance.start_time}
                                    {performance.end_time ? ` - ${performance.end_time}` : ''}
                                </p>
                            </div>
                        )}

                        {(performance.venue || performance.location) && (
                            <div className="bg-white/10 border border-white/15 backdrop-blur-md rounded-2xl p-4">
                                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-200 mb-1">
                                    <MapPin size={14} className="text-blue-300" /> Venue / Location
                                </p>
                                <p className="text-base font-bold text-white truncate">
                                    {performance.venue || performance.location}
                                </p>
                                {performance.venue && performance.location && (
                                    <p className="text-xs text-blue-200 truncate mt-0.5">{performance.location}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Main Details Body */}
            <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mt-10 space-y-10">
                {/* Poster Image if available */}
                {posterSrc && (
                    <Reveal>
                        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-md max-h-[480px]">
                            <CoverImage
                                src={posterSrc}
                                label={performance.title}
                                className="w-full h-full max-h-[480px] object-cover"
                            />
                        </div>
                    </Reveal>
                )}

                {/* Description & Overview */}
                {performance.description && (
                    <Reveal>
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
                            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
                                <Info size={20} className="text-blue-600" /> Program Overview
                            </h2>
                            <p className="whitespace-pre-line text-slate-600 leading-relaxed text-sm sm:text-base">
                                {performance.description}
                            </p>
                        </div>
                    </Reveal>
                )}

                {/* Additional Performance Information */}
                {(performance.organizer || performance.dress_code || performance.special_instructions) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {performance.organizer && (
                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-2">
                                    <Users size={14} className="text-blue-600" /> Organized By
                                </p>
                                <p className="text-sm font-semibold text-slate-800">{performance.organizer}</p>
                            </div>
                        )}

                        {performance.dress_code && (
                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-2">
                                    <Sparkles size={14} className="text-blue-600" /> Dress Code
                                </p>
                                <p className="text-sm font-semibold text-slate-800">{performance.dress_code}</p>
                            </div>
                        )}

                        {performance.special_instructions && (
                            <div className="md:col-span-2 bg-blue-50/60 rounded-2xl p-6 border border-blue-100 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2 mb-2">
                                    <Info size={14} /> Special Instructions
                                </p>
                                <p className="text-sm text-slate-700 leading-relaxed">{performance.special_instructions}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Program Songs List */}
                <Reveal>
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
                            <div>
                                <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
                                    <Music size={22} className="text-blue-600" /> Assigned Program Songs
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                    Musical pieces scheduled for this worship presentation.
                                </p>
                            </div>
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-full border border-blue-100">
                                {songs.length} {songs.length === 1 ? 'Song' : 'Songs'}
                            </span>
                        </div>

                        {songs.length === 0 ? (
                            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
                                <Music size={32} className="mx-auto text-slate-300 mb-2" />
                                <p className="text-sm font-semibold text-slate-600">No songs currently assigned.</p>
                                <p className="text-xs text-slate-400 mt-1">The choir leadership will update the setlist before the event.</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {songs.map((song, index) => (
                                    <div
                                        key={song.id || index}
                                        className="group flex items-center justify-between gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-200 transition"
                                    >
                                        <Link
                                            to={`/songs/${song.id}`}
                                            className="flex items-center gap-3.5 min-w-0 flex-1"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                                                {index + 1}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                                                    {song.title}
                                                </h3>
                                                <p className="text-xs text-slate-500 truncate flex flex-wrap items-center gap-2 mt-0.5">
                                                    {song.composer && <span>By {song.composer}</span>}
                                                    {song.artist && <span>• {song.artist}</span>}
                                                    {song.original_key && (
                                                        <span className="bg-white px-2 py-0.5 rounded text-[10px] font-semibold text-slate-600 border border-slate-200">
                                                            Key: {song.original_key}
                                                        </span>
                                                    )}
                                                    {song.scale && (
                                                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-semibold border border-emerald-100">
                                                            {song.scale}
                                                        </span>
                                                    )}
                                                    {song.likes_count !== undefined && (
                                                        <span className="text-[11px] text-slate-500 font-medium">
                                                            ♥ {song.likes_count}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </Link>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {song.lyrics && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleOpenSong(song);
                                                    }}
                                                    className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs hover:bg-blue-50 hover:text-blue-700 transition"
                                                >
                                                    <FileText size={13} /> Lyrics Preview
                                                </button>
                                            )}
                                            <Link
                                                to={`/songs/${song.id}`}
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg border border-blue-100 transition"
                                            >
                                                Song Details
                                                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Reveal>
            </main>

            {/* Song Lyrics Modal */}
            <SongLyricsModal
                song={selectedSong}
                isOpen={isLyricsOpen}
                onClose={() => setIsLyricsOpen(false)}
            />
        </div>
    );
}

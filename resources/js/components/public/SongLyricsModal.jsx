import React from 'react';
import Modal from '../ui/Modal';
import AudioPlayer from './AudioPlayer';
import LyricsViewer from './LyricsViewer';
import { Music2, Download, Share2, Disc3 } from 'lucide-react';

export default function SongLyricsModal({ song, isOpen, onClose, onShare }) {
    if (!song) return null;

    const choirName = song.choir?.name || 'Choir MKC';

    const handleShare = () => {
        if (onShare) {
            onShare(song);
        } else {
            const url = window.location.origin + '/songs/' + song.id;
            if (navigator.share) {
                navigator.share({ title: song.title, url }).catch(() => {});
            } else {
                navigator.clipboard.writeText(url);
            }
        }
    };

    return (
        <Modal open={isOpen} onClose={onClose} size="lg" labelledBy={`song-modal-${song.id}`}>
            <div className="space-y-6">
                {/* Header card with cover & info & player */}
                <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        {/* Cover Image */}
                        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-blue-200/60 bg-white shadow-sm">
                            {song.cover_url ? (
                                <img
                                    src={song.cover_url}
                                    alt={song.title}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-500">
                                    <Music2 size={36} />
                                </div>
                            )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-bold tracking-tight text-slate-900 truncate">
                                {song.title}
                            </h2>
                            <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-blue-700">
                                <Disc3 size={15} />
                                {choirName}
                            </p>
                            {song.artist && (
                                <p className="mt-0.5 text-xs text-slate-500 truncate">
                                    Artist: {song.artist}
                                </p>
                            )}

                            {/* Actions */}
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                {song.audio_url ? (
                                    <a
                                        href={song.audio_url}
                                        download
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
                                    >
                                        <Download size={14} /> Download
                                    </a>
                                ) : null}

                                <button
                                    type="button"
                                    onClick={handleShare}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-blue-600 active:scale-95"
                                >
                                    <Share2 size={14} /> Share
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Audio Player */}
                    <div className="mt-4 pt-3 border-t border-blue-100/80">
                        {song.audio_url ? (
                            <AudioPlayer src={song.audio_url} title={song.title} artist={choirName} />
                        ) : (
                            <div className="rounded-xl bg-white/70 p-3 text-center text-xs font-medium text-slate-500 border border-slate-200/60">
                                Audio recording not available for this song.
                            </div>
                        )}
                    </div>
                </div>

                {/* Lyrics Section */}
                <div className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                            LYRICS
                        </h3>
                    </div>
                    <LyricsViewer lyrics={song.lyrics} />
                </div>
            </div>
        </Modal>
    );
}
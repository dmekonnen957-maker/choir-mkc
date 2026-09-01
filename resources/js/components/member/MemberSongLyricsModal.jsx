import React from 'react';
import Modal from '../ui/Modal';
import LyricsViewer from '../public/LyricsViewer';
import { Music2, Disc3, Download } from 'lucide-react';

export default function MemberSongLyricsModal({ song, isOpen, onClose }) {
    if (!song) return null;

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            size="lg"
            title="Song Lyrics"
            labelledBy={`member-song-modal-${song.id}`}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 p-4 sm:p-5">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-blue-200/60 bg-white text-blue-500 shadow-sm">
                        <Music2 size={30} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="truncate text-xl font-bold tracking-tight text-slate-900">
                            {song.title}
                        </h2>
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-blue-700">
                            <Disc3 size={15} />
                            {song.choir?.name || song.choir_name || 'Choir MKC'}
                        </p>
                        {song.artist && (
                            <p className="mt-0.5 text-xs text-slate-500 truncate">Artist: {song.artist}</p>
                        )}
                        {song.audio_url && (
                            <a
                                href={song.audio_url}
                                download
                                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
                            >
                                <Download size={14} /> Download Audio
                            </a>
                        )}
                    </div>
                </div>

                {/* Lyrics */}
                <div className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm">
                    <div className="mb-4 border-b border-slate-100 pb-3">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                            Lyrics
                        </h3>
                    </div>
                    <LyricsViewer lyrics={song.lyrics} />
                </div>
            </div>
        </Modal>
    );
}

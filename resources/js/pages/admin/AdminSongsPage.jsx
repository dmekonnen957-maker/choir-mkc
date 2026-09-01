import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useChoir } from '../../context/ChoirContext';
import { api } from '../../axios';
import {
    Plus,
    Music,
    Pencil,
    Trash2,
    Search,
    Eye,
    Play,
    Pause,
    Volume2,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';

export default function AdminSongsPage() {
    const { can } = useAuth();
    const { currentChoir, isAllChoirs } = useChoir();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [songs, setSongs] = useState([]);
    const [choirs, setChoirs] = useState([]);
    const [search, setSearch] = useState('');
    const [choirId, setChoirId] = useState('');
    const [toDelete, setToDelete] = useState(null);
    const [toast, setToast] = useState(null);
    const [playingId, setPlayingId] = useState(null);
    const [audioRefs, setAudioRefs] = useState({});

    // Sync choirId filter with currentChoir context
    useEffect(() => {
        if (!isAllChoirs && currentChoir?.id) {
            setChoirId(String(currentChoir.id));
        } else {
            setChoirId('');
        }
    }, [currentChoir?.id, isAllChoirs]);

    const load = () => {
        setLoading(true);
        setError('');
        Promise.all([api.get('/admin/songs'), api.get('/admin/choirs')])
            .then(([songsRes, choirsRes]) => {
                setSongs(songsRes.data?.data?.items ?? []);
                setChoirs(choirsRes.data?.data?.items ?? []);
            })
            .catch(() => setError('Unable to load songs.'))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);


    const filtered = songs.filter((s) => {
        if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false;
        if (choirId && String(s.choir_id) !== String(choirId)) return false;
        return true;
    });

    const confirmDelete = async () => {
        try {
            await api.delete(`/admin/songs/${toDelete.id}`);
            setToast({ variant: 'success', message: 'Song deleted.' });
            setSongs((prev) => prev.filter((s) => s.id !== toDelete.id));
        } catch {
            setToast({ variant: 'error', message: 'Could not delete song.' });
        } finally {
            setToDelete(null);
        }
    };

    const togglePlay = (songId, audioPath) => {
        const audioUrl = `/storage/${String(audioPath).replace(/^\/+/, '')}`;
        if (playingId === songId) {
            // Pause current
            if (audioRefs[songId]) {
                audioRefs[songId].pause();
            }
            setPlayingId(null);
        } else {
            // Pause any playing audio
            if (playingId && audioRefs[playingId]) {
                audioRefs[playingId].pause();
            }
            // Play new
            if (audioRefs[songId]) {
                audioRefs[songId].play();
                setPlayingId(songId);
            } else {
                // Create new audio element
                const audio = new Audio(audioUrl);
                audio.onended = () => setPlayingId(null);
                audio.play();
                setAudioRefs(prev => ({ ...prev, [songId]: audio }));
                setPlayingId(songId);
            }
        }
    };

    useEffect(() => {
        // Cleanup audio on unmount
        return () => {
            Object.values(audioRefs).forEach(audio => {
                if (audio) {
                    audio.pause();
                    audio.src = '';
                }
            });
        };
    }, [audioRefs]);

    if (loading) {
        return (
            <div className="flex h-48 items-center justify-center">
                <LoadingSpinner text="Loading..." />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-ink-900">Music Library</h1>
                    <p className="text-sm text-ink-500">Manage your choir's songs</p>
                </div>
                {can('songs.create') && (
                    <Link
                        to="/admin/songs/new"
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4" /> Add Song
                    </Link>
                )}
            </div>

            {/* Toast & Error */}
            {toast && (
                <Alert variant={toast.variant} title={toast.message} onClose={() => setToast(null)} />
            )}
            {error && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <span>{error}</span>
                    <Button variant="outline" size="sm" onClick={load}>
                        Retry
                    </Button>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search songs…"
                        className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400"
                    />
                </div>
                <select
                    value={choirId}
                    onChange={(e) => setChoirId(e.target.value)}
                    className="min-w-[180px] rounded-lg border border-ink-200 bg-white py-2 pl-3 pr-3 text-sm outline-none focus:border-blue-400"
                >
                    <option value="">All Choirs</option>
                    {choirs.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Songs Grid - Full Width */}
            {filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed border-ink-200 bg-white p-12 text-center">
                    <Music className="mx-auto h-8 w-8 text-ink-300" />
                    <p className="mt-3 font-medium text-ink-700">No songs available yet</p>
                    <p className="text-sm text-ink-400">Add a song to start building your music library.</p>
                    {can('songs.create') && (
                        <Link
                            to="/admin/songs/new"
                            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4" /> Add Song
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filtered.map((s) => (
                        <div
                            key={s.id}
                            className="group rounded-xl border border-ink-200 bg-white shadow-sm transition-all hover:shadow-md"
                        >
                            <div className="flex items-center p-4 gap-4">
                                {/* Artwork */}
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100">
                                    <Music className="h-8 w-8 text-blue-400" />
                                </div>

                                {/* Song Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-ink-900 group-hover:text-blue-600 transition-colors truncate">
                                        {s.title}
                                    </h3>
                                    {s.artist && (
                                        <p className="text-xs text-ink-400 truncate">{s.artist}</p>
                                    )}
                                    <p className="text-xs text-ink-400">{s.choir?.name || '—'}</p>
                                </div>

                                {/* Play Button */}
                                {s.audio_path && (
                                    <button
                                        onClick={() => togglePlay(s.id, s.audio_path)}
                                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all hover:scale-105"
                                    >
                                        {playingId === s.id ? (
                                            <Pause className="h-6 w-6" />
                                        ) : (
                                            <Play className="h-6 w-6 ml-0.5" />
                                        )}
                                    </button>
                                )}

                                {/* Audio Indicator */}
                                {s.audio_path && (
                                    <div className="shrink-0">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600">
                                            <Volume2 className="h-3 w-3" /> Audio
                                        </span>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex shrink-0 items-center gap-2">
                                    <button
                                        onClick={() => navigate(`/admin/songs/${s.id}`)}
                                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                                    >
                                        <Eye className="h-4 w-4" /> View
                                    </button>
                                    {can('songs.edit') && (
                                        <button
                                            onClick={() => navigate(`/admin/songs/${s.id}/edit`)}
                                            className="inline-flex items-center justify-center rounded-lg bg-ink-50 px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-100 transition-colors"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                    )}
                                    {can('songs.delete') && (
                                        <button
                                            onClick={() => setToDelete(s)}
                                            className="inline-flex items-center justify-center rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Modal */}
            <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete song">
                <p className="text-sm text-ink-600">
                    Delete "{toDelete?.title}"? This removes the song and its audio file. This cannot be undone.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setToDelete(null)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={confirmDelete}>
                        Delete
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
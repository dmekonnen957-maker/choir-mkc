import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Pencil,
    Trash2,
    Music,
    Minus,
    Plus,
    RotateCcw,
    Calendar,
    FileText,
    Volume2,
    Play,
    Pause
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import LyricsViewer from '../../components/public/LyricsViewer';

const SCALE_LABELS = {
    major: 'Major',
    minor: 'Minor',
    ethiopian: 'Ethiopian',
};

const QUICK_STEPS = [-2, -1, 0, 1, 2, 3];

export default function AdminSongDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { can } = useAuth();

    const [song, setSong] = useState(null);
    const [transpose, setTranspose] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toDelete, setToDelete] = useState(false);
    const [toast, setToast] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audio, setAudio] = useState(null);

    const load = useCallback(
        (steps = 0) => {
            setLoading(true);
            api
                .get(`/admin/songs/${id}`, { params: steps ? { transpose: steps } : {} })
                .then((res) => setSong(res.data.data))
                .catch(() => setError('Failed to load song.'))
                .finally(() => setLoading(false));
        },
        [id]
    );

    useEffect(() => {
        load(0);
    }, [id, load]);

    const changeTranspose = (steps) => {
        const next = Math.max(-12, Math.min(12, steps));
        setTranspose(next);
        load(next);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/admin/songs/${id}`);
            setToast({ variant: 'success', message: 'Song deleted.' });
            navigate('/admin/songs');
        } catch {
            setToast({ variant: 'error', message: 'Could not delete song.' });
        } finally {
            setToDelete(false);
        }
    };

    const togglePlay = () => {
        if (!song?.audio_path) return;

        if (audio) {
            if (isPlaying) {
                audio.pause();
                setIsPlaying(false);
            } else {
                audio.play();
                setIsPlaying(true);
            }
        } else {
            const newAudio = new Audio(song.audio_path);
            newAudio.onended = () => setIsPlaying(false);
            newAudio.play();
            setAudio(newAudio);
            setIsPlaying(true);
        }
    };

    useEffect(() => {
        return () => {
            if (audio) {
                audio.pause();
                audio.src = '';
            }
        };
    }, [audio]);

    if (loading) {
        return (
            <div className="flex h-48 items-center justify-center">
                <LoadingSpinner text="Loading..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-24 text-center">
                <p className="font-medium text-ink-700">{error}</p>
                <button
                    onClick={() => load(0)}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!song) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-24 text-center">
                <Music className="mx-auto h-8 w-8 text-ink-300" />
                <p className="mt-3 font-medium text-ink-700">Song not found</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 px-4">
            {/* Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/admin/songs')}
                    className="inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-700"
                >
                    <ArrowLeft size={16} /> Back to Music Library
                </button>

                <div className="flex gap-2">
                    {toast && (
                        <Alert
                            variant={toast.variant}
                            title={toast.message}
                            onClose={() => setToast(null)}
                        />
                    )}
                    {can('songs.edit') && (
                        <Link to={`/admin/songs/${song.id}/edit`}>
                            <Button variant="ghost" size="sm">
                                <Pencil size={15} className="mr-1" /> Edit
                            </Button>
                        </Link>
                    )}
                    {can('songs.delete') && (
                        <Button variant="danger" size="sm" onClick={() => setToDelete(true)}>
                            <Trash2 size={15} className="mr-1" /> Delete
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Song Info Card - Full Width */}
            <Card className="w-full space-y-6">
                <div className="flex items-start gap-6">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-500">
                        <Music className="h-10 w-10" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-3xl font-bold text-ink-900 truncate">{song.title}</h1>
                        {song.artist && <p className="text-ink-500">{song.artist}</p>}
                        <p className="text-sm text-ink-400">{song.choir?.name}</p>
                    </div>
                </div>

                {/* Key & Scale */}
                <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">
                        Key: {song.key || '—'}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                        {song.scale ? SCALE_LABELS[song.scale] ?? song.scale : 'No scale'}
                    </span>
                    {transpose !== 0 && (
                        <span className="rounded-full bg-ink-100 px-3 py-1 text-ink-600">
                            Original: {song.original_key}
                        </span>
                    )}
                </div>

                {/* Audio Player with Play Button */}
                {song.audio_path && (
                    <div className="border-t border-ink-100 pt-4">
                        <h3 className="mb-3 text-sm font-semibold text-ink-600 flex items-center gap-2">
                            <Volume2 size={16} /> Audio Player
                        </h3>
                        <div className="flex items-center gap-4 p-4 bg-blue-50/50 rounded-xl">
                            <button
                                onClick={togglePlay}
                                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all hover:scale-105"
                            >
                                {isPlaying ? (
                                    <Pause className="h-7 w-7" />
                                ) : (
                                    <Play className="h-7 w-7 ml-0.5" />
                                )}
                            </button>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-ink-900 truncate">{song.title}</p>
                                <p className="text-sm text-ink-500">{song.artist || 'Audio'}</p>
                            </div>
                            <span className="text-xs text-ink-400">
                                {isPlaying ? 'Playing...' : 'Click play'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Description */}
                {song.description && (
                    <p className="text-sm text-ink-600 border-t border-ink-100 pt-4">{song.description}</p>
                )}

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 border-t border-ink-100 pt-4 text-xs text-ink-500">
                    <div className="flex items-center gap-2">
                        <FileText size={14} />
                        <span>Lyrics: {song.has_lyrics ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span>Created: {song.created_at ? new Date(song.created_at).toLocaleDateString() : '—'}</span>
                    </div>
                </div>
            </Card>

            {/* Transpose & Lyrics Card - Full Width */}
            <Card className="w-full space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
                        Lyrics & Transpose
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => changeTranspose(transpose - 1)}
                            className="rounded-lg border border-ink-200 p-2 text-ink-600 hover:bg-ink-50"
                            disabled={transpose <= -12}
                            title="Down a semitone"
                        >
                            <Minus size={16} />
                        </button>
                        <span className="w-20 text-center text-sm font-semibold text-ink-700">
                            {transpose > 0 ? `+${transpose}` : transpose} semitone
                            {transpose === 1 || transpose === -1 ? '' : 's'}
                        </span>
                        <button
                            onClick={() => changeTranspose(transpose + 1)}
                            className="rounded-lg border border-ink-200 p-2 text-ink-600 hover:bg-ink-50"
                            disabled={transpose >= 12}
                            title="Up a semitone"
                        >
                            <Plus size={16} />
                        </button>
                        {transpose !== 0 && (
                            <button
                                onClick={() => changeTranspose(0)}
                                className="rounded-lg border border-ink-200 p-2 text-ink-600 hover:bg-ink-50"
                                title="Reset"
                            >
                                <RotateCcw size={16} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {QUICK_STEPS.map((s) => (
                        <button
                            key={s}
                            onClick={() => changeTranspose(s)}
                            className={`rounded-lg px-3 py-1 text-sm font-medium ${transpose === s
                                    ? 'bg-blue-600 text-white'
                                    : 'border border-ink-200 text-ink-600 hover:bg-ink-50'
                                }`}
                        >
                            {s > 0 ? `+${s}` : s}
                        </button>
                    ))}
                </div>

                <div className="bg-blue-50/30 rounded-xl p-4">
                    <LyricsViewer lyrics={song.display_lyrics} />
                </div>
            </Card>

            {/* Delete Modal */}
            <Modal open={toDelete} onClose={() => setToDelete(false)} title="Delete song">
                <p className="text-sm text-ink-600">
                    Delete "{song.title}"? This removes the song, its audio file and lyrics. This cannot be undone.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setToDelete(false)}>
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
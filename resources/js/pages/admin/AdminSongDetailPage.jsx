import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Music, Minus, Plus, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';
import AudioPlayer from '../../components/ui/AudioPlayer';
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

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
        <div className="mx-auto max-w-3xl space-y-6">
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

            <Card className="space-y-6">
                <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                        <Music className="h-8 w-8" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-ink-900">{song.title}</h1>
                        {song.artist && <p className="text-ink-500">{song.artist}</p>}
                        <p className="text-sm text-ink-400">{song.choir?.name}</p>
                    </div>
                </div>

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

                {song.audio_path && (
                    <div>
                        <h3 className="mb-2 text-sm font-semibold text-ink-600">Audio</h3>
                        <AudioPlayer songId={Number(song.id)} />
                    </div>
                )}

                {song.description && (
                    <p className="text-sm text-ink-600">{song.description}</p>
                )}
            </Card>

            <Card className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
                        Transpose
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
                            className={`rounded-lg px-3 py-1 text-sm font-medium ${
                                transpose === s
                                    ? 'bg-blue-600 text-white'
                                    : 'border border-ink-200 text-ink-600 hover:bg-ink-50'
                            }`}
                        >
                            {s > 0 ? `+${s}` : s}
                        </button>
                    ))}
                </div>

                <div>
                    <h3 className="mb-2 text-sm font-semibold text-ink-600">Lyrics & Chords</h3>
                    <LyricsViewer lyrics={song.display_lyrics} />
                </div>
            </Card>

            <Modal open={toDelete} onClose={() => setToDelete(false)} title="Delete song">
                <p className="text-sm text-ink-600">
                    Delete "{song.title}"? This removes the song, its audio file and lyrics. This cannot
                    be undone.
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

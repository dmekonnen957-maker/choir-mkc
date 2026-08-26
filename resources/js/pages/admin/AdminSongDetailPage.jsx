import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
    ArrowLeft, Pencil, Trash2, Music2, Loader2, Mic2, Plus,
} from 'lucide-react';
import { api } from '../../axios';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';
import AudioPlayer from '../../components/ui/AudioPlayer';

function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminSongDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { can } = useAuth();
    const [song, setSong] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        setError('');
        api.get(`/admin/songs/${id}`)
            .then((res) => setSong(res.data.data))
            .catch(() => setError('Failed to load song.'))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    const remove = () => {
        if (!window.confirm(`Delete "${song?.title}"? This also removes its audio file and cannot be undone.`)) {
            return;
        }
        setBusy(true);
        api.delete(`/admin/songs/${id}`)
            .then(() => navigate('/admin/songs'))
            .catch((err) => {
                setError(err.response?.data?.message || 'Failed to delete song.');
                setBusy(false);
            });
    };

    if (loading) {
        return (
            <div className="flex h-48 items-center justify-center">
                <LoadingSpinner text="Loading song..." />
            </div>
        );
    }

    if (error || !song) {
        return (
            <div className="space-y-4">
                <button onClick={() => navigate('/admin/songs')} className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700">
                    <ArrowLeft size={16} /> Back to songs
                </button>
                <Alert variant="error">{error || 'Song not found.'}</Alert>
            </div>
        );
    }

    const lyrics = song.lyrics || [];

    return (
        <div className="space-y-6">
            <button onClick={() => navigate('/admin/songs')} className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700">
                <ArrowLeft size={16} /> Back to songs
            </button>

            {error && <Alert variant="error">{error}</Alert>}

            <Card>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                            <Music2 size={26} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-ink-900">{song.title}</h1>
                            <p className="mt-1 text-sm text-ink-500">{song.choir?.name || 'No choir'}</p>
                            {(song.artist || song.composer) && (
                                <p className="mt-1 text-sm text-ink-500">
                                    {[song.artist, song.composer].filter(Boolean).join(' · ')}
                                </p>
                            )}
                            <p className="mt-1 text-xs text-ink-400">
                                Added by {song.creator?.name || 'Unknown'} · {formatDate(song.created_at)}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {can('songs.edit') && (
                            <Link to={`/admin/songs/${song.id}/edit`}>
                                <Button variant="outline">
                                    <Pencil size={15} className="mr-1" /> Edit
                                </Button>
                            </Link>
                        )}
                        {can('songs.delete') && (
                            <Button variant="danger" onClick={remove} disabled={busy}>
                                {busy ? <Loader2 size={15} className="mr-1 animate-spin" /> : <Trash2 size={15} className="mr-1" />}
                                Delete
                            </Button>
                        )}
                    </div>
                </div>

                {song.description && (
                    <p className="mt-4 border-t border-blue-50 pt-4 text-sm text-ink-600">{song.description}</p>
                )}

                {song.audio_path && (
                    <div className="mt-4 border-t border-blue-50 pt-4">
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-400">Audio</p>
                        <AudioPlayer songId={song.id} />
                    </div>
                )}
            </Card>

            <Card>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-900">
                        <Mic2 size={18} className="text-blue-500" /> Lyrics ({lyrics.length})
                    </h2>
                    {can('lyrics.create') && (
                        <Link to={`/admin/lyrics/new?song_id=${song.id}`}>
                            <Button size="sm">
                                <Plus size={15} className="mr-1" /> Add Lyrics
                            </Button>
                        </Link>
                    )}
                </div>
                {lyrics.length === 0 ? (
                    <p className="py-6 text-center text-sm text-ink-400">No lyrics yet.</p>
                ) : (
                    <ul className="divide-y divide-blue-50">
                        {lyrics.map((l) => (
                            <li key={l.id}>
                                <Link
                                    to={`/admin/lyrics/${l.id}`}
                                    className="flex items-center justify-between py-2.5 hover:bg-canvas/60"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-ink-900">
                                            {l.language || 'Lyrics'}
                                            {l.version_label ? ` · ${l.version_label}` : ''}
                                        </p>
                                        <p className="line-clamp-1 text-xs text-ink-400">
                                            {l.content || ''}
                                        </p>
                                    </div>
                                    <span className="text-xs text-ink-300">View</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </div>
    );
}

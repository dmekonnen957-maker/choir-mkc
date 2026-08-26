import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
    ArrowLeft, Pencil, Trash2, Mic2, Loader2, Music2,
} from 'lucide-react';
import { api } from '../../axios';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';

function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminLyricDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { can } = useAuth();
    const [lyric, setLyric] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        setError('');
        api.get(`/admin/lyrics/${id}`)
            .then((res) => setLyric(res.data.data))
            .catch(() => setError('Failed to load lyrics.'))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    const remove = () => {
        if (!window.confirm('Delete these lyrics? This cannot be undone.')) return;
        setBusy(true);
        api.delete(`/admin/lyrics/${id}`)
            .then(() => navigate('/admin/lyrics'))
            .catch((err) => {
                setError(err.response?.data?.message || 'Failed to delete lyrics.');
                setBusy(false);
            });
    };

    if (loading) {
        return (
            <div className="flex h-48 items-center justify-center">
                <LoadingSpinner text="Loading lyrics..." />
            </div>
        );
    }

    if (error || !lyric) {
        return (
            <div className="space-y-4">
                <button onClick={() => navigate('/admin/lyrics')} className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700">
                    <ArrowLeft size={16} /> Back to lyrics
                </button>
                <Alert variant="error">{error || 'Lyrics not found.'}</Alert>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <button onClick={() => navigate('/admin/lyrics')} className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700">
                <ArrowLeft size={16} /> Back to lyrics
            </button>

            {error && <Alert variant="error">{error}</Alert>}

            <Card>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                            <Mic2 size={26} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-ink-900">
                                {lyric.language || 'Lyrics'}
                                {lyric.version_label ? ` · ${lyric.version_label}` : ''}
                            </h1>
                            <p className="mt-1 text-sm text-ink-500">
                                {lyric.song?.title || 'No song'} · {lyric.choir?.name || 'No choir'}
                            </p>
                            <p className="mt-1 text-xs text-ink-400">
                                Added by {lyric.creator?.name || 'Unknown'} · {formatDate(lyric.created_at)}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {can('lyrics.edit') && (
                            <Link to={`/admin/lyrics/${lyric.id}/edit`}>
                                <Button variant="outline">
                                    <Pencil size={15} className="mr-1" /> Edit
                                </Button>
                            </Link>
                        )}
                        {can('lyrics.delete') && (
                            <Button variant="danger" onClick={remove} disabled={busy}>
                                {busy ? <Loader2 size={15} className="mr-1 animate-spin" /> : <Trash2 size={15} className="mr-1" />}
                                Delete
                            </Button>
                        )}
                    </div>
                </div>

                {lyric.song?.id && (
                    <Link
                        to={`/admin/songs/${lyric.song.id}`}
                        className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                        <Music2 size={14} /> View song
                    </Link>
                )}

                <div className="mt-4 whitespace-pre-wrap border-t border-blue-50 pt-4 text-sm leading-relaxed text-ink-700">
                    {lyric.content}
                </div>
            </Card>
        </div>
    );
}

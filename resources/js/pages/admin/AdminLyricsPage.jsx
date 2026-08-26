import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Mic2, Pencil, Trash2, Eye } from 'lucide-react';
import { api } from '../../axios';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';

export default function AdminLyricsPage() {
    const navigate = useNavigate();
    const { can } = useAuth();
    const [lyrics, setLyrics] = useState([]);
    const [choirs, setChoirs] = useState([]);
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [choirId, setChoirId] = useState('');
    const [songId, setSongId] = useState('');
    const [busyId, setBusyId] = useState(null);

    const loadChoirs = useCallback(() => {
        api.get('/admin/choirs', { params: { per_page: 200 } })
            .then((res) => setChoirs(res.data.data.items || []))
            .catch(() => {});
    }, []);

    const loadSongs = useCallback((cid) => {
        if (!cid) {
            setSongs([]);
            return;
        }
        api.get('/admin/songs', { params: { choir_id: cid, per_page: 200 } })
            .then((res) => setSongs(res.data.data.items || []))
            .catch(() => setSongs([]));
    }, []);

    const load = useCallback(() => {
        setLoading(true);
        setError('');
        const params = { per_page: 200 };
        if (choirId) params.choir_id = choirId;
        if (songId) params.song_id = songId;
        if (search) params.search = search;
        api.get('/admin/lyrics', { params })
            .then((res) => setLyrics(res.data.data.items || []))
            .catch(() => setError('Failed to load lyrics.'))
            .finally(() => setLoading(false));
    }, [choirId, songId, search]);

    useEffect(() => {
        loadChoirs();
    }, [loadChoirs]);

    useEffect(() => {
        load();
    }, [load]);

    const onChoirChange = (cid) => {
        setChoirId(cid);
        setSongId('');
        loadSongs(cid);
    };

    const remove = (lyric) => {
        if (!window.confirm('Delete these lyrics? This cannot be undone.')) return;
        setBusyId(lyric.id);
        api.delete(`/admin/lyrics/${lyric.id}`)
            .then(() => setLyrics((prev) => prev.filter((l) => l.id !== lyric.id)))
            .catch((err) => setError(err.response?.data?.message || 'Failed to delete lyrics.'))
            .finally(() => setBusyId(null));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-ink-900">Lyrics</h1>
                    <p className="mt-1 text-sm text-ink-500">
                        Manage multilingual lyrics for each song.
                    </p>
                </div>
                {can('lyrics.create') && (
                    <Link to="/admin/lyrics/new">
                        <Button>
                            <Plus size={16} className="mr-1" /> New Lyrics
                        </Button>
                    </Link>
                )}
            </div>

            {error && <Alert variant="error">{error}</Alert>}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="max-w-sm">
                    <Input
                        placeholder="Search lyrics..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        trailing={<Search size={16} className="text-ink-400" />}
                    />
                </div>
                <select
                    className="rounded-xl border border-blue-100 bg-canvas px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    value={choirId}
                    onChange={(e) => onChoirChange(e.target.value)}
                >
                    <option value="">All choirs</option>
                    {choirs.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
                <select
                    className="rounded-xl border border-blue-100 bg-canvas px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    value={songId}
                    onChange={(e) => setSongId(e.target.value)}
                    disabled={!choirId}
                >
                    <option value="">All songs</option>
                    {songs.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.title}
                        </option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="flex h-48 items-center justify-center">
                    <LoadingSpinner text="Loading lyrics..." />
                </div>
            ) : lyrics.length === 0 ? (
                <Card className="py-16 text-center">
                    <Mic2 size={28} className="mx-auto text-ink-300" />
                    <p className="mt-2 text-sm text-ink-500">No lyrics found.</p>
                    {can('lyrics.create') && (
                        <Link to="/admin/lyrics/new" className="mt-3 inline-block text-sm font-medium text-blue-600">
                            Add lyrics
                        </Link>
                    )}
                </Card>
            ) : (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-blue-50 text-left text-xs uppercase tracking-wide text-ink-400">
                                    <th className="px-4 py-3">Song</th>
                                    <th className="px-4 py-3">Choir</th>
                                    <th className="px-4 py-3">Language</th>
                                    <th className="px-4 py-3">Version</th>
                                    <th className="px-4 py-3">Preview</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-50">
                                {lyrics.map((l) => (
                                    <tr key={l.id} className="hover:bg-canvas/60">
                                        <td className="px-4 py-3 font-medium text-ink-900">{l.song?.title || '—'}</td>
                                        <td className="px-4 py-3 text-ink-600">{l.choir?.name || '—'}</td>
                                        <td className="px-4 py-3 text-ink-600">{l.language || '—'}</td>
                                        <td className="px-4 py-3 text-ink-600">{l.version_label || '—'}</td>
                                        <td className="max-w-xs truncate px-4 py-3 text-ink-400">{l.content}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigate(`/admin/lyrics/${l.id}`)}
                                                >
                                                    <Eye size={15} />
                                                </Button>
                                                {can('lyrics.edit') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => navigate(`/admin/lyrics/${l.id}/edit`)}
                                                    >
                                                        <Pencil size={15} />
                                                    </Button>
                                                )}
                                                {can('lyrics.delete') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={busyId === l.id}
                                                        onClick={() => remove(l)}
                                                    >
                                                        <Trash2 size={15} className="text-red-500" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}

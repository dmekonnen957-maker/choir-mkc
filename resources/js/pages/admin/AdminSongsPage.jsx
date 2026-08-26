import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Music2, Pencil, Trash2, Eye } from 'lucide-react';
import { api } from '../../axios';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';
import AudioPlayer from '../../components/ui/AudioPlayer';

export default function AdminSongsPage() {
    const navigate = useNavigate();
    const { can } = useAuth();
    const [songs, setSongs] = useState([]);
    const [choirs, setChoirs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [choirId, setChoirId] = useState('');
    const [busyId, setBusyId] = useState(null);

    const loadChoirs = useCallback(() => {
        api.get('/admin/choirs', { params: { per_page: 200 } })
            .then((res) => setChoirs(res.data.data.items || []))
            .catch(() => {});
    }, []);

    const load = useCallback(() => {
        setLoading(true);
        setError('');
        const params = { per_page: 200 };
        if (choirId) params.choir_id = choirId;
        if (search) params.search = search;
        api.get('/admin/songs', { params })
            .then((res) => setSongs(res.data.data.items || []))
            .catch(() => setError('Failed to load songs.'))
            .finally(() => setLoading(false));
    }, [choirId, search]);

    useEffect(() => {
        loadChoirs();
    }, [loadChoirs]);

    useEffect(() => {
        load();
    }, [load]);

    const remove = (song) => {
        if (!window.confirm(`Delete song "${song.title}"? This also removes its audio file and cannot be undone.`)) {
            return;
        }
        setBusyId(song.id);
        api.delete(`/admin/songs/${song.id}`)
            .then(() => setSongs((prev) => prev.filter((s) => s.id !== song.id)))
            .catch((err) => setError(err.response?.data?.message || 'Failed to delete song.'))
            .finally(() => setBusyId(null));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-ink-900">Songs</h1>
                    <p className="mt-1 text-sm text-ink-500">
                        Build the choir's songbook with audio and lyrics.
                    </p>
                </div>
                {can('songs.create') && (
                    <Link to="/admin/songs/new">
                        <Button>
                            <Plus size={16} className="mr-1" /> New Song
                        </Button>
                    </Link>
                )}
            </div>

            {error && <Alert variant="error">{error}</Alert>}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="max-w-sm">
                    <Input
                        placeholder="Search songs..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        trailing={<Search size={16} className="text-ink-400" />}
                    />
                </div>
                <select
                    className="rounded-xl border border-blue-100 bg-canvas px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    value={choirId}
                    onChange={(e) => setChoirId(e.target.value)}
                >
                    <option value="">All choirs</option>
                    {choirs.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="flex h-48 items-center justify-center">
                    <LoadingSpinner text="Loading songs..." />
                </div>
            ) : songs.length === 0 ? (
                <Card className="py-16 text-center">
                    <Music2 size={28} className="mx-auto text-ink-300" />
                    <p className="mt-2 text-sm text-ink-500">No songs found.</p>
                    {can('songs.create') && (
                        <Link to="/admin/songs/new" className="mt-3 inline-block text-sm font-medium text-blue-600">
                            Add a song
                        </Link>
                    )}
                </Card>
            ) : (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-blue-50 text-left text-xs uppercase tracking-wide text-ink-400">
                                    <th className="px-4 py-3">Title</th>
                                    <th className="px-4 py-3">Artist / Composer</th>
                                    <th className="px-4 py-3">Choir</th>
                                    <th className="px-4 py-3">Lyrics</th>
                                    <th className="px-4 py-3">Audio</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-50">
                                {songs.map((s) => (
                                    <tr key={s.id} className="hover:bg-canvas/60">
                                        <td className="px-4 py-3 font-medium text-ink-900">{s.title}</td>
                                        <td className="px-4 py-3 text-ink-600">
                                            {s.artist || s.composer || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-ink-600">{s.choir?.name || '—'}</td>
                                        <td className="px-4 py-3 text-ink-600">{s.lyrics_count ?? 0}</td>
                                        <td className="px-4 py-3">
                                            {s.audio_path ? (
                                                <AudioPlayer songId={s.id} />
                                            ) : (
                                                <span className="text-xs text-ink-300">No audio</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigate(`/admin/songs/${s.id}`)}
                                                >
                                                    <Eye size={15} />
                                                </Button>
                                                {can('songs.edit') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => navigate(`/admin/songs/${s.id}/edit`)}
                                                    >
                                                        <Pencil size={15} />
                                                    </Button>
                                                )}
                                                {can('songs.delete') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={busyId === s.id}
                                                        onClick={() => remove(s)}
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

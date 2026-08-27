import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../axios';
import {
    Plus,
    Music,
    Pencil,
    Trash2,
    Search,
    FileText,
    Volume2,
    Eye,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';
import AudioPlayer from '../../components/ui/AudioPlayer';
import Modal from '../../components/ui/Modal';

const SCALE_LABELS = {
    major: 'Major',
    minor: 'Minor',
    ethiopian: 'Ethiopian',
};

export default function AdminSongsPage() {
    const { can } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [songs, setSongs] = useState([]);
    const [choirs, setChoirs] = useState([]);
    const [search, setSearch] = useState('');
    const [choirId, setChoirId] = useState('');
    const [scale, setScale] = useState('');
    const [toDelete, setToDelete] = useState(null);
    const [toast, setToast] = useState(null);

    const load = () => {
        setLoading(true);
        setError('');
        Promise.all([api.get('/admin/songs'), api.get('/admin/choirs')])
            .then(([songsRes, choirsRes]) => {
                // Both endpoints use the paginated envelope: { data: { items: [...], pagination: {...} } }
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
        if (scale && s.scale !== scale) return false;
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

    if (loading) {
        return (
            <div className="flex h-48 items-center justify-center">
                <LoadingSpinner text="Loading..." />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-ink-900">Music Library</h1>
                    <p className="text-sm text-ink-500">Manage your choir's songs, audio and lyrics.</p>
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
                <select
                    value={scale}
                    onChange={(e) => setScale(e.target.value)}
                    className="min-w-[160px] rounded-lg border border-ink-200 bg-white py-2 pl-3 pr-3 text-sm outline-none focus:border-blue-400"
                >
                    <option value="">All Scales</option>
                    <option value="major">Major</option>
                    <option value="minor">Minor</option>
                    <option value="ethiopian">Ethiopian</option>
                </select>
            </div>

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
                <div className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-ink-200 bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
                            <tr>
                                <th className="px-4 py-3">Artwork</th>
                                <th className="px-4 py-3">Title</th>
                                <th className="px-4 py-3">Choir</th>
                                <th className="px-4 py-3">Key</th>
                                <th className="px-4 py-3">Scale</th>
                                <th className="px-4 py-3">Lyrics</th>
                                <th className="px-4 py-3">Audio</th>
                                <th className="px-4 py-3">Created</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-100">
                            {filtered.map((s) => (
                                <tr key={s.id} className="hover:bg-ink-50/60">
                                    <td className="px-4 py-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                                            <Music className="h-5 w-5" />
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => navigate(`/admin/songs/${s.id}`)}
                                            className="font-semibold text-ink-800 hover:text-blue-600"
                                        >
                                            {s.title}
                                        </button>
                                        {s.artist && (
                                            <p className="text-xs text-ink-400">{s.artist}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-ink-600">{s.choir?.name ?? '—'}</td>
                                    <td className="px-4 py-3 font-medium text-ink-700">
                                        {s.original_key ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-ink-600">
                                        {s.scale ? SCALE_LABELS[s.scale] ?? s.scale : '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {s.has_lyrics ? (
                                            <span className="inline-flex items-center gap-1 text-emerald-600">
                                                <FileText className="h-4 w-4" /> Yes
                                            </span>
                                        ) : (
                                            <span className="text-ink-300">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {s.audio_path ? (
                                            <span className="inline-flex items-center gap-1 text-blue-600">
                                                <Volume2 className="h-4 w-4" /> Yes
                                            </span>
                                        ) : (
                                            <span className="text-ink-300">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-ink-500">
                                        {s.created_at
                                            ? new Date(s.created_at).toLocaleDateString()
                                            : '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => navigate(`/admin/songs/${s.id}`)}
                                                title="View"
                                                className="rounded p-2 text-ink-500 hover:bg-ink-100"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            {can('songs.edit') && (
                                                <button
                                                    onClick={() => navigate(`/admin/songs/${s.id}/edit`)}
                                                    title="Edit"
                                                    className="rounded p-2 text-ink-500 hover:bg-ink-100"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                            )}
                                            {can('songs.delete') && (
                                                <button
                                                    onClick={() => setToDelete(s)}
                                                    title="Delete"
                                                    className="rounded p-2 text-red-500 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete song">
                <p className="text-sm text-ink-600">
                    Delete "{toDelete?.title}"? This removes the song and its audio file. This cannot be
                    undone.
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

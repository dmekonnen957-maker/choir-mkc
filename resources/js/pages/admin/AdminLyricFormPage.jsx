import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Mic2 } from 'lucide-react';
import { api } from '../../axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';

const EMPTY = {
    choir_id: '',
    song_id: '',
    language: '',
    version_label: '',
    content: '',
};

export default function AdminLyricFormPage({ mode = 'create' }) {
    const navigate = useNavigate();
    const { id } = useParams();
    const [params] = useSearchParams();
    const [form, setForm] = useState(EMPTY);
    const [choirs, setChoirs] = useState([]);
    const [songs, setSongs] = useState([]);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(mode === 'edit');
    const [error, setError] = useState('');

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

    useEffect(() => {
        loadChoirs();
    }, [loadChoirs]);

    useEffect(() => {
        if (mode === 'edit' && id) {
            api.get(`/admin/lyrics/${id}`)
                .then((res) => {
                    const l = res.data.data;
                    setForm({
                        choir_id: l.choir_id ? String(l.choir_id) : '',
                        song_id: l.song_id ? String(l.song_id) : '',
                        language: l.language || '',
                        version_label: l.version_label || '',
                        content: l.content || '',
                    });
                    if (l.choir_id) loadSongs(l.choir_id);
                })
                .catch(() => setError('Failed to load lyrics.'))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
            const songId = params.get('song_id');
            if (songId) {
                api.get(`/admin/songs/${songId}`)
                    .then((res) => {
                        const s = res.data.data;
                        setForm((prev) => ({
                            ...prev,
                            song_id: String(s.id),
                            choir_id: s.choir_id ? String(s.choir_id) : '',
                        }));
                        if (s.choir_id) loadSongs(s.choir_id);
                    })
                    .catch(() => {});
            }
        }
    }, [mode, id, params, loadSongs]);

    const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    const onChoirChange = (cid) => {
        update('choir_id', cid);
        update('song_id', '');
        loadSongs(cid);
    };

    const submit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});
        setError('');
        const payload = {
            choir_id: form.choir_id,
            song_id: form.song_id,
            language: form.language || null,
            version_label: form.version_label || null,
            content: form.content,
        };
        const req =
            mode === 'edit'
                ? api.put(`/admin/lyrics/${id}`, payload)
                : api.post('/admin/lyrics', payload);

        req
            .then((res) => navigate(`/admin/lyrics/${res.data.data.id}`))
            .catch((err) => {
                if (err.response?.status === 422) {
                    setErrors(err.response.data.errors || {});
                } else {
                    setError(err.response?.data?.message || 'Something went wrong.');
                }
            })
            .finally(() => setSubmitting(false));
    };

    if (loading) {
        return (
            <div className="flex h-48 items-center justify-center">
                <LoadingSpinner text="Loading..." />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-700"
            >
                <ArrowLeft size={16} /> Back
            </button>

            <h1 className="text-2xl font-bold tracking-tight text-ink-900">
                {mode === 'edit' ? 'Edit Lyrics' : 'New Lyrics'}
            </h1>

            {error && <Alert variant="error">{error}</Alert>}

            <Card>
                <form onSubmit={submit} className="space-y-5">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-ink-700">Choir</label>
                        <select
                            className="w-full rounded-xl border border-blue-100 bg-canvas px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            value={form.choir_id}
                            onChange={(e) => onChoirChange(e.target.value)}
                        >
                            <option value="">Select a choir</option>
                            {choirs.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        {errors.choir_id?.[0] && (
                            <p className="mt-1 text-xs text-red-500">{errors.choir_id[0]}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-ink-700">Song</label>
                        <select
                            className="w-full rounded-xl border border-blue-100 bg-canvas px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            value={form.song_id}
                            onChange={(e) => update('song_id', e.target.value)}
                            disabled={!form.choir_id}
                        >
                            <option value="">Select a song</option>
                            {songs.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.title}
                                </option>
                            ))}
                        </select>
                        {errors.song_id?.[0] && (
                            <p className="mt-1 text-xs text-red-500">{errors.song_id[0]}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input
                            label="Language"
                            value={form.language}
                            onChange={(e) => update('language', e.target.value)}
                            error={errors.language?.[0]}
                            placeholder="e.g. Amharic"
                        />
                        <Input
                            label="Version Label"
                            value={form.version_label}
                            onChange={(e) => update('version_label', e.target.value)}
                            error={errors.version_label?.[0]}
                            placeholder="e.g. Verse 1"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-ink-700">Lyrics</label>
                        <textarea
                            rows={10}
                            className="w-full rounded-xl border border-blue-100 bg-canvas px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            value={form.content}
                            onChange={(e) => update('content', e.target.value)}
                            placeholder="Enter the lyrics..."
                        />
                        {errors.content?.[0] && (
                            <p className="mt-1 text-xs text-red-500">{errors.content[0]}</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? (
                                <Loader2 size={16} className="mr-1 animate-spin" />
                            ) : (
                                <Mic2 size={16} className="mr-1" />
                            )}
                            {mode === 'edit' ? 'Save Changes' : 'Create Lyrics'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}

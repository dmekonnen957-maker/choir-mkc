import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Music2, X } from 'lucide-react';
import { api } from '../../axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';
import AudioPlayer from '../../components/ui/AudioPlayer';

const KEYS = [
    'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
    'Db', 'Eb', 'Gb', 'Ab', 'Bb',
];

const SCALES = [
    { value: 'major', label: 'Major' },
    { value: 'minor', label: 'Minor' },
    { value: 'ethiopian', label: 'Ethiopian (extensible)' },
];

const EMPTY = {
    choir_id: '',
    title: '',
    artist: '',
    description: '',
    original_key: '',
    scale: '',
    lyrics: '',
    is_published: true,
};

function Section({ title, hint, children }) {
    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
                    {title}
                </h2>
                {hint && <p className="text-xs text-ink-400">{hint}</p>}
            </div>
            {children}
        </div>
    );
}

export default function AdminSongFormPage({ mode = 'create' }) {
    const navigate = useNavigate();
    const { id } = useParams();
    const [form, setForm] = useState(EMPTY);
    const [choirs, setChoirs] = useState([]);
    const [errors, setErrors] = useState({});
    const [file, setFile] = useState(null);
    const [removeAudio, setRemoveAudio] = useState(false);
    const [hasAudio, setHasAudio] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(mode === 'edit');
    const [error, setError] = useState('');

    const loadChoirs = useCallback(() => {
        api.get('/admin/choirs', { params: { per_page: 200 } })
            .then((res) => setChoirs(res.data.data.items || []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        loadChoirs();
    }, [loadChoirs]);

    useEffect(() => {
        if (mode === 'edit' && id) {
            api.get(`/admin/songs/${id}`)
                .then((res) => {
                    const s = res.data.data;
                    setForm({
                        choir_id: s.choir_id ? String(s.choir_id) : '',
                        title: s.title || '',
                        artist: s.artist || '',
                        description: s.description || '',
                        original_key: s.original_key || '',
                        scale: s.scale || '',
                        lyrics: s.lyrics || '',
                        is_published: !!s.is_published,
                    });
                    setHasAudio(!!s.audio_path);
                })
                .catch(() => setError('Failed to load song.'))
                .finally(() => setLoading(false));
        }
    }, [mode, id]);

    const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    const submit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});
        setError('');

        const fd = new FormData();
        fd.append('choir_id', form.choir_id);
        fd.append('title', form.title);
        fd.append('artist', form.artist || '');
        fd.append('description', form.description || '');
        fd.append('original_key', form.original_key || '');
        fd.append('scale', form.scale || '');
        fd.append('lyrics', form.lyrics || '');
        fd.append('is_published', form.is_published ? '1' : '0');
        if (file) fd.append('audio', file);
        if (mode === 'edit' && removeAudio) fd.append('remove_audio', '1');

        const req =
            mode === 'edit'
                ? api.put(`/admin/songs/${id}`, fd)
                : api.post('/admin/songs', fd);

        req
            .then((res) => navigate(`/admin/songs/${res.data.data.id}`))
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
                {mode === 'edit' ? 'Edit Song' : 'New Song'}
            </h1>

            {error && <Alert variant="error">{error}</Alert>}

            <form onSubmit={submit} className="space-y-6">
                <Card className="space-y-6">
                    <Section title="Basic Information" hint="Title, choir and credits.">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-ink-700">Choir</label>
                            <select
                                className="w-full rounded-xl border border-blue-100 bg-canvas px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                value={form.choir_id}
                                onChange={(e) => update('choir_id', e.target.value)}
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

                        <Input
                            label="Title"
                            value={form.title}
                            onChange={(e) => update('title', e.target.value)}
                            error={errors.title?.[0]}
                            required
                        />

                        <Input
                            label="Artist / Composer"
                            value={form.artist}
                            onChange={(e) => update('artist', e.target.value)}
                            error={errors.artist?.[0]}
                        />

                        <div>
                            <label className="mb-1 block text-sm font-medium text-ink-700">
                                Description
                            </label>
                            <textarea
                                rows={3}
                                className="w-full rounded-xl border border-blue-100 bg-canvas px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                value={form.description}
                                onChange={(e) => update('description', e.target.value)}
                            />
                        </div>
                    </Section>
                </Card>

                <Card className="space-y-6">
                    <Section title="Music" hint="Original key and scale (Ethiopian modes extensible).">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-ink-700">
                                    Original Key
                                </label>
                                <select
                                    className="w-full rounded-xl border border-blue-100 bg-canvas px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                    value={form.original_key}
                                    onChange={(e) => update('original_key', e.target.value)}
                                >
                                    <option value="">Select key</option>
                                    {KEYS.map((k) => (
                                        <option key={k} value={k}>
                                            {k}
                                        </option>
                                    ))}
                                </select>
                                {errors.original_key?.[0] && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.original_key[0]}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-ink-700">
                                    Scale
                                </label>
                                <select
                                    className="w-full rounded-xl border border-blue-100 bg-canvas px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                    value={form.scale}
                                    onChange={(e) => update('scale', e.target.value)}
                                >
                                    <option value="">Select scale</option>
                                    {SCALES.map((s) => (
                                        <option key={s.value} value={s.value}>
                                            {s.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.scale?.[0] && (
                                    <p className="mt-1 text-xs text-red-500">{errors.scale[0]}</p>
                                )}
                            </div>
                        </div>
                    </Section>
                </Card>

                <Card className="space-y-6">
                    <Section title="Audio" hint="Upload an MP3 (max 15 MB). Optional.">
                        <div>
                            {mode === 'edit' && hasAudio && !file && !removeAudio && (
                                <div className="mb-2 rounded-xl border border-blue-50 bg-canvas p-3">
                                    <div className="mb-1 flex items-center justify-between">
                                        <span className="text-xs font-medium text-ink-500">
                                            Current audio
                                        </span>
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-1 text-xs text-red-500 hover:underline"
                                            onClick={() => setRemoveAudio(true)}
                                        >
                                            <X size={13} /> Remove
                                        </button>
                                    </div>
                                    <AudioPlayer songId={Number(id)} />
                                </div>
                            )}
                            {removeAudio && (
                                <p className="mb-2 text-xs text-ink-400">
                                    Audio will be removed on save.
                                </p>
                            )}
                            <input
                                type="file"
                                accept="audio/mpeg,.mp3"
                                onChange={(e) => {
                                    setFile(e.target.files?.[0] || null);
                                    setRemoveAudio(false);
                                }}
                                className="w-full text-sm text-ink-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-600 hover:file:bg-blue-100"
                            />
                            {errors.audio?.[0] && (
                                <p className="mt-1 text-xs text-red-500">{errors.audio[0]}</p>
                            )}
                        </div>
                    </Section>
                </Card>

                <Card className="space-y-6">
                    <Section
                        title="Lyrics"
                        hint="Optional. Use [Chord] notation, e.g. [C]Amazing grace. Line breaks are preserved and chords transpose automatically."
                    >
                        <div>
                            <textarea
                                rows={10}
                                className="w-full rounded-xl border border-blue-100 bg-canvas px-3 py-2 font-mono text-sm text-ink-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                value={form.lyrics}
                                placeholder={'[C]Amazing grace how sweet the sound\n[F]That saved a wretch like me'}
                                onChange={(e) => update('lyrics', e.target.value)}
                            />
                            {errors.lyrics?.[0] && (
                                <p className="mt-1 text-xs text-red-500">{errors.lyrics[0]}</p>
                            )}
                        </div>
                    </Section>
                </Card>

                <Card>
                    <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
                        <input
                            type="checkbox"
                            checked={form.is_published}
                            onChange={(e) => update('is_published', e.target.checked)}
                        />
                        Published (visible on the public website)
                    </label>
                </Card>

                <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                        {submitting ? (
                            <Loader2 size={16} className="mr-1 animate-spin" />
                        ) : (
                            <Music2 size={16} className="mr-1" />
                        )}
                        {mode === 'edit' ? 'Save Changes' : 'Create Song'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

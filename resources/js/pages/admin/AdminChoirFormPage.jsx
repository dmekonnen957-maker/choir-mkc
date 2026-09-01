import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, User, Palette } from 'lucide-react';
import { api } from '../../axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';

const EMPTY = {
    name: '',
    choir_type: '',
    description: '',
    church_name: '',
    status: 'active',
    is_public: false,
    team_leader_id: '',
    uniform_primary_color: '#2563eb',
    uniform_secondary_color: '#ffffff',
    uniform_pattern: '',
    uniform_description: '',
};

const CHOIR_TYPES = [
    'Adult Choir',
    "Children's Choir",
    'Youth Choir',
    'Women\'s Choir',
    "Men's Choir",
    'Mixed Choir',
    'Worship Team',
    'Other',
];

function ColorField({ label, value, onChange, error }) {
    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">{label}</label>
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={value || '#000000'}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-blue-100 bg-canvas p-1"
                />
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="#RRGGBB"
                    className="flex-1 rounded-xl border border-blue-100 bg-canvas px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 font-mono"
                    pattern="^#[0-9A-Fa-f]{6}$"
                />
            </div>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}

function ColorPreview({ primary, secondary, pattern }) {
    if (!primary && !secondary) return null;
    return (
        <div className="flex items-center gap-3 rounded-xl border border-blue-50 bg-canvas p-3">
            <div className="flex gap-2">
                {primary && (
                    <span
                        className="h-8 w-8 rounded-full border-2 border-white shadow"
                        style={{ backgroundColor: primary }}
                        title={`Primary: ${primary}`}
                    />
                )}
                {secondary && (
                    <span
                        className="h-8 w-8 rounded-full border-2 border-white shadow"
                        style={{ backgroundColor: secondary }}
                        title={`Secondary: ${secondary}`}
                    />
                )}
            </div>
            <div className="text-xs text-ink-500">
                <p>Primary: <span className="font-mono font-medium text-ink-700">{primary}</span></p>
                <p>Secondary: <span className="font-mono font-medium text-ink-700">{secondary}</span></p>
                {pattern && <p>Pattern: <span className="font-medium text-ink-700">{pattern}</span></p>}
            </div>
        </div>
    );
}

export default function AdminChoirFormPage({ mode = 'create' }) {
    const navigate = useNavigate();
    const { id } = useParams();
    const [form, setForm] = useState(EMPTY);
    const [leaders, setLeaders] = useState([]);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(mode === 'edit');
    const [error, setError] = useState('');

    const loadLeaders = useCallback(() => {
        Promise.all([
            api.get('/admin/users', { params: { role: 'team_leader', status: 'approved', per_page: 200 } }),
            api.get('/admin/users', { params: { role: 'admin', status: 'approved', per_page: 200 } }),
        ])
            .then(([r1, r2]) => {
                const map = new Map();
                [...(r1.data.data.items || []), ...(r2.data.data.items || [])].forEach((u) => {
                    map.set(u.id, u);
                });
                setLeaders([...map.values()]);
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        loadLeaders();
    }, [loadLeaders]);

    useEffect(() => {
        if (mode === 'edit' && id) {
            api.get(`/admin/choirs/${id}`)
                .then((res) => {
                    const c = res.data.data;
                    setForm({
                        name: c.name || '',
                        choir_type: c.choir_type || '',
                        description: c.description || '',
                        church_name: c.church_name || '',
                        status: c.status || 'active',
                        is_public: !!c.is_public,
                        team_leader_id: c.team_leader_id || '',
                        uniform_primary_color: c.uniform_primary_color || '#2563eb',
                        uniform_secondary_color: c.uniform_secondary_color || '#ffffff',
                        uniform_pattern: c.uniform_pattern || '',
                        uniform_description: c.uniform_description || '',
                    });
                    if (c.team_leader && !leaders.some((l) => l.id === c.team_leader.id)) {
                        setLeaders((prev) => [c.team_leader, ...prev]);
                    }
                })
                .catch(() => setError('Failed to load choir.'))
                .finally(() => setLoading(false));
        }
    }, [mode, id, leaders]);

    const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    const submit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});
        setError('');
        const payload = {
            ...form,
            is_public: !!form.is_public,
            team_leader_id: form.team_leader_id ? Number(form.team_leader_id) : null,
        };
        const req =
            mode === 'edit'
                ? api.put(`/admin/choirs/${id}`, payload)
                : api.post('/admin/choirs', payload);

        req
            .then((res) => navigate(`/admin/choirs/${res.data.data.id}`))
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
                {mode === 'edit' ? 'Edit Choir' : 'New Choir'}
            </h1>

            {error && <Alert variant="error">{error}</Alert>}

            <Card>
                <form onSubmit={submit} className="space-y-5">
                    <h2 className="text-base font-semibold text-ink-800">Basic Information</h2>

                    <Input
                        label="Choir Name"
                        value={form.name}
                        onChange={(e) => update('name', e.target.value)}
                        error={errors.name?.[0]}
                        required
                    />

                    <div>
                        <label className="mb-1 block text-sm font-medium text-ink-700">Choir Type</label>
                        <select
                            className="w-full rounded-xl border border-blue-100 bg-canvas px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            value={form.choir_type}
                            onChange={(e) => update('choir_type', e.target.value)}
                        >
                            <option value="">Select choir type</option>
                            {CHOIR_TYPES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                        {errors.choir_type?.[0] && (
                            <p className="mt-1 text-xs text-red-500">{errors.choir_type[0]}</p>
                        )}
                    </div>

                    <Input
                        label="Church / Organization"
                        value={form.church_name}
                        onChange={(e) => update('church_name', e.target.value)}
                        error={errors.church_name?.[0]}
                    />

                    <div>
                        <label className="mb-1 block text-sm font-medium text-ink-700">Description</label>
                        <textarea
                            rows={3}
                            className="w-full rounded-xl border border-blue-100 bg-canvas px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            value={form.description}
                            onChange={(e) => update('description', e.target.value)}
                            placeholder="A short description of this choir..."
                        />
                        {errors.description?.[0] && (
                            <p className="mt-1 text-xs text-red-500">{errors.description[0]}</p>
                        )}
                    </div>

                    {/* Team Leader */}
                    <div>
                        <label className="mb-1 flex items-center gap-1 text-sm font-medium text-ink-700">
                            <User size={14} /> Team Leader
                        </label>
                        <select
                            className="w-full rounded-xl border border-blue-100 bg-canvas px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            value={form.team_leader_id}
                            onChange={(e) => update('team_leader_id', e.target.value)}
                        >
                            <option value="">Select a team leader</option>
                            {leaders.map((l) => (
                                <option key={l.id} value={l.id}>
                                    {l.name} {l.email ? `(${l.email})` : ''}
                                </option>
                            ))}
                        </select>
                        {errors.team_leader_id?.[0] && (
                            <p className="mt-1 text-xs text-red-500">{errors.team_leader_id[0]}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-6">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-ink-700">Status</label>
                            <select
                                className="rounded-xl border border-blue-100 bg-canvas px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                value={form.status}
                                onChange={(e) => update('status', e.target.value)}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        <label className="mt-6 inline-flex items-center gap-2 text-sm text-ink-700">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-blue-200 text-blue-600 focus:ring-blue-200"
                                checked={form.is_public}
                                onChange={(e) => update('is_public', e.target.checked)}
                            />
                            Listed on public registration
                        </label>
                    </div>

                    {/* ── Theme Section ── */}
                    <div className="border-t border-blue-50 pt-5">
                        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-ink-800">
                            <Palette size={16} className="text-blue-500" /> Choir Theme &amp; Uniform
                        </h2>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <ColorField
                                label="Primary Color"
                                value={form.uniform_primary_color}
                                onChange={(v) => update('uniform_primary_color', v)}
                                error={errors.uniform_primary_color?.[0]}
                            />
                            <ColorField
                                label="Secondary Color"
                                value={form.uniform_secondary_color}
                                onChange={(v) => update('uniform_secondary_color', v)}
                                error={errors.uniform_secondary_color?.[0]}
                            />
                        </div>

                        <div className="mt-3">
                            <ColorPreview
                                primary={form.uniform_primary_color}
                                secondary={form.uniform_secondary_color}
                                pattern={form.uniform_pattern}
                            />
                        </div>

                        <div className="mt-4">
                            <Input
                                label="Uniform Pattern"
                                value={form.uniform_pattern}
                                onChange={(e) => update('uniform_pattern', e.target.value)}
                                error={errors.uniform_pattern?.[0]}
                                placeholder="e.g. White Stripes, Solid, Plaid…"
                            />
                        </div>

                        <div className="mt-4">
                            <label className="mb-1 block text-sm font-medium text-ink-700">Uniform Description</label>
                            <textarea
                                rows={2}
                                className="w-full rounded-xl border border-blue-100 bg-canvas px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                value={form.uniform_description}
                                onChange={(e) => update('uniform_description', e.target.value)}
                                placeholder="Describe the choir uniform in detail…"
                            />
                            {errors.uniform_description?.[0] && (
                                <p className="mt-1 text-xs text-red-500">{errors.uniform_description[0]}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? (
                                <Loader2 size={16} className="mr-1 animate-spin" />
                            ) : (
                                <Save size={16} className="mr-1" />
                            )}
                            {mode === 'edit' ? 'Save Changes' : 'Create Choir'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}

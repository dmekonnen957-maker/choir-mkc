import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, User } from 'lucide-react';
import { api } from '../../axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';

const EMPTY = {
    name: '',
    description: '',
    church_name: '',
    status: 'active',
    is_public: false,
    team_leader_id: '',
};

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
                        description: c.description || '',
                        church_name: c.church_name || '',
                        status: c.status || 'active',
                        is_public: !!c.is_public,
                        team_leader_id: c.team_leader_id || '',
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
                    <Input
                        label="Choir Name"
                        value={form.name}
                        onChange={(e) => update('name', e.target.value)}
                        error={errors.name?.[0]}
                        required
                    />

                    <Input
                        label="Church / Organization"
                        value={form.church_name}
                        onChange={(e) => update('church_name', e.target.value)}
                        error={errors.church_name?.[0]}
                    />

                    <div>
                        <label className="mb-1 block text-sm font-medium text-ink-700">Description</label>
                        <textarea
                            rows={4}
                            className="w-full rounded-xl border border-blue-100 bg-canvas px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            value={form.description}
                            onChange={(e) => update('description', e.target.value)}
                            placeholder="A short description of this choir..."
                        />
                        {errors.description?.[0] && (
                            <p className="mt-1 text-xs text-red-500">{errors.description[0]}</p>
                        )}
                    </div>

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
                            {errors.status?.[0] && (
                                <p className="mt-1 text-xs text-red-500">{errors.status[0]}</p>
                            )}
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

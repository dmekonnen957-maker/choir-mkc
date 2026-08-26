import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
    ArrowLeft, Pencil, Users, Music2, CalendarDays, User, Trash2, Power, Loader2, Building2,
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

export default function AdminChoirDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { can } = useAuth();
    const [choir, setChoir] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionError, setActionError] = useState('');
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        setError('');
        api.get(`/admin/choirs/${id}`)
            .then((res) => setChoir(res.data.data))
            .catch(() => setError('Failed to load choir.'))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    const toggleStatus = () => {
        if (!choir) return;
        setBusy(true);
        setActionError('');
        const next = choir.status === 'active' ? 'inactive' : 'active';
        api.put(`/admin/choirs/${id}`, { ...choir, status: next })
            .then(() => load())
            .catch((err) => setActionError(err.response?.data?.message || 'Failed to update status.'))
            .finally(() => setBusy(false));
    };

    const remove = () => {
        if (!window.confirm(
            `Delete "${choir.name}"? This cannot be undone. The choir will be hidden and its members, songs and performances are preserved.`
        )) return;
        setBusy(true);
        setActionError('');
        api.delete(`/admin/choirs/${id}`)
            .then(() => navigate('/admin/choirs'))
            .catch((err) => {
                setActionError(err.response?.data?.message || 'Failed to delete choir.');
                setBusy(false);
            });
    };

    if (loading) {
        return (
            <div className="flex h-48 items-center justify-center">
                <LoadingSpinner text="Loading choir..." />
            </div>
        );
    }

    if (error || !choir) {
        return (
            <div className="space-y-4">
                <button onClick={() => navigate('/admin/choirs')} className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700">
                    <ArrowLeft size={16} /> Back to choirs
                </button>
                <Alert variant="error">{error || 'Choir not found.'}</Alert>
            </div>
        );
    }

    const members = choir.members || [];
    const upcoming = choir.upcoming_performances || [];
    const history = choir.performance_history || [];

    return (
        <div className="space-y-6">
            <button onClick={() => navigate('/admin/choirs')} className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700">
                <ArrowLeft size={16} /> Back to choirs
            </button>

            {actionError && <Alert variant="error">{actionError}</Alert>}

            <Card>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                            <Building2 size={26} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold tracking-tight text-ink-900">{choir.name}</h1>
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                    choir.status === 'active'
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : 'bg-ink-100 text-ink-500'
                                }`}>
                                    {choir.status}
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-ink-500">{choir.church_name || choir.slug}</p>
                            {choir.description && (
                                <p className="mt-2 max-w-xl text-sm text-ink-600">{choir.description}</p>
                            )}
                            <p className="mt-2 inline-flex items-center gap-1 text-sm text-ink-500">
                                <User size={14} /> {choir.team_leader?.name || 'No team leader assigned'}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link to={`/admin/choirs/${choir.id}/edit`}>
                            <Button variant="outline">
                                <Pencil size={15} className="mr-1" /> Edit
                            </Button>
                        </Link>
                        {can('choirs.update') && (
                            <Button variant="outline" onClick={toggleStatus} disabled={busy}>
                                {busy ? <Loader2 size={15} className="mr-1 animate-spin" /> : <Power size={15} className="mr-1" />}
                                {choir.status === 'active' ? 'Deactivate' : 'Activate'}
                            </Button>
                        )}
                        {can('choirs.delete') && (
                            <Button variant="danger" onClick={remove} disabled={busy}>
                                <Trash2 size={15} className="mr-1" /> Delete
                            </Button>
                        )}
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-blue-50 pt-5 text-center">
                    <div>
                        <p className="text-xl font-bold text-ink-900">{choir.member_count ?? 0}</p>
                        <p className="text-xs text-ink-400">Members</p>
                    </div>
                    <div>
                        <p className="text-xl font-bold text-ink-900">{choir.songs_count ?? 0}</p>
                        <p className="text-xs text-ink-400">Songs</p>
                    </div>
                    <div>
                        <p className="text-xl font-bold text-ink-900">{choir.performances_count ?? 0}</p>
                        <p className="text-xs text-ink-400">Performances</p>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink-900">
                        <Users size={18} className="text-blue-500" /> Members ({members.length})
                    </h2>
                    {members.length === 0 ? (
                        <p className="py-6 text-center text-sm text-ink-400">No members yet.</p>
                    ) : (
                        <ul className="divide-y divide-blue-50">
                            {members.map((m) => (
                                <li key={m.id} className="flex items-center justify-between py-2.5">
                                    <div>
                                        <p className="text-sm font-medium text-ink-900">{m.name}</p>
                                        <p className="text-xs text-ink-400">
                                            {m.role || m.email || ''}
                                        </p>
                                    </div>
                                    <span className="text-xs text-ink-400">{m.status}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                <div className="space-y-6">
                    <Card>
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink-900">
                            <CalendarDays size={18} className="text-blue-500" /> Upcoming Performances
                        </h2>
                        {upcoming.length === 0 ? (
                            <p className="py-6 text-center text-sm text-ink-400">None scheduled.</p>
                        ) : (
                            <ul className="space-y-3">
                                {upcoming.map((p) => (
                                    <li key={p.id} className="rounded-xl border border-blue-50 bg-canvas p-3">
                                        <p className="text-sm font-medium text-ink-900">{p.title}</p>
                                        <p className="text-xs text-ink-500">
                                            {formatDate(p.date)}{p.start_time ? ` · ${p.start_time}` : ''}
                                            {p.venue ? ` · ${p.venue}` : ''}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>

                    <Card>
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink-900">
                            <Music2 size={18} className="text-blue-500" /> Performance History
                        </h2>
                        {history.length === 0 ? (
                            <p className="py-6 text-center text-sm text-ink-400">No past performances.</p>
                        ) : (
                            <ul className="space-y-3">
                                {history.map((p) => (
                                    <li key={p.id} className="rounded-xl border border-blue-50 bg-canvas p-3">
                                        <p className="text-sm font-medium text-ink-900">{p.title}</p>
                                        <p className="text-xs text-ink-500">{formatDate(p.date)}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
